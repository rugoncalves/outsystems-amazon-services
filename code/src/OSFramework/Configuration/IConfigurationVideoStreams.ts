// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace OSFramework.Configuration {
    /**
     * Used to translate configurations from OS to Provider
     * Defines the basic structure for video stream objects
     */
    export interface IConfigurationVideoStream extends IConfiguration {
        channelName: string;
        hasAudioStream: boolean;
        hasVideoStream: boolean;
        localStreamPlayerId: string;
        remoteStreamPlayerId: string;
        widescreen: boolean;
    }
}
