namespace OSFramework.VideoStreams {
    export abstract class AbstractGenericAtendee<
            Z extends Configuration.IConfigurationVideoStream
        >
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        implements OSFramework.Interface.IAtendee
    {
        private _configs: Z;
        private _uniqueId: string;

        constructor(configs: Z) {
            this._configs = configs;
        }

        public get config(): Z {
            return this._configs;
        }

        public get uniqueId(): string {
            return this._uniqueId;
        }

        public abstract sendMessage(message: string): boolean;

        public abstract startConnection(...args): boolean;

        public abstract stopConnection(): boolean;
    }
}
