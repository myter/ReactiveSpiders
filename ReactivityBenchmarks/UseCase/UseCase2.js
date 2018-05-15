var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubTag_1 = require("../../src/PubSub/SubTag");
const MicroService_1 = require("../../src/MicroService/MicroService");
var spiders = require("../../src/spiders");
var dataTag = new SubTag_1.PubSubTag("Data");
var configTag = new SubTag_1.PubSubTag("Config");
var geoTag = new SubTag_1.PubSubTag("Geo");
var drivingTag = new SubTag_1.PubSubTag("Driving");
var dashTag = new SubTag_1.PubSubTag("Dash");
var admitterTag = new SubTag_1.PubSubTag("Admitter");
var csvWriter = require('csv-write-stream');
var fs = require('fs');
var csv = require('fast-csv');
class FleetData extends spiders.Signal {
    constructor() {
        super();
        this.constructionTime = Date.now();
    }
    actualise() {
        this.constructionTime = Date.now();
    }
}
__decorate([
    spiders.mutator
], FleetData.prototype, "actualise", null);
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
function averageMem(writeTo, dataRate, node, kill) {
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
        if (kill) {
            require('child_process').exec("killall node");
        }
    });
    stream.pipe(csvStream);
}
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
class Admitter extends MicroService_1.MicroServiceApp {
    constructor(totalVals, csvFileName, dataRate) {
        super("127.0.0.1", 8005);
        this.close = false;
        let writer = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream("Processing/" + csvFileName + dataRate + ".csv", { flags: 'a' }));
        this.memWriter = new MemoryWriter("Admitter");
        this.snapMem();
        let valsReceived = -1;
        let change = (newValue) => {
            let propagationTime = Date.now();
            newValue.constructionTime = propagationTime;
            return newValue;
        };
        let admitTimes = [];
        let processTimes = [];
        let idle = () => {
            valsReceived++;
            if (valsReceived > 0) {
                this.close = true;
                let processTime = Date.now() - (admitTimes.splice(0, 1)[0]);
                processTimes.push(processTime);
                if (valsReceived == totalVals) {
                    let total = 0;
                    processTimes.forEach((pTime) => {
                        total += pTime;
                    });
                    let avg = total / processTimes.length;
                    writer.write({ pTime: avg });
                    writer.end();
                    this.memWriter.end();
                    averageMem(csvFileName, dataRate, "Admitter", true);
                }
            }
        };
        let admit = () => {
            admitTimes.push(Date.now());
        };
        this.SIDUPAdmitter(admitterTag, 2, 1, idle, change, admit);
    }
    snapMem() {
        if (!this.close) {
            setTimeout(() => {
                this.memWriter.snapshot();
                this.snapMem();
            }, 500);
        }
    }
}
exports.Admitter = Admitter;
class ConfigService extends MicroService_1.MicroServiceApp {
    constructor(isQPROP, rate, totalVals, csvFileName) {
        super("127.0.0.1", 8006);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.memWriter = new MemoryWriter("Config");
        this.snapMem();
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        if (isQPROP) {
            this.QPROP2(configTag, [], [dashTag]);
        }
        else {
            this.SIDUP(configTag, [], admitterTag);
        }
        let sig = this.newSignal(FleetData);
        this.publishSignal(sig);
        //Wait for construction to be completed (for both QPROP and SIDUP)
        setTimeout(() => {
            this.update(sig);
        }, 2000);
    }
    update(signal) {
        for (var i = 0; i < this.rate; i++) {
            this.totalVals--;
            this.produced++;
            signal.actualise();
        }
        //Memory not measured for max throughput benchmarks
        if (this.totalVals <= 0) {
            this.close = true;
            this.memWriter.end();
            averageMem(this.csvFileName, this.rate * 2, "Config", false);
        }
        else {
            setTimeout(() => {
                this.update(signal);
            }, 1000);
        }
    }
    snapMem() {
        if (!this.close) {
            setTimeout(() => {
                this.memWriter.snapshot();
                this.snapMem();
            }, 500);
        }
    }
}
exports.ConfigService = ConfigService;
class DataAccessService extends MicroService_1.MicroServiceApp {
    constructor(isQPROP, rate, totalVals, csvFileName) {
        super("127.0.0.1", 8001);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.memWriter = new MemoryWriter("Data");
        this.snapMem();
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        if (isQPROP) {
            this.QPROP2(dataTag, [], [geoTag, drivingTag]);
        }
        else {
            this.SIDUP(dataTag, [], admitterTag);
        }
        let sig = this.newSignal(FleetData);
        this.publishSignal(sig);
        //Wait for construction to be completed (for both QPROP and SIDUP)
        setTimeout(() => {
            this.update(sig);
        }, 2000);
    }
    update(signal) {
        for (var i = 0; i < this.rate; i++) {
            this.totalVals--;
            this.produced++;
            signal.actualise();
        }
        if (this.totalVals <= 0) {
            this.close = true;
            this.memWriter.end();
            averageMem(this.csvFileName, this.rate * 2, "Data", false);
        }
        else {
            setTimeout(() => {
                this.update(signal);
            }, 1000);
        }
    }
    snapMem() {
        if (!this.close) {
            setTimeout(() => {
                this.memWriter.snapshot();
                this.snapMem();
            }, 500);
        }
    }
}
exports.DataAccessService = DataAccessService;
class GeoService extends MicroService_1.MicroServiceApp {
    constructor(isQPROP, rate, totalVals, csvFileName) {
        super("127.0.0.1", 8002);
        this.close = false;
        let imp;
        if (isQPROP) {
            imp = this.QPROP2(geoTag, [dataTag], [drivingTag, dashTag]);
        }
        else {
            imp = this.SIDUP(geoTag, [dataTag], admitterTag);
        }
        let propagated = 0;
        this.memWriter = new MemoryWriter("Geo");
        this.snapMem();
        let exp = this.lift(([fleetData]) => {
            propagated++;
            if (propagated == totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                averageMem(csvFileName, rate, "Geo", false);
            }
            return fleetData;
        })(imp);
        this.publishSignal(exp);
    }
    snapMem() {
        if (!this.close) {
            setTimeout(() => {
                this.memWriter.snapshot();
                this.snapMem();
            }, 500);
        }
    }
}
exports.GeoService = GeoService;
class DrivingService extends MicroService_1.MicroServiceApp {
    constructor(isQPROP, rate, totalVals, csvFileName) {
        super("127.0.0.1", 8003);
        this.close = false;
        let imp;
        if (isQPROP) {
            imp = this.QPROP2(drivingTag, [dataTag, geoTag], [dashTag]);
        }
        else {
            imp = this.SIDUP(drivingTag, [dataTag, geoTag], admitterTag);
        }
        let propagated = 0;
        this.memWriter = new MemoryWriter("Driving");
        this.snapMem();
        let exp = this.lift(([data, geo]) => {
            propagated++;
            if (propagated == totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                averageMem(csvFileName, rate, "Driving", false);
            }
            return data;
        })(imp);
        this.publishSignal(exp);
    }
    snapMem() {
        if (!this.close) {
            setTimeout(() => {
                this.memWriter.snapshot();
                this.snapMem();
            }, 500);
        }
    }
}
exports.DrivingService = DrivingService;
class DashboardService extends MicroService_1.MicroServiceApp {
    constructor(isQPROP, rate, totalVals, csvFileName) {
        super("127.0.0.1", 8004);
        this.close = false;
        let valsReceived = 0;
        let writer = csvWriter({ headers: ["TTP"] });
        let tWriter = csvWriter({ sendHeaders: false });
        let pWriter = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream('temp.csv'));
        tWriter.pipe(fs.createWriteStream("Throughput/" + csvFileName + rate + ".csv", { flags: 'a' }));
        pWriter.pipe(fs.createWriteStream("Processing/" + csvFileName + rate + ".csv", { flags: 'a' }));
        let imp;
        if (isQPROP) {
            imp = this.QPROP2(dashTag, [drivingTag, geoTag, configTag], []);
        }
        else {
            imp = this.SIDUP(dashTag, [drivingTag, geoTag, configTag], admitterTag, true);
        }
        this.memWriter = new MemoryWriter("Dashboard");
        this.snapMem();
        let lastDriving;
        let lastConfig;
        let firstPropagation = true;
        let benchStart;
        let processingTimes = [];
        this.lift(([driving, geo, config]) => {
            if (firstPropagation) {
                benchStart = Date.now();
                firstPropagation = false;
            }
            let timeToPropagate;
            if (lastDriving != driving) {
                timeToPropagate = Date.now() - driving.constructionTime;
            }
            else {
                timeToPropagate = Date.now() - config.constructionTime;
            }
            lastDriving = driving;
            lastConfig = config;
            valsReceived++;
            console.log("Values propagated: " + valsReceived);
            /*if(valsReceived.toString().endsWith("000")){
                console.log("Values propagated: " + valsReceived)
            }*/
            writer.write([timeToPropagate]);
            processingTimes.push(timeToPropagate);
            if (valsReceived == totalVals) {
                this.close = true;
                console.log("Benchmark Finished");
                writer.end();
                this.memWriter.end();
                let benchStop = Date.now();
                tWriter.write({ time: (benchStop - benchStart), values: totalVals });
                tWriter.end();
                if (isQPROP) {
                    let total = 0;
                    processingTimes.forEach((pTime) => {
                        total += pTime;
                    });
                    let avg = total / processingTimes.length;
                    pWriter.write({ pTime: avg });
                    pWriter.end();
                }
                averageResults(csvFileName, rate);
                averageMem(csvFileName, rate, "Dashboard", isQPROP);
            }
        })(imp);
    }
    snapMem() {
        if (!this.close) {
            setTimeout(() => {
                this.memWriter.snapshot();
                this.snapMem();
            }, 500);
        }
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=UseCase2.js.map