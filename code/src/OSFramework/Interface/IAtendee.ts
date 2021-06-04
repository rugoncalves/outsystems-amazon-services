// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace OSFramework.Interface {
    export interface IAtendee {
        uniqueId: string;
        sendMessage(message: string): boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        startConnection(...args): any;
        stopConnection(): boolean;
    }
}
