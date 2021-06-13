namespace OSFramework.VideoStreams {
    export abstract class AbstractGenericAtendee<
            Z extends Configuration.IConfigurationVideoStream
        >
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        implements OSFramework.Interface.IAtendee
    {
        private _configs: Z;
        private _localView: HTMLVideoElement;
        private _remoteView: HTMLVideoElement;
        private _uniqueId: string;

        constructor(configs: Z) {
            this._configs = configs;
        }

        public get config(): Z {
            return this._configs;
        }

        public get localPlayer(): HTMLVideoElement {
            return this._localView;
        }

        public get remotePlayer(): HTMLVideoElement {
            return this._remoteView;
        }

        public get uniqueId(): string {
            return this._uniqueId;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public startConnection(...args): any {
            this._localView = document.querySelector(
                `#${this._configs.localStreamPlayerId}`
            );
            this._remoteView = document.querySelector(
                `#${this._configs.remoteStreamPlayerId}`
            );
        }

        public stopConnection(): boolean {
            if (this._localView) {
                this._localView.srcObject = undefined;
                this._localView = undefined;
            }
            if (this._remoteView) {
                this._remoteView.srcObject = undefined;
                this._remoteView = undefined;
            }
            return true;
        }

        public abstract sendMessage(message: string): boolean;
    }
}
