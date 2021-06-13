// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace AmazonProvider.Kinesis {
    export function KinesisAtendeeFactory(
        isMaster: boolean,
        configs: any
    ): OSFramework.Interface.IAtendee {
        if (isMaster) {
            return new MasterAtendee(configs);
        } else {
            return new ViewerAtendee(configs);
        }
    }
}
