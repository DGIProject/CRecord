onmessage = function(event) {
    var message = event.data;

    if(message.name == 'getInterleave')
    {
        postMessage({
            'name': 'valuesInterleave',
            'interleave': interleave(mergeBuffers(message.leftChannel, message.recordLength), mergeBuffers(message.rightChannel, message.recordLength))
        });
    }
    else if(message.name == 'interleaveGraph')
    {
        postMessage({
            'name': 'valuesInterleaveGraph',
            'interleave': interleave(mergeBuffers(message.leftChannel, message.recordLength), mergeBuffers(message.rightChannel, message.recordLength))
        });
    }
};

function interleave(leftChannel, rightChannel)
{
    var length = leftChannel.length + rightChannel.length;
    var result = new Float32Array(length);
    var inputIndex = 0;

    for (var index = 0; index < length;) {
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
    }

    return result;
}

function mergeBuffers(channelBuffer, recordingLength)
{
    var result = new Float32Array(recordingLength);
    var offset = 0;
    var lng = channelBuffer.length;

    for (var i = 0; i < lng; i++) {
        var buffer = channelBuffer[i];

        result.set(buffer, offset);
        offset += buffer.length;
    }

    return result;
}

postMessage({
    'name': 'ready'
});