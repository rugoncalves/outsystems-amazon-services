namespace OSFramework.VideoStreams {
    export function VideoStreamFactory(
        Provider: OSFramework.Enum.ProviderType,
        IsMaster: boolean
    ): OSFramework.Interface.IAtendee {
        switch (Provider) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            case OSFramework.Enum.ProviderType.Amazon:
                return AmazonProvider.Kinesis.KinesisAtendeeFactory(IsMaster);
            default:
                throw new Error(`Provider ${Provider} not implemented.`);
        }
    }
}
