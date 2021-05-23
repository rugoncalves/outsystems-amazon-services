//const AWS = require('@aws-sdk/client-kinesis-video');
//// <reference path="../node_modules/@aws-sdk/client-kinesis-video/dist/types/KinesisVideoClient/KinesisVideoClient.d.ts" />
/// <reference types="aws-sdk" />
/// referece "../node_modules/@aws-sdk/client-kinesis-video/dist/types/KinesisVideoClient";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace AmazonKinesisAPI {
    export function Init(): AWS.KinesisVideoMedia {
        //const client = new AWS.KinesisVideoClient({ region: 'REGION' });
        return new AWS.KinesisVideoMedia({});
    }

    export function StartCall(): unknown {
        return undefined;
    }
}
