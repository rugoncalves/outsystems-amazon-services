// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace AmazonProvider.Kinesis {
    export class ViewerAtendee extends AbstractKinesisAtendee {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        constructor(configs: any) {
            super(
                Enum.Role.Viewer,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                new AmazonProvider.Kinesis.Configuration.KinesisConfiguration(
                    configs
                )
            );
        }

        public sendMessage(message: string): boolean {
            return super.sendMessage(message);
        }

        public startConnection(): Promise<boolean> {
            super.startConnection();

            return new Promise(() => {
                return true;
            });
        }

        public stopConnection(): boolean {
            throw new Error('Method not implemented.');
        }
    }
}
