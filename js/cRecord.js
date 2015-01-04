var MODE = {
    RECORD: 0,
    FILE: 1,
    BOTH: 2
};

var RECORD_STATE = {
    RECORDING: 0,
    PAUSE_RECORD: 1,
    STOP: 2,
    PLAY: 3,
    PAUSE: 4
};

var RECORD_TYPE = {
    RECORD: 0,
    FILE: 1
};

function cRecord(name, htmlId, size) {
    this.name = name;
    this.htmlId = htmlId;
    this.size = size;

    this.clock = new Worker('http://clangue.net/modules/CRecord/js/chronoWorker.js');
    this.graph = new Worker('http://clangue.net/modules/CRecord/js/graphWorker.js');
    this.merge = new Worker('http://clangue.net/modules/CRecord/js/mergeWorker.js');
    
    this.clock.onmessage = function(event) {
        if (event.data.name == 'ready')
        {
            console.log('chronoWorker : ready');
        }
        else
        {
            cRecord.updateTimeRecord(event.data.minutes, event.data.seconds);
            cRecord.eId('textRecordDuration').innerHTML = event.data.minutes + ' minute(s), ' + event.data.seconds + ' seconde(s)';

            var currentRecord = cRecord.tabRecords[cRecord.currentRecordId];

            cRecord.merge.postMessage({name: 'interleaveGraph', leftChannel: currentRecord.leftChannel, rightChannel: currentRecord.rightChannel, recordLength: currentRecord.recordLength});
        }
    };

    this.graph.onmessage = function(event) {
        if(event.data.name == 'ready')
        {
            console.log('graphWorker : ready');
        }
        else if(event.data.name == 'valuesGraph')
        {
            cRecord.contextGraph.fillStyle = '#FFFFFF';
            cRecord.contextGraph.fillRect(0, 0, cRecord.contextGraph.width, cRecord.contextGraph.height);

            for(var i = 0; i < event.data.values.length; i++)
            {
                cRecord.contextGraph.fillStyle = '#989898';
                cRecord.contextGraph.fillRect(event.data.values[i][0], event.data.values[i][1], event.data.values[i][2], event.data.values[i][3]);
            }
        }
        else
        {
            cRecord.haveError('BAD_RETURN_GRAPHWORKER');
        }
    };

    this.merge.onmessage = function(event) {
        if(event.data.name == 'ready')
        {
            console.log('mergeWorker : ready');
        }
        else if(event.data.name == 'valuesInterleave')
        {
            cRecord.saveRecord(event.data.interleave);
        }
        else if(event.data.name == 'valuesInterleaveGraph')
        {
            cRecord.graph.postMessage({name: 'graphBuffer', interleave: event.data.interleave});
        }
        else
        {
            cRecord.haveError('BAD_RETURN_MERGEWORKER');
        }
    };
}

cRecord.prototype.updateTimeRecord = function(minutes, seconds) {
    this.tabRecords[this.currentRecordId].duration++;
    this.tabRecords[this.currentRecordId].time = {m: minutes, s: seconds};
};

cRecord.prototype.startModule = function() {
    $('#startOralModal').modal('show');

    this.loadInterface();
};

cRecord.prototype.buttonSuccess = function(button, div) {
    this.hideAllDiv();
    this.removeButtonSuccess();

    button.classList.remove('btn-info');
    button.classList.add('btn-success');
    this.eId(div).style.display = '';
};

cRecord.prototype.removeButtonSuccess = function() {
    this.eId('buttonOnlineRecord').classList.remove('btn-success');
    this.eId('buttonFileRecord').classList.remove('btn-success');
    this.eId('buttonMailRecord').classList.remove('btn-success');

    this.eId('buttonOnlineRecord').classList.add('btn-info');
    this.eId('buttonFileRecord').classList.add('btn-info');
    this.eId('buttonMailRecord').classList.add('btn-info');
};

cRecord.prototype.hideAllDiv = function() {
    this.eId('onlineRecord').style.display = 'none';
    this.eId('fileRecord').style.display = 'none';
    this.eId('mailRecord').style.display = 'none';
};

