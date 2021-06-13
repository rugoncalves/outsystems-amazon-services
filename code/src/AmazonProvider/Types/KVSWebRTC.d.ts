/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare namespace KVSWebRTC {
    export type optionsSignalingClient = {
        channelARN: string;
        channelEndpoint: string;
        clientId: string;
        credentials: {
            accessKeyId: string;
            secretAccessKey: string;
            sessionToken: string;
        };
        region: string;
        role: string;
        systemClockOffset: number;
    };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface StaticSignalingClient {
        close(): void;
        new (options?: optionsSignalingClient): any;
        on(event: string, callback: any): void;
        open(): void;
        sendIceCandidate(candidate: RTCIceCandidate, remoteClientId?: any);
        sendSdpAnswer(
            localDescription: RTCSessionDescription,
            remoteClientId: any
        );
        sendSdpOffer(description: RTCSessionDescription | null);
    }

    export let SignalingClient: StaticSignalingClient;
}
