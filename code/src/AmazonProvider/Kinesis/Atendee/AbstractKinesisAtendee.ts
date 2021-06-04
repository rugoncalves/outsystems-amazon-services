/// <reference types="aws-sdk" />
/// <reference types="../../../../node_modules/amazon-kinesis-video-streams-webrtc/lib/" />
/// <reference path="../../../OSFramework/VideoStreams/AbstractGenericAtendee.ts" />

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

        private _kinesisVideoClient: AWS.KinesisVideo;
        private _role: Enum.Role;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        constructor(configs: any) {
        constructor(role: Enum.Role, configs: any) {
            super(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                new AmazonProvider.Kinesis.Configuration.KinesisConfiguration(
                    configs
                )
            );
            this._role = role;
        }

        public sendMessage(message: string): boolean {
            throw new Error('Method not implemented.');
        }

        public async startConnection(): Promise<boolean> {
            this._kinesisVideoClient = new AWS.KinesisVideo({
                region: this.config.region,
                accessKeyId: this.config.accessKey,
                secretAccessKey: this.config.secreatAccessKey,
                sessionToken: this.config.sessionToken,
                endpoint: this.config.endpoint,
                correctClockSkew: this.config.correctClockSkew
            });
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
            console.log(`[${this._role}] Endpoints: ${endpointsByProtocol}`);

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
            console.log(`[${this._role}] ICE servers: ${iceServers}`);
            // Create Signaling Client
            this.signalingClient = new KVSWebRTC.SignalingClient({
                channelARN,
                channelEndpoint: endpointsByProtocol[Enum.Protocol.WSS],
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

            const configuration = {
                iceServers,
                iceTransportPolicy: this.config.forceTurn ? 'relay' : 'all'
            };

            const resolution = this.config.widescreen
                ? { width: { ideal: 1280 }, height: { ideal: 720 } }
                : { width: { ideal: 640 }, height: { ideal: 480 } };

            const constraints = {
                video: this.config.hasVideoStream ? resolution : false,
                audio: this.config.hasAudioStream
            };

            return new Promise(() => {
                return true;
            });
        }

        public stopConnection(): boolean {
            throw new Error('Method not implemented.');
        }
    }
}
