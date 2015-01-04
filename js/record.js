function record(id, type, name) {
    this.id = id;
    this.type = type;
    this.name = name;
    
    this.duration = 0;
    this.time = {m: 0, s: 0};

    this.dataRecord = null;

    this.recordLength = 0;

    this.leftChannel = [];
    this.rightChannel = [];
}

record.prototype.updateChannels = function(left, right, length) {
    this.leftChannel.push(left);
    this.rightChannel.push(right);

    this.recordLength += length;
};
