var countMinutes = 0;
var countSecondes = 0;
var totalSecondes = 0;
var paused = false;
var isStarted = false;
var timeOut = null;

onmessage = function(event) {
    var message = event.data;

    if(message == 'start') {
        isStarted = true;
        countMinutes = 0;
        countSecondes = 0;
        totalSecondes = 0;
        
        chrono();
    }
    else if(message == 'pause')
    {
        if(isStarted) { paused = (!paused); }
    }
    else if(message == 'stop')
    {
        isStarted = false;
        clearTimeout(timeOut);
    }
};

function chrono() {
    if (!paused)
    {
        countSecondes++;
        totalSecondes++;

        if (countSecondes > 59) {
            countSecondes = 0;
            countMinutes++;
        }

        postMessage({
            'totalSeconds' : totalSecondes,
            'seconds' : countSecondes,
            'minutes': countMinutes
        });
    }

    timeOut = setTimeout('chrono()', 1000);
}

postMessage({
    'name': 'ready'
});