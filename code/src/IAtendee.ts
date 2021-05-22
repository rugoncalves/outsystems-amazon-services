namespace AmazonKinesis {
    export interface IAtendee {
        sendMessage(message: string): boolean;
        startConnection(): boolean;
        stopConnection(): boolean;

    }

    export abstract class AbstractAtendee implements IAtendee {
        public sendMessage(message: string): boolean {
            return true;
        }

        public startConnection(): boolean {
            return true;
        }

        public stopConnection(): boolean {
            return true;
        }
    }

    export class Master extends AbstractAtendee {
        private signalingClient: null;
        private peerConnectionByClientId: {};
        private dataChannelByClientId: {};
        private localStream: null;
        private remoteStreams: [];
        private peerConnectionStatsInterval: null;
        private selfVideo: HTMLElement;
        private remoteVideo: HTMLElement;
    }
}