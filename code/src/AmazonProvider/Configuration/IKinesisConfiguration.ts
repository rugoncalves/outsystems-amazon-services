// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace AmazonProvider.Configuration {
    export interface IKinesisConfiguration extends IAwsCredentials {
        correctClockSkew: boolean;
        endpoint: string;
        forceTurn: boolean;
        natTraversalDisabled: boolean;
        useTrickleICE: boolean;
    }
}
