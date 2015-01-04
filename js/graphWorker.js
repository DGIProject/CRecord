var width = 0, height = 0;

onmessage = function(event) {
    var message = event.data;

    if(message.name == 'setProperties')
    {
        width = message.width;
        height = message.height;
    }
    else if(message.name == 'graphBuffer')
    {
        postMessage({
            'name': 'valuesGraph',
            'values': graphBuffer(message.interleave)
        });
    }
};

function graphBuffer(data) {
    var step = Math.ceil(data.length / width);
    var amp = height / 2;
    var tabValues = [];

    for(var i=0; i < width; i++){
        var min = 1.0;
        var max = -1.0;
        for (var j = 0; j < step; j++) {
            var datum = data[(i*step)+j];
            if (datum < min)
                min = datum;
            if (datum > max)
                max = datum;
        }

        tabValues.push([i, (1+min)*amp, 1, Math.max(1,(max-min)*amp)]);
    }

    return tabValues;
}

postMessage({
    'name': 'ready'
});
