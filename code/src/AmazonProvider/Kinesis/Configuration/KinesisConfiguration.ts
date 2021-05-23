/// <reference path="../../../OSFramework/Configuration/AbstractConfiguration.ts" />

namespace AmazonProvider.Kinesis.Configuration {
    export class KinesisConfiguration
        extends OSFramework.Configuration.AbstractConfiguration
        implements
            OSFramework.Configuration.IConfigurationVideoStream,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            AmazonProvider.Configuration.IKinesisConfiguration
    {
        public accessKey: string;
        public channelName: string;
        public correctClockSkew: boolean;
        public endpoint: string;
        public forceTurn: boolean;
        public hasAudioStream: boolean;
        public hasDataChannel: boolean;
        public hasVideoStream: boolean;
        public localStreamPlayerId: string;
        public natTraversalDisabled: boolean;
        public region: string;
        public removeStreamPlayerId: string;
        public secreatAccessKey: string;
        public sessionToken: string;
        public useTrickleICE: boolean; //maybe remove to provider layer

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        constructor(config: any) {
            super(config);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public getProviderConfig(): any {
            throw new Error('Method not implemented.');
        }
    }
}