cRecord.prototype.loadInterface = function() {
    console.log('loadInterface');

    this.eId('messageLoad').innerHTML = 'Création de l\'interface (1/4)';

    /*
    var panel = this.createElement('panel', 'div', 'panel panel-default', null, this.size);
    var panelBody = this.createElement('panelBody', 'div', 'panel-body', null, null);

    //var loadSystem = this.createElement('loadSystem', 'div', null, 'text-align: center;', null);
    //var errorSystem = this.createElement('errorSystem', 'div', null, 'text-align: center;display: none;', null);
    //var systemElements = this.createElement('systemElements', 'div', null, 'display: none;', null);

    //var recordPart = this.createElement('recordPart', 'div', null, null);
    //var filePart = this.createElement('filePart', 'div', null, null);

    if(this.mode == MODE.BOTH)
    {
        this.currentMode = MODE.RECORD;

        systemElements.appendChild(recordPart);
        systemElements.appendChild(filePart);
    }
    else if(this.mode == MODE.RECORD)
    {
        this.currentMode = MODE.RECORD;

        systemElements.appendChild(recordPart);
    }
    else if(this.mode == MODE.FILE)
    {
        this.currentMode = MODE.FILE;

        systemElements.appendChild(filePart);
    }
    else
    {
        this.haveError('LOAD_MODE');
    }

    panel.appendChild(panelBody);

    this.eId(this.htmlId).appendChild(panel);
    */

    this.eId('buttonRecord').onclick = function() {
        cRecord.buttonRecord();
    };

    this.eId('buttonPlay').onclick = function() {
        cRecord.buttonPlay();
    };

    this.eId('buttonStop').onclick = function() {
        cRecord.buttonStop();
    };

    this.eId('buttonExternalFile').onclick = function() {
        $('#externalFile').click();
    };

    this.eId('externalFile').onchange = function() {
        cRecord.newFile();
    };

    this.eId('buttonUploadRecord').onclick = function() {
        cRecord.uploadRecord();
    };

    this.eId('buttonStartUpload').onclick = function() {
        cRecord.startUpload();
    };

    this.eId('buttonRecordPart').onclick = function() {
        console.log('test');
        cRecord.recordPart();
    };

    this.eId('buttonFilePart').onclick = function() {
        cRecord.filePart();
    };

    this.loadProperties();
};

