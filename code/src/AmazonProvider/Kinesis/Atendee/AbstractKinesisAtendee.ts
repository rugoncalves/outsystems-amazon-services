/// <reference types="aws-sdk" />
/// <reference types="../../../../node_modules/amazon-kinesis-video-streams-webrtc/lib/" />
/// <reference path="../../../OSFramework/VideoStreams/AbstractGenericAtendee.ts" />
/// <reference path="../../Types/KVSWebRTC.d.ts" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace AmazonProvider.Kinesis {
    export abstract class AbstractKinesisAtendee extends OSFramework
        .VideoStreams
        .AbstractGenericAtendee<// eslint-disable-next-line @typescript-eslint/no-unused-vars
    AmazonProvider.Kinesis.Configuration.KinesisConfiguration> {
        // protected signalingClient: any;
        // private peerConnectionByClientId: {};
        // private dataChannelByClientId: {};
        // private localStream: null;
        // private remoteStreams: [];
        // private peerConnectionStatsInterval: null;

        // eslint-disable-next-line @typescript-eslint/naming-convention
        private _configurationRTC: RTCConfiguration;
        private _kinesisVideoClient: AWS.KinesisVideo;
        private _localStream: MediaStream;
        private _mediaStreamConstraints: MediaStreamConstraints;
        private _peerConnection: RTCPeerConnection;
        private _resolution: HelperTypes.IResolution;
        private _role: Enum.Role;
        private _signalingClient: KVSWebRTC.StaticSignalingClient;

        protected peerConnectionStatsInterval: number;

        protected abstract sdpEvent: string;
        public abstract clientId: string;
        public abstract remoteStream: unknown;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        constructor(role: Enum.Role, configs: any) {
            super(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                new AmazonProvider.Kinesis.Configuration.KinesisConfiguration(
                    configs
                )
            );
            this._role = role;
        }

        protected get configurationRTC(): RTCConfiguration {
            return this._configurationRTC;
        }

        protected get kinesisVideoClient(): AWS.KinesisVideo {
            return this._kinesisVideoClient;
        }

        protected get localStream(): MediaStream {
            return this._localStream;
        }

        protected set localStream(ms: MediaStream) {
            this._localStream = ms;
        }

        protected get mediaStreamConstraints(): MediaStreamConstraints {
            return this._mediaStreamConstraints;
        }

        protected get peerConnection(): RTCPeerConnection {
            return this._peerConnection;
        }

        protected set peerConnection(connection: RTCPeerConnection) {
            this._peerConnection = connection;
        }

        protected get resolution(): HelperTypes.IResolution {
            return this._resolution;
        }

        protected get role(): Enum.Role {
            return this._role;
        }

        protected get signalingClient(): KVSWebRTC.StaticSignalingClient {
            return this._signalingClient;
        }

        private _signalCloseEvent(): void {
            console.log(`[${this._role}] Disconnected from signaling channel`);
        }

        private _signalErrorEvent(): void {
            console.error(`[${this._role}] Signaling client error`);
        }

        public async startConnection(): Promise<boolean> {
            super.startConnection();

            this._kinesisVideoClient = new AWS.KinesisVideo({
                region: this.config.region,
                accessKeyId: this.config.accessKey,
                secretAccessKey: this.config.secreatAccessKey,
                sessionToken: this.config.sessionToken,
                endpoint: this.config.endpoint,
                correctClockSkew: this.config.correctClockSkew
            });

            if (this.role === Enum.Role.Master) {
                await CreateSignalChannel(
                    this._kinesisVideoClient,
                    this.config.channelName
                );
            }

            const describeSignalingChannelResponse =
                await this._kinesisVideoClient
                    .describeSignalingChannel({
                        ChannelName: this.config.channelName
                    })
                    .promise();

            // Get signaling channel endpoints
            const channelARN =
                describeSignalingChannelResponse.ChannelInfo.ChannelARN;
            console.log(`[${this._role}] Channel ARN: ${channelARN}`);

            const getSignalingChannelEndpointResponse =
                await this._kinesisVideoClient
                    .getSignalingChannelEndpoint({
                        ChannelARN: channelARN,
                        SingleMasterChannelEndpointConfiguration: {
                            Protocols: [Enum.Protocol.WSS, Enum.Protocol.HTTPS],
                            Role: this._role //KVSWebRTC.Role.VIEWER
                        }
                    })
                    .promise();

            const endpointsByProtocol =
                getSignalingChannelEndpointResponse.ResourceEndpointList.reduce(
                    (endpoints, endpoint) => {
                        endpoints[endpoint.Protocol] =
                            endpoint.ResourceEndpoint;
                        return endpoints;
                    },
                    {}
                );
            console.log(
                `[${this._role}] Endpoints: ${JSON.stringify(
                    endpointsByProtocol
                )}`
            );

            // Get ICE server configuration
            const kinesisVideoSignalingChannelsClient =
                new AWS.KinesisVideoSignalingChannels({
                    region: this.config.region,
                    accessKeyId: this.config.accessKey,
                    secretAccessKey: this.config.secreatAccessKey,
                    sessionToken: this.config.sessionToken,
                    endpoint: endpointsByProtocol[Enum.Protocol.HTTPS],
                    correctClockSkew: true
                });

            const getIceServerConfigResponse =
                await kinesisVideoSignalingChannelsClient
                    .getIceServerConfig({
                        ChannelARN: channelARN
                    })
                    .promise();
            const iceServers = [];
            if (
                this.config.natTraversalDisabled === false &&
                this.config.forceTurn === false
            ) {
                iceServers.push({
                    urls: `stun:stun.kinesisvideo.${this.config.region}.amazonaws.com:443`
                });
            }
            if (this.config.natTraversalDisabled === false) {
                getIceServerConfigResponse.IceServerList.forEach((iceServer) =>
                    iceServers.push({
                        urls: iceServer.Uris,
                        username: iceServer.Username,
                        credential: iceServer.Password
                    })
                );
            }
            console.log(
                `[${this._role}] ICE servers: ${JSON.stringify(iceServers)}`
            );
            // Create Signaling Client

            this._signalingClient = new KVSWebRTC.SignalingClient({
                channelARN,
                channelEndpoint: endpointsByProtocol[Enum.Protocol.WSS],
                clientId: this.clientId,
                role: this._role,
                region: this.config.region,
                credentials: {
                    accessKeyId: this.config.accessKey,
                    secretAccessKey: this.config.secreatAccessKey,
                    sessionToken: this.config.sessionToken
                },
                systemClockOffset:
                    this._kinesisVideoClient.config.systemClockOffset
            });
            this._configurationRTC = {
                iceServers,
                iceTransportPolicy: this.config.forceTurn ? 'relay' : 'all'
            };

            this._resolution = this.config.widescreen
                ? { width: { ideal: 1280 }, height: { ideal: 720 } }
                : { width: { ideal: 640 }, height: { ideal: 480 } };

            this._mediaStreamConstraints = {
                video: this.config.hasVideoStream ? this._resolution : false,
                audio: this.config.hasAudioStream
            };

            this.signalingClient.on('open', this.signalOpenEvent.bind(this));

            this.signalingClient.on(
                this.sdpEvent,
                this.signalSdpEvent.bind(this)
            );

            this.signalingClient.on(
                'iceCandidate',
                this.signalIceCandidateEvent.bind(this)
            );

            this.signalingClient.on('close', this._signalCloseEvent.bind(this));

            this.signalingClient.on('error', this._signalErrorEvent.bind(this));

            return Promise.resolve(true);
        }

        public stopConnection(): boolean | any {
            //rest of the code here;
            super.stopConnection();

            console.log(`[${this.role}] Stopping viewer connection`);
            if (this._signalingClient) {
                this._signalingClient.close();
                this._signalingClient = undefined;
            }

            if (this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
                this.localStream = undefined;
            }

            if (this.peerConnectionStatsInterval) {
                clearInterval(this.peerConnectionStatsInterval);
                this.peerConnectionStatsInterval = undefined;
            }

            return true;
        }

        public abstract sendMessage(message: string): boolean;

        protected abstract signalIceCandidateEvent(...args: unknown[]): void;

        protected abstract signalOpenEvent(): unknown;

        protected abstract signalSdpEvent(...args: unknown[]): unknown;
    }
}
