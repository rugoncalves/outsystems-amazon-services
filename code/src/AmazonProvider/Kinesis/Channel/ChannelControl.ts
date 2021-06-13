namespace AmazonProvider.Kinesis {
    export async function CreateSignalChannel(
        kinesisObj: AWS.KinesisVideo,
        channelName: string
    ): Promise<void> {
        await kinesisObj
            .createSignalingChannel({
                ChannelName: channelName
            })
            .promise();

        // Get signaling channel ARN
        const describeSignalingChannelResponse = await kinesisObj
            .describeSignalingChannel({
                ChannelName: channelName
            })
            .promise();

        console.log(
            `[CREATE_SIGNALING_CHANNEL] Channel ARN: ${describeSignalingChannelResponse.ChannelInfo.ChannelARN}`
        );
        return Promise.resolve(undefined);
    }

    export async function DeleteSignalingChannel(
        kinesisObj: AWS.KinesisVideo,
        channelName: string
    ): Promise<void> {
        const describeSignalingChannelResponse = await kinesisObj
            .describeSignalingChannel({
                ChannelName: channelName
            })
            .promise();

        // Get signaling channel ARN
        await kinesisObj
            .deleteSignalingChannel({
                ChannelARN:
                    describeSignalingChannelResponse.ChannelInfo.ChannelARN
            })
            .promise();

        console.log(
            `[DELETE_SIGNALING_CHANNEL] Deleted Channel: ${channelName}`
        );

        return Promise.resolve(undefined);
    }
}
