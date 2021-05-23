// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace OSFramework.Interface {
    export interface IAtendee {
        uniqueId: string;
        sendMessage(message: string): boolean;
        startConnection(): boolean;
        stopConnection(): boolean;
    }
}
