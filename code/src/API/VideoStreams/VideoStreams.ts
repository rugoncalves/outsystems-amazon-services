// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace API.VideoStreams {
    let currentVideoCall: OSFramework.Interface.IAtendee = undefined;

    export function StartCall(configs: any): void {
        if (!currentVideoCall) {
            currentVideoCall = OSFramework.VideoStreams.VideoStreamFactory(
                OSFramework.Enum.ProviderType.Amazon,
                true,
                configs
            );
            currentVideoCall.startConnection();
        } else {
            throw new Error(
                'StartCall: You can only have one call ongoing at a time.'
            );
        }
        return;
    }

    export function JoinCall(configs: any): void {
        if (!currentVideoCall) {
            currentVideoCall = OSFramework.VideoStreams.VideoStreamFactory(
                OSFramework.Enum.ProviderType.Amazon,
                false,
                configs
            );
            currentVideoCall.startConnection();
        } else {
            throw new Error(
                'JoinCall: You can only have one call ongoing at a time.'
            );
        }
        return;
    }

    export function EndCall(): void {
        if (currentVideoCall) {
            currentVideoCall.stopConnection();
            currentVideoCall = undefined;
        } else {
            throw new Error('EndCall: There is no ongoing call.');
        }
        return;
    }

    export function SendMessage(message: string): void {
        if (currentVideoCall) {
            currentVideoCall.sendMessage(message);
        } else {
            throw new Error('SendMessage: There is no ongoing call.');
        }
        return;
    }

    export function GetActiveCall(): OSFramework.Interface.IAtendee {
        return currentVideoCall;
    }
}
