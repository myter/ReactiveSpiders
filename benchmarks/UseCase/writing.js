Object.defineProperty(exports, "__esModule", { value: true });
var csvWriter = require('csv-write-stream');
var fs = require('fs');
var csv = require('fast-csv');
function averageResults(writeTo, dataRate) {
    var stream = fs.createReadStream('temp.csv');
    let length = 0;
    let total = 0;
    let header = true;
    var csvStream = csv()
        .on("data", function (data) {
        if (!header) {
            length++;
            total += parseInt(data);
        }
        header = false;
    })
        .on("end", function () {
        let avg = total / length;
        let writer = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream("Latency/" + writeTo + dataRate + ".csv", { flags: 'a' }));
        writer.write({ avg: avg });
        writer.end();
    });
    stream.pipe(csvStream);
}
exports.averageResults = averageResults;
function averageMem(writeTo, dataRate, node) {
    var stream = fs.createReadStream('temp' + node + "Memory.csv");
    let length = 0;
    let totalHeap = 0;
    let totalRss = 0;
    var csvStream = csv()
        .on("data", function (data) {
        length++;
        totalHeap += parseInt(data[0]);
        totalRss += parseInt(data[1]);
    })
        .on("end", function () {
        let avgHeap = totalHeap / length;
        let avgRss = totalRss / length;
        let writer = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream("Memory/" + writeTo + dataRate + node + "Memory.csv", { flags: 'a' }));
        writer.write({ heap: avgHeap, rss: avgRss });
        writer.end();
    });
    stream.pipe(csvStream);
}
exports.averageMem = averageMem;
class MemoryWriter {
    constructor(node) {
        this.writer = csvWriter({ sendHeaders: false });
        this.writer.pipe(fs.createWriteStream("temp" + node + "Memory.csv"));
    }
    snapshot() {
        let mem = process.memoryUsage();
        try {
            this.writer.write({ heap: mem.heapUsed, rss: mem.rss });
        }
        catch (e) {
        }
    }
    end() {
        this.writer.end();
    }
}
exports.MemoryWriter = MemoryWriter;
//# sourceMappingURL=writing.js.map