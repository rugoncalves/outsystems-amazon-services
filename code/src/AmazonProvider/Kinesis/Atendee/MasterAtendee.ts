// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace AmazonProvider.Kinesis {
    export class MasterAtendee extends AbstractKinesisAtendee {
        private _dataChannelByClientId: Map<string, RTCDataChannel>;
        private _peerConnectionByClientId: Map<string, RTCPeerConnection>;
        private _remoteStreams: MediaStream[];

        protected sdpEvent: string;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        constructor(configs: any) {
            super(
                Enum.Role.Master,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                new AmazonProvider.Kinesis.Configuration.KinesisConfiguration(
                    configs
                )
            );
            this.sdpEvent = 'sdpOffer';
            this._peerConnectionByClientId = new Map<
                string,
                RTCPeerConnection
            >();
            this._dataChannelByClientId = new Map<string, RTCDataChannel>();
        }

        public get clientId(): string {
            return undefined;
        }

        public get remoteStream(): MediaStream[] {
            return this._remoteStreams;
        }

        protected signalIceCandidateEvent(
            candidate: RTCIceCandidate,
            remoteClientId: string
        ): void {
            if (candidate) {
                console.log(
                    `[${this.role}] Generated ICE candidate for client: ${remoteClientId}`
                );

                // When trickle ICE is enabled, send the ICE candidates as they are generated.
                if (this.config.useTrickleICE) {
                    console.log(
                        `[${this.role}] Sending ICE candidate to client: ${remoteClientId}`
                    );
                    this.signalingClient.sendIceCandidate(
                        candidate,
                        remoteClientId
                    );
                }
            } else {
                console.log(
                    `[${this.role}] All ICE candidates have been generated for client: ${remoteClientId}`
                );

                // When trickle ICE is disabled, send the answer now that all the ICE candidates have ben generated.
                if (!this.config.useTrickleICE) {
                    console.log(
                        `[${this.role}] Sending SDP answer to client: ${remoteClientId}`
                    );
                    this.signalingClient.sendSdpAnswer(
                        this.peerConnection.localDescription,
                        remoteClientId
                    );
                }
            }
        }

        protected signalOpenEvent(): void {
            console.log(`[${this.role}] Connected to signaling service`);
        }

        protected async signalSdpEvent(
            offer: RTCSessionDescriptionInit,
            remoteClientId: string
        ): Promise<void> {
            console.log(
                '[MASTER] Received SDP offer from client: ' + remoteClientId
            );

            // Create a new peer connection using the offer from the given client
            const peerConnection = new RTCPeerConnection(this.configurationRTC);
            this._peerConnectionByClientId[remoteClientId] = peerConnection;

            if (this.config.hasDataChannel) {
                this._dataChannelByClientId.set(
                    remoteClientId,
                    peerConnection.createDataChannel('kvsDataChannel')
                );
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                peerConnection.ondatachannel = (event) => {
                    //event.channel.onmessage = onRemoteDataMessage;
                    //TODO
                };
            }

            // Poll for connection stats
            if (!this.peerConnectionStatsInterval) {
                //this.peerConnectionStatsInterval = setInterval(
                //    () => peerConnection.getStats().then(onStatsReport),
                //    1000
                //);
            }

            // Send any ICE candidates to the other peer
            peerConnection.addEventListener('icecandidate', ({ candidate }) => {
                if (candidate) {
                    console.log(
                        `[${this.role}] Generated ICE candidate for client: ${remoteClientId}`
                    );

                    // When trickle ICE is enabled, send the ICE candidates as they are generated.
                    if (this.config.useTrickleICE) {
                        console.log(
                            `[${this.role}] Sending ICE candidate to client: ${remoteClientId}`
                        );
                        this.signalingClient.sendIceCandidate(
                            candidate,
                            remoteClientId
                        );
                    }
                } else {
                    console.log(
                        `[${this.role}] All ICE candidates have been generated for client: ${remoteClientId}`
                    );

                    // When trickle ICE is disabled, send the answer now that all the ICE candidates have ben generated.
                    if (!this.config.useTrickleICE) {
                        console.log(
                            `[${this.role}] Sending SDP answer to client: ${remoteClientId}`
                        );
                        this.signalingClient.sendSdpAnswer(
                            peerConnection.localDescription,
                            remoteClientId
                        );
                    }
                }
            });

            // As remote tracks are received, add them to the remote view
            peerConnection.addEventListener('track', (event: RTCTrackEvent) => {
                console.log(
                    `[${this.role}] Received remote track from client: ${remoteClientId}`
                );
                if (this.remotePlayer.srcObject) {
                    return;
                }
                this.remotePlayer.srcObject = event.streams[0];
            });

            // If there's no video/audio, master.localStream will be null. So, we should skip adding the tracks from it.
            if (this.localStream) {
                this.localStream
                    .getTracks()
                    .forEach((track) =>
                        peerConnection.addTrack(track, this.localStream)
                    );
            }
            await peerConnection.setRemoteDescription(offer);

            // Create an SDP answer to send back to the client
            console.log(
                `[${this.role}] Creating SDP answer for client: ${remoteClientId}`
            );

            await peerConnection.setLocalDescription(
                await peerConnection.createAnswer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                })
            );

            // When trickle ICE is enabled, send the answer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
            if (this.config.useTrickleICE) {
                console.log(
                    `[${this.role}] Sending SDP answer to client: ${remoteClientId}`
                );
                this.signalingClient.sendSdpAnswer(
                    peerConnection.localDescription,
                    remoteClientId
                );
            }
            console.log(
                `[${this.role}] Generating ICE candidates for client: ${remoteClientId}`
            );

            return Promise.resolve(undefined);
        }

        public sendMessage(message: string): boolean {
            if (this.config.hasDataChannel) {
                Object.keys(this._dataChannelByClientId).forEach((clientId) => {
                    try {
                        this._dataChannelByClientId.get(clientId).send(message);
                    } catch (e) {
                        console.error(
                            `[${this.role}] Send DataChannel: ${e.toString()}`
                        );
                    }
                });
                return true;
            }
            return false;
        }

        public async startConnection(): Promise<boolean> {
            await super.startConnection();

            if (this.config.hasVideoStream || this.config.hasAudioStream) {
                try {
                    this.localStream =
                        await navigator.mediaDevices.getUserMedia(
                            this.mediaStreamConstraints
                        );
                    this.localPlayer.srcObject = this.localStream;
                } catch (e) {
                    console.error('[MASTER] Could not find webcam');
                }
            }
            console.log(`[${this.role}] Starting master connection`);
            this.signalingClient.open();

            return Promise.resolve(true);
        }

        public async stopConnection(): Promise<boolean> {
            try {
                await DeleteSignalingChannel(
                    this.kinesisVideoClient,
                    this.config.channelName
                );
            } catch (error) {
                console.error(
                    `[${this.role}] An error occured when deleting the channel: ${error}`
                );
            }

            super.stopConnection();

            Object.keys(this._peerConnectionByClientId).forEach((clientId) => {
                this._peerConnectionByClientId[clientId].close();
            });
            this._peerConnectionByClientId.clear();

            if (this._remoteStreams) {
                this._remoteStreams.forEach((remoteStream) =>
                    remoteStream.getTracks().forEach((track) => track.stop())
                );
                this._remoteStreams = [];
            }

            if (this._dataChannelByClientId) {
                this._dataChannelByClientId.clear();
            }

            return Promise.resolve(true);
        }
    }
}
