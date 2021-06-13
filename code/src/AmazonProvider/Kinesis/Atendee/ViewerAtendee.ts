// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace AmazonProvider.Kinesis {
    export class ViewerAtendee extends AbstractKinesisAtendee {
        private _clientId: string;
        private _dataChannel: RTCDataChannel;
        private _remoteStream: MediaStream;
        protected sdpEvent: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        constructor(configs: any) {
            super(
                Enum.Role.Viewer,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                new AmazonProvider.Kinesis.Configuration.KinesisConfiguration(
                    configs
                )
            );
            this.sdpEvent = 'sdpAnswer';
            this._clientId = OSFramework.Helper.GetRandomClient();
        }

        public get clientId(): string {
            return this._clientId;
        }

        public get remoteStream(): MediaStream {
            return this._remoteStream;
        }

        protected signalIceCandidateEvent(
            candidate: RTCIceCandidateInit | RTCIceCandidate
        ): void {
            // Add the ICE candidate received from the MASTER to the peer connection
            console.log(`[${this.role}] Received ICE candidate`);
            this.peerConnection.addIceCandidate(candidate);
        }

        protected async signalOpenEvent(): Promise<void> {
            console.log(`[${this.role}] Connected to signaling service`);

            // Get a stream from the webcam, add it to the peer connection, and display it in the local view.
            // If no video/audio needed, no need to request for the sources.
            // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
            if (this.config.hasVideoStream || this.config.hasAudioStream) {
                try {
                    this.localStream =
                        await navigator.mediaDevices.getUserMedia(
                            this.mediaStreamConstraints
                        );
                    this.localStream
                        .getTracks()
                        .forEach((track) =>
                            this.peerConnection.addTrack(
                                track,
                                this.localStream
                            )
                        );
                    this.localPlayer.srcObject = this.localStream;
                } catch (e) {
                    console.error(`[${this.role}] Could not find webcam`);
                    return;
                }
            }

            // Create an SDP offer to send to the master
            console.log(`[${this.role}] Creating SDP offer`);
            await this.peerConnection.setLocalDescription(
                await this.peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                })
            );

            // When trickle ICE is enabled, send the offer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
            if (this.config.useTrickleICE) {
                console.log(`[${this.role}] Sending SDP offer`);
                this.signalingClient.sendSdpOffer(
                    this.peerConnection.localDescription
                );
            }
            console.log(`[${this.role}] Generating ICE candidates`);

            return Promise.resolve(undefined);
        }

        protected async signalSdpEvent(
            answer: RTCSessionDescriptionInit
        ): Promise<void> {
            // Add the SDP answer to the peer connection
            console.log(`[${this.role}] Received SDP answer`);
            await this.peerConnection.setRemoteDescription(answer);

            return Promise.resolve(undefined);
        }

        public sendMessage(message: string): boolean {
            if (this._dataChannel) {
                try {
                    this._dataChannel.send(message);
                    return true;
                } catch (e) {
                    console.error(
                        `[${this.role}] Send DataChannel: ${e.toString()}`
                    );
                }
            }
            return false;
        }

        public async startConnection(): Promise<boolean> {
            await super.startConnection();

            this.peerConnection = new RTCPeerConnection(this.configurationRTC);

            if (this.config.hasDataChannel) {
                this._dataChannel =
                    this.peerConnection.createDataChannel('kvsDataChannel');
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                this.peerConnection.ondatachannel = (event) => {
                    //event.channel.onmessage = onRemoteDataMessage;
                    //TODO: check what is happening here.
                };
            }

            // Send any ICE candidates to the other peer
            this.peerConnection.addEventListener(
                'icecandidate',
                ({ candidate }) => {
                    if (candidate) {
                        console.log(`[${this.role}] Generated ICE candidate`);

                        // When trickle ICE is enabled, send the ICE candidates as they are generated.
                        if (this.config.useTrickleICE) {
                            console.log(
                                `[${this.role}]  Sending ICE candidate`
                            );
                            this.signalingClient.sendIceCandidate(candidate);
                        }
                    } else {
                        console.log(
                            `[${this.role}] All ICE candidates have been generated`
                        );

                        // When trickle ICE is disabled, send the offer now that all the ICE candidates have ben generated.
                        if (!this.config.useTrickleICE) {
                            console.log(`[${this.role}]  Sending SDP offer`);
                            this.signalingClient.sendSdpOffer(
                                this.peerConnection.localDescription
                            );
                        }
                    }
                }
            );

            // As remote tracks are received, add them to the remote view
            this.peerConnection.addEventListener('track', (event) => {
                console.log(`[${this.role}] Received remote track`);
                if (this.remotePlayer.srcObject) {
                    return;
                }
                this._remoteStream = event.streams[0];
                this.remotePlayer.srcObject = this._remoteStream;
            });

            console.log(`[${this.role}] Starting viewer connection`);
            this.signalingClient.open();

            //this.peerConnectionStatsInterval = setInterval(
            //    () => this.peerConnection.getStats().then(onStatsReport),
            //    1000
            //);

            return Promise.resolve(true);
        }

        public stopConnection(): boolean {
            super.stopConnection();

            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = undefined;
            }

            if (this._remoteStream) {
                this._remoteStream.getTracks().forEach((track) => track.stop());
                this._remoteStream = undefined;
            }

            if (this._dataChannel) {
                this._dataChannel = null;
            }

            return true;
        }
    }
}