cRecord.prototype.loadProperties = function() {
    this.eId('messageLoad').innerHTML = 'Chargement des propriétés (2/4)';

    var xhr = null;

    if (window.XMLHttpRequest || window.ActiveXObject)
    {
        if (window.ActiveXObject)
        {
            try
            {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch(e)
            {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
        }
        else
        {
            xhr = new XMLHttpRequest();
        }

        xhr.open("GET", 'http://clangue.net/modules/CRecord/properties/properties.json', false);
        xhr.send(null);
        if(xhr.readyState != 4 || (xhr.status != 200 && xhr.status != 0))
            this.haveError('NOT_PROPERTIES_PROPERTIES');

        this.properties = JSON.parse(xhr.responseText);

        xhr.open("GET", 'http://clangue.net/modules/CRecord/properties/errors.json', false);
        xhr.send(null);
        if(xhr.readyState != 4 || (xhr.status != 200 && xhr.status != 0))
            this.haveError('NOT_PROPERTIES_ERRORS');

        this.errors = JSON.parse(xhr.responseText);

        this.authorizeMicrophone();
    }
    else
    {
        this.haveError('NOT_PROPERTIES');
    }
};

cRecord.prototype.authorizeMicrophone = function() {
    console.log('authorizeMicrophone');

    this.eId('messageLoad').innerHTML = 'Vérification du microphone (3/4)';

    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if(navigator.getUserMedia)
    {
        console.log('compatible browser');

        this.eId('compatibleBrowser').style.borderColor = '#d6e9c6';
        this.eId('compatibleBrowser').innerHTML = '<div class="alert alert-success">Votre navigateur est compatible.</div>';

        this.eId('isCompatibleBrowser').style.display = '';

        navigator.getUserMedia({audio:true}, this.audioProperties, function(e) {
            //cRecord.haveError('NOT_MICROPHONE');

            cRecord.eId('compatibleBrowser').style.borderColor = '#faebcc';
            cRecord.eId('compatibleBrowser').innerHTML = '<div class="alert alert-warning">Nous ne détectons la présence d\'aucun microphone. <a href="#" onclick="location.reload();">Rafraîchir la page.</a></div>';

            cRecord.eId('isCompatibleBrowser').style.display = 'none';
        });
    }
    else
    {
        //this.haveError('NOT_COMPATIBLE_BROWSER');

        this.eId('compatibleBrowser').style.borderColor = '#ebccd1';
        this.eId('compatibleBrowser').innerHTML = '<div class="alert alert-danger">Votre navigateur n\'est pas compatible avec le système d\'enregistrement. Vous devez utiliser les dernières versions de <span class="strong">Chrome</span> ou <span class="strong">Firefox</span>.</div>';
    }
};

cRecord.prototype.audioProperties = function(e) {
    console.log('audioProperties');

    $('#startOralModal').modal('hide');

    cRecord.eId('messageLoad').innerHTML = 'Mise en place des propriétés audio (4/4)';

    cRecord.audioElement = document.createElement('audio');

    cRecord.audioElement.onended = function() {
        cRecord.buttonStop();
    };

    // creates the audio context
    var audioContext = window.AudioContext || window.webkitAudioContext;
    cRecord.context = new audioContext();

    // creates a gain node
    cRecord.volume = cRecord.context.createGain();

    // creates an audio node from the microphone incoming stream
    cRecord.audioInput = cRecord.context.createMediaStreamSource(e);

    //meter = createAudioMeter(context);
    //audioInput.connect(meter);

    // connect the stream to the gain node
    cRecord.audioInput.connect(cRecord.volume);

    cRecord.recorder = cRecord.context.createScriptProcessor(2048, 2, 2);

    /*
    cRecord.recorder.clipping = false;
    cRecord.recorder.lastClip = 0;
    cRecord.recorder.clipLag = 750;
    cRecord.recorder.clipLevel = 0.98;
    cRecord.recorder.averaging = 0.95;

    cRecord.recorder.checkClipping = function() {
        if (!this.clipping)
            return false;
        if ((this.lastClip + this.clipLag) < window.performance.now())
            this.clipping = false;
        return this.clipping;
    };
    */

    cRecord.recorder.onaudioprocess = function(e) {
        var left = e.inputBuffer.getChannelData(0);
        var right = e.inputBuffer.getChannelData(1);

        /*
        var sum = 0;
        var x;

        // Do a root-mean-square on the samples: sum up the squares...
        for (var i=0; i<left.length; i++) {
            x = left[i];
            if (Math.abs(x)>=this.clipLevel) {
                this.clipping = true;
                this.lastClip = window.performance.now();
            }
            sum += x * x;
        }

        // ... then take the square root of the sum.
        var rms =  Math.sqrt(sum / left.length);

        // Now smooth this out with the averaging factor applied
        // to the previous sample - take the max here because we
        // want "fast attack, slow release."
        this.volume = Math.max(rms, this.volume*this.averaging);

        console.log(this.volume, this.lastClip);
        */

        cRecord.liveRecord(left, right);
    };

    // we connect the recorder
    cRecord.volume.connect(cRecord.recorder);
    cRecord.recorder.connect(cRecord.context.destination);

    cRecord.readyToStartRecord(cRecord.context, cRecord.volume);
};

cRecord.prototype.liveRecord = function(left, right) {
    if(this.recordState == RECORD_STATE.RECORDING)
    {
        this.tabRecords[this.currentRecordId].updateChannels(new Float32Array(left), new Float32Array(right), this.bufferSize);
    }
};

cRecord.prototype.readyToStartRecord = function(context, volume) {
    console.log('readyToStartRecord');

    this.context = context;
    this.volume = volume;

    this.bufferSize = 2048;
    this.sampleRate = 44100;

    this.recordState = RECORD_STATE.STOP;
    this.currentRecordId = 0;
    this.tabRecords = [];
    this.canRecord = true;

    this.canvasGraph = this.eId('waveDisplay');
    this.contextGraph = this.canvasGraph.getContext('2d');

    this.contextGraph.width = this.canvasGraph.width;
    this.contextGraph.height = this.canvasGraph.height;

    this.graph.postMessage({name: 'setProperties', width: this.contextGraph.width, height: this.contextGraph.height});

    this.contextGraph.fillStyle = '#989898';
    this.contextGraph.fillText('Aucune donnée.', (this.canvasGraph.width /2) - 35, (this.canvasGraph.height / 2));

    this.eId('buttonRecord').disabled = false;
    this.eId('buttonPlay').disabled = true;
    this.eId('buttonStop').disabled = true;

    this.eId('buttonDownloadRecord').href = '#';
    this.eId('buttonDownloadRecord').classList.add('disabled');

    this.eId('buttonUploadRecord').disabled = true;

    $('#startOralModal').modal('hide');

    this.eId('loadSystem').style.display = 'none';
    this.eId('errorSystem').style.display = 'none';
    this.eId('systemElements').style.display = '';

    this.mode = MODE.BOTH;
};

cRecord.prototype.readyToStartFile = function() {
    console.log('readyToStartFile');

    this.currentRecordId = 0;
    this.tabRecords = [];
    this.canRecord = false;

    this.audioElement = document.createElement('audio');

    this.audioElement.onended = function() {
        cRecord.buttonStop();
    };

    this.canvasGraph = this.eId('waveDisplay');
    this.contextGraph = this.canvasGraph.getContext('2d');

    this.contextGraph.width = this.canvasGraph.width;
    this.contextGraph.height = this.canvasGraph.height;

    this.graph.postMessage({name: 'setProperties', width: this.contextGraph.width, height: this.contextGraph.height});

    this.contextGraph.fillStyle = '#989898';
    this.contextGraph.fillText('Aucune donnée.', (this.canvasGraph.width /2) - 35, (this.canvasGraph.height / 2));

    $('#startOralModal').modal('hide');

    this.eId('buttonRecord').disabled = true;
    this.eId('buttonPlay').disabled = true;
    this.eId('buttonStop').disabled = true;
    this.eId('buttonUploadRecord').disabled = true;

    this.eId('loadSystem').style.display = 'none';
    this.eId('errorSystem').style.display = 'none';
    this.eId('systemElements').style.display = '';

    this.filePart();

    this.mode = MODE.FILE;
};

cRecord.prototype.recordPart = function() {
    $('#filePart').fadeTo(250, 0);

    setTimeout(function() {
        cRecord.eId('filePart').style.display = 'none';
        cRecord.eId('recordPart').style.display = '';

        $('#recordPart').fadeTo(250, 1);
    }, 250);

    this.eId('buttonFilePart').classList.remove('active');
    this.eId('buttonRecordPart').classList.add('active');

    this.currentMode = MODE.RECORD;
};

cRecord.prototype.filePart = function() {
    $('#recordPart').fadeTo(250, 0);

    setTimeout(function() {
        cRecord.eId('recordPart').style.display = 'none';
        cRecord.eId('filePart').style.display = '';

        $('#filePart').fadeTo(250, 1);
    }, 250);

    this.eId('buttonRecordPart').classList.remove('active');
    this.eId('buttonFilePart').classList.add('active');

    this.currentMode = MODE.FILE;
};

cRecord.prototype.animateElement = function(id, display) {
    $('#' + id).fadeTo(250, (display) ? 1 : 0);
    setTimeout(function() { cRecord.eId(id).style.display = (display) ? '' : 'none'; }, 250);
};

cRecord.prototype.newRecord = function() {
    this.currentRecordId = this.tabRecords.length;

    if(this.tabRecords.length == 0)
    {
        this.eId('listRecords').innerHTML = '';
    }

    this.notActiveRecords();

    var recordElement = this.createElement('record' + this.currentRecordId, 'a', 'list-group-item recordElement active', null, null);
    recordElement.innerHTML = '<h5 class="list-group-item-heading">ENR. ' + (this.currentRecordId + 1) + '</h5><p id="recordTime' + this.currentRecordId + '" class="list-group-item-text" style="font-size: 10px;">--</p>';

    var recordId = this.currentRecordId;

    recordElement.onclick = function() {
        cRecord.loadRecord(recordId);
        cRecord.downloadRecord(recordId);
    };

    this.eId('listRecords').appendChild(recordElement);

    this.tabRecords.push(new record(this.currentRecordId, RECORD_TYPE.RECORD, 'record' + (this.currentRecordId + 1)));
};

cRecord.prototype.loadRecord = function(id) {
    this.buttonStop();

    this.currentRecordId = id;

    var selectedRecord = this.tabRecords[id];

    this.audioElement.setAttribute('src', (window.URL || window.webkitURL).createObjectURL(selectedRecord.dataRecord));

    this.merge.postMessage({name: 'interleaveGraph', leftChannel: selectedRecord.leftChannel, rightChannel: selectedRecord.rightChannel, recordLength: selectedRecord.recordLength});

    this.eId('buttonPlay').disabled = false;
    this.eId('buttonUploadRecord').disabled = false;

    this.eId('textRecordDuration').innerHTML = (selectedRecord.time.m + ' minutes(s), ' + selectedRecord.time.s + ' seconde(s)');

    this.notActiveRecords();

    this.eId('record' + id).classList.add('active');
};

cRecord.prototype.newFile = function() {
    var externalFile = this.eId('externalFile').files[0];
    var externalFileName = externalFile.name;

    this.currentRecordId = this.tabRecords.length;

    if(this.tabRecords.length == 0)
    {
        this.eId('listRecords').innerHTML = '';
    }

    var recordElement = this.createElement('record' + this.currentRecordId, 'a', 'list-group-item recordElement', null, null);
    recordElement.innerHTML = '<h5 class="list-group-item-heading">' + this.compressName(externalFileName.split('.')[0]) + '</h5><p id="recordTime' + this.currentRecordId + '" class="list-group-item-text" style="font-size: 10px;">FICHIER - ' + String.toLowerCase(externalFileName.split('.')[externalFileName.split('.').length - 1]) + '</p>';

    var recordId = this.currentRecordId;

    recordElement.onclick = function() {
        cRecord.loadFile(recordId);
    };

    this.eId('listRecords').appendChild(recordElement);

    this.tabRecords.push(new record(this.currentRecordId, RECORD_TYPE.FILE, externalFileName));

    this.tabRecords[this.currentRecordId].dataRecord = externalFile;

    this.loadFile(recordId);
    this.recordPart();
};

cRecord.prototype.loadFile = function(id) {
    console.log(id);

    this.buttonStop();

    this.currentRecordId = id;

    var selectedRecord = this.tabRecords[id];

    console.log(selectedRecord.name);

    this.audioElement.setAttribute('src', (window.URL || window.webkitURL).createObjectURL(selectedRecord.dataRecord));

    this.contextGraph.fillStyle = '#FFFFFF';
    this.contextGraph.fillRect(0, 0, this.contextGraph.width, this.contextGraph.height);

    this.contextGraph.fillStyle = '#989898';
    this.contextGraph.fillText('Aucune donnée.', (this.canvasGraph.width /2) - 35, (this.canvasGraph.height / 2));

    this.eId('buttonUploadRecord').disabled = false;

    this.eId('buttonDownloadRecord').classList.add('disabled');

    if(this.supportedFormat(selectedRecord.name))
    {
        this.eId('buttonPlay').disabled = false;
        this.eId('textRecordDuration').innerHTML = 'Vous pouvez écouter ce fichier.';
    }
    else
    {
        this.eId('buttonPlay').disabled = true;
        this.eId('textRecordDuration').innerHTML = 'Fichier non compatible avec le lecteur.';
    }

    this.notActiveRecords();

    this.eId('record' + id).classList.add('active');
};

cRecord.prototype.supportedFormat = function(fileName) {
    var extension = String.toLowerCase(fileName.split('.')[fileName.split('.').length - 1]);

    switch(extension) {
        case 'mp3':
            return true;
        case 'wav':
            return true;
        case 'ogg':
            return true;
        default:
            return false;
    }
};

cRecord.prototype.notActiveRecords = function() {
    for(var i = 0; i < this.tabRecords.length; i++)
    {
        this.eId('record' + i).classList.remove('active');
    }
};

cRecord.prototype.buttonRecord = function() {
    if(this.canRecord)
    {
        this.eId('buttonDownloadRecord').classList.add('disabled');

        this.eId('buttonUploadRecord').disabled = true;
        this.eId('listRecords').disabled = true;

        if(this.recordState == RECORD_STATE.RECORDING)
        {
            this.eId('buttonStop').disabled = true;

            this.eId('statusRecord').innerHTML = 'Enregistrement en pause.';
            this.eId('buttonRecord').innerHTML = '<span class="glyphicon glyphicon-record"></span>';

            this.pauseRecord();
        }
        else
        {
            this.eId('statusRecord').innerHTML = 'Enregistrement en cours.';
            this.eId('buttonRecord').innerHTML = '<span class="glyphicon glyphicon-pause"></span>';
            this.eId('buttonRecord').disabled = false;
            
            this.clock.postMessage('pause');
            
            if(this.recordState != RECORD_STATE.PAUSE_RECORD)
            {
                this.newRecord();
                this.clock.postMessage('start');

                this.animateElement('buttonPlay', false);
                this.eId('buttonPlay').disabled = true;
            }

            this.eId('buttonStop').disabled = false;

            this.recordState = RECORD_STATE.RECORDING;
        }
    }
};

cRecord.prototype.buttonPlay = function() {
    if(this.recordState == RECORD_STATE.PLAY)
    {
        this.eId('statusRecord').innerHTML = 'Lecture de l\'enregistrement en pause.';
        this.eId('buttonRecord').disabled = true;
        this.eId('buttonPlay').innerHTML = '<span class="glyphicon glyphicon-play"></span>';
        this.eId('buttonStop').disabled = true;

        this.eId('buttonUploadRecord').disabled = true;

        this.pausePlayRecord();

        this.recordState = RECORD_STATE.PAUSE;
    }
    else
    {
        this.eId('statusRecord').innerHTML = 'Lecture de l\'enregistrement.';
        this.eId('buttonRecord').disabled = true;
        this.eId('buttonPlay').innerHTML = '<span class="glyphicon glyphicon-pause"></span>';
        this.eId('buttonStop').disabled = false;

        this.eId('buttonUploadRecord').disabled = true;

        this.playRecord();

        this.recordState = RECORD_STATE.PLAY;
    }
};

cRecord.prototype.buttonStop = function() {
    this.eId('statusRecord').innerHTML = 'Prêt pour un enregistrement.';
    this.eId('listRecords').disabled = false;

    if(this.mode == MODE.BOTH || this.mode == MODE.RECORD)
    {
        this.eId('buttonRecord').innerHTML = '<span class="glyphicon glyphicon-record"></span>';
        this.eId('buttonRecord').disabled = false;
    }

    this.animateElement('buttonPlay', true);
    this.eId('buttonPlay').innerHTML = '<span class="glyphicon glyphicon-play"></span>';
    this.eId('buttonPlay').disabled = false;

    this.eId('buttonStop').disabled = true;

    this.eId('buttonUploadRecord').disabled = false;

    if(this.canRecord && this.recordState == RECORD_STATE.RECORDING)
    {
        this.stopRecord();

        var currentRecord = this.tabRecords[this.currentRecordId];

        this.eId('recordTime' + this.currentRecordId).innerHTML = ((currentRecord.time.m < 10) ? '0' : '') + currentRecord.time.m + ':' + ((currentRecord.time.s < 10) ? '0' : '') + currentRecord.time.s + ' - ENR.';
    }
    else if(this.recordState == RECORD_STATE.PLAY)
    {
        this.stopPlayRecord();
    }
};

cRecord.prototype.startRecord = function() {
    if(this.canRecord)
    {
        this.clock.postMessage('play');
        this.recordState = RECORD_STATE.RECORDING;
    }
};

cRecord.prototype.pauseRecord = function() {
    if(this.canRecord && this.recordState == RECORD_STATE.RECORDING)
    {
        this.clock.postMessage('pause');
        this.recordState = RECORD_STATE.PAUSE_RECORD;
    }
};

cRecord.prototype.stopRecord = function() {
    console.log('stopRecord');

    if(this.canRecord && this.recordState == RECORD_STATE.RECORDING)
    {

        var record = this.tabRecords[this.currentRecordId];

        this.merge.postMessage({name: 'getInterleave', leftChannel: record.leftChannel, rightChannel: record.rightChannel, recordLength: record.recordLength});
        this.clock.postMessage('stop');

        this.recordState = RECORD_STATE.STOP;
    }
};

cRecord.prototype.playRecord = function() {
    this.audioElement.play();
    this.recordState = RECORD_STATE.PLAY;
};

cRecord.prototype.pausePlayRecord = function() {
    this.audioElement.pause();
    this.recordState = RECORD_STATE.PAUSE;
};

cRecord.prototype.stopPlayRecord = function() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;

    this.recordState = RECORD_STATE.STOP;
};

cRecord.prototype.saveRecord = function(interleaved) {
    console.log('saveRecord');

    var buffer = new ArrayBuffer(44 + interleaved.length * 2);
    var view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 44 + interleaved.length * 2, true);
    this.writeUTFBytes(view, 8, 'WAVE');
    // FMT sub-chunk
    this.writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    // stereo (2 channels)
    view.setUint16(22, 2, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    // data sub-chunk
    this.writeUTFBytes(view, 36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    // write the PCM samples
    var lng = interleaved.length;
    var index = 44;
    var volume = 1;
    for (var i = 0; i < lng; i++) {
        view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
        index += 2;
    }

    var blob = new Blob([view], {
        type: 'audio/wav'
    });

    this.tabRecords[this.currentRecordId].dataRecord = blob;
    this.audioElement.setAttribute('src', (window.URL || window.webkitURL).createObjectURL(blob));

    this.downloadRecord(this.currentRecordId);

    console.log('saved record');
};

cRecord.prototype.writeUTFBytes = function(view, offset, string) {
    var lng = string.length;

    for (var i = 0; i < lng; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

cRecord.prototype.downloadRecord = function(recordId) {
    console.log('downloadRecord');

    this.eId('buttonDownloadRecord').href = (window.URL || window.webkitURL).createObjectURL(this.tabRecords[recordId].dataRecord);
    this.eId('buttonDownloadRecord').download = this.tabRecords[recordId].name + '.wav';
    this.eId('buttonDownloadRecord').classList.remove('disabled');
};

cRecord.prototype.uploadRecord = function() {
    if(this.tabRecords.length > 0)
    {
        var currentRecord = this.tabRecords[this.currentRecordId];

        this.eId('recordName').innerHTML = currentRecord.name;

        this.eId('buttonLastDownload').href = (window.URL || window.webkitURL).createObjectURL(currentRecord.dataRecord);
        this.eId('buttonLastDownload').download = currentRecord.name + '.wav';

        $('#uploadRecordModal').modal('show');
    }
    else
    {
        this.haveError('NOT_RECORDS');
    }
};

cRecord.prototype.startUpload = function() {
    $('#uploadRecordModal').modal('hide');
    $('#errorUploadRecordModal').modal('hide');
    $('#progressUploadRecordModal').modal('show');

    this.uploadValues = {done: 0, last: 0, total: 0};

    var url = location.href.split('/');

    var subjectId = url[url.length - 3];
    var homeworkId = url[url.length - 2];

    var currentRecord = this.tabRecords[this.currentRecordId];

    var oralFile = new FormData();
    oralFile.append('oralFile', currentRecord.dataRecord);

    var xhr = new XMLHttpRequest();
    xhr.file = currentRecord.dataRecord;

    setInterval(function() {
        cRecord.timeLeftUpload();
    }, 1000);

    if(xhr.upload)
    {
        xhr.upload.onprogress = function(e) {
            var done = e.position || e.loaded,
                total = e.totalSize || e.total;

            cRecord.uploadValues.done = done;
            cRecord.uploadValues.total = total;

            console.log('xhr.upload progress: ' + done + ' / ' + total + ' = ' + (Math.floor(done / total * 1000) / 10) + '%');

            cRecord.eId('progressUploadRecord').style.width = (Math.floor(done / total * 1000) / 10) + '%';
            cRecord.eId('percentUploadRecord').innerHTML = (Math.floor(done / total * 1000) / 10) + '%';
        };
    }

    xhr.onreadystatechange = function(e) {
        if (4 == this.readyState)
        {
            console.log('xhr upload complete ' + this.responseText);

            if (this.responseText != 'success')
            {
                cRecord.eId('recordNameError').innerHTML = currentRecord.name;

                cRecord.eId('buttonDownloadError').href = currentRecord.dataRecord;
                cRecord.eId('buttonDownloadError').download = currentRecord.name + '.wav';

                $('#progressUploadRecordModal').modal('hide');
                $('#errorUploadRecordModal').modal('show');
            }
            else
            {
                var chosenGroupStudent = document.getElementById('chosenGroupStudent');
                var tabInGroup = [];

                if(chosenGroupStudent != null)
                {
                    for(var i = 0; i < chosenGroupStudent.options.length; i++)
                    {
                        if(chosenGroupStudent.options[i].selected)
                        {
                            tabInGroup.push(chosenGroupStudent.options[i].value);
                        }
                    }
                }
                var support = cRecord.getSupport();

                var OAjax;

                if (window.XMLHttpRequest) OAjax = new XMLHttpRequest();
                else if (window.ActiveXObject) OAjax = new ActiveXObject('Microsoft.XMLHTTP');
                OAjax.open('POST', 'index.php?type=showWork&homeworkType=ORAL&a=addScoreOral', true);
                OAjax.onreadystatechange = function() {
                    if (OAjax.readyState == 4 && OAjax.status == 200)
                    {
                        if (OAjax.responseText == 'true') {
                            location.href = 'index';
                        }
                    }
                };

                OAjax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                OAjax.send('chosenGroupStudent=' + JSON.stringify(tabInGroup) + '&subjectId=' + subjectId + '&homeworkId=' + homeworkId + '&time=' + (currentRecord.time.m + ' minutes(s), ' + currentRecord.time.s + ' seconde(s)') + '&support=' + support);

            }
        }
    };

    xhr.open('POST', 'http://clangue.net/model/student/uploadWeb.php?w=' + homeworkId, true);
    xhr.send(oralFile);
};

cRecord.prototype.timeLeftUpload = function() {
    var timeLeft = parseInt((this.uploadValues.total - this.uploadValues.done) / (this.uploadValues.done - this.uploadValues.last));

    this.uploadValues.last = this.uploadValues.done;

    this.eId('progressTimeLeft').innerHTML = timeLeft + 's';
};

cRecord.prototype.getSupport = function() {
    var infoBrowser = this.infoBrowser();

    return infoBrowser.name + ' - ' + infoBrowser.version + ' - ' + ((this.tabRecords[this.currentRecordId].type == RECORD_TYPE.RECORD) ? 'RECORD' : 'FILE');
};

cRecord.prototype.infoBrowser = function() {
    var N=navigator.appName, ua=navigator.userAgent, tem;
    var M=ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    M=M? [M[1], M[2]]: [N, navigator.appVersion, '-?'];

    return {name: M[0], version: M[1]};
};

cRecord.prototype.sendFeedback = function(email, text) {
    var infoBrowser = this.infoBrowser();

    var OAjax;

    if (window.XMLHttpRequest) OAjax = new XMLHttpRequest();
    else if (window.ActiveXObject) OAjax = new ActiveXObject('Microsoft.XMLHTTP');
    OAjax.open('POST', 'modules/CRecord/php/sendFeedback.php', true);
    OAjax.onreadystatechange = function() {
        if (OAjax.readyState == 4 && OAjax.status == 200)
        {
            console.log(OAjax.responseText);

            cRecord.eId('emailFeedback').value = '';
            cRecord.eId('textFeedback').value = '';

            $('#feedbackModal').modal('hide');
        }
    };

    OAjax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    OAjax.send('email=' + email + '&text=' + text + '&support=' + (infoBrowser.name + ' - ' + infoBrowser.version));
};

cRecord.prototype.haveError = function(error) {
    switch(error) {
        case "LOAD_MODE":
            this.closeModule(this.errors[error]);
            break;
        default:
            this.closeModule(error);
    }

    var OAjax;

    if (window.XMLHttpRequest) OAjax = new XMLHttpRequest();
    else if (window.ActiveXObject) OAjax = new ActiveXObject('Microsoft.XMLHTTP');
    OAjax.open('POST', 'modules/CRecord/php/reportError.php', true);
    OAjax.onreadystatechange = function() {
        if (OAjax.readyState == 4 && OAjax.status == 200) {
            console.log(OAjax.responseText);
        }
    };

    OAjax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    OAjax.send('message=' + error);
};

cRecord.prototype.createElement = function(id, type, classCSS, styleCSS, size) {
    var element = document.createElement(type);
    element.id = id;

    if(classCSS != null)
    {
        element.setAttribute('class', classCSS);
    }

    if(styleCSS != null)
    {
        element.setAttribute('style', styleCSS + (size != null) ? ('width: ' + size.w + ';height: ' + size.h + ';') : '');
    }
    else
    {
        if(size != null)
        {
            element.setAttribute('style', 'width: ' + size.w + ';height: ' + size.h + ';');
        }
    }

    return element;
};

cRecord.prototype.compressName = function(name) {
    return ((name.length > 20) ? name.substring(0, 12) + '...' + name.substring(name.length - 5, name.length) : name);
};

cRecord.prototype.eId = function(id) {
    return document.getElementById(id);
};

cRecord.prototype.closeModule = function(message) {
    this.eId('loadSystem').style.display = 'none';
    this.eId('systemElements').style.display = 'none';
    this.eId('errorSystem').style.display = '';

    this.eId('messageError').innerHTML = message;
};