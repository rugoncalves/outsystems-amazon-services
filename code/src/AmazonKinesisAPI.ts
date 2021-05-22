const AWS = require('@aws-sdk/client-kinesis-video');

export namespace AmazonKinesisAPI {
    export function Init() {
        const client = new AWS.KinesisVideoClient({ region: "REGION" });
        
    }

    export function startCall() {
        
    }

}