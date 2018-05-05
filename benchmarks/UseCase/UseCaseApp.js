var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Signal_1 = require("../../src/Signal");
const spiders_js_1 = require("spiders.js");
const QPROPApplication_1 = require("../../src/QPROP/QPROPApplication");
class FleetData extends Signal_1.Signal {
    constructor(mirr) {
        super(mirr);
        this.constructionTime = Date.now();
    }
    actualise() {
        this.constructionTime = Date.now();
    }
    equals(otherFleetDataSignal) {
        return this.constructionTime == otherFleetDataSignal.constructionTime;
    }
}
__decorate([
    Signal_1.mutating
], FleetData.prototype, "actualise", null);
class QPROPConfigServiceApp extends spiders_js_1.Application {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(new spiders_js_1.SpiderActorMirror(), myAddress, myPort);
        this.qprop = new QPROPApplication_1.QPROPApplication(this, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.FleetData = FleetData;
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        this.okType = okType;
        this.thisDir = __dirname;
        this.init();
    }
    init() {
        this.qprop.init();
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Config");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start() {
        console.log("Config ready");
        let sig = new this.FleetData(this.qprop);
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.qprop.psClient.subscribe(this.okType).once(() => {
            this.update(sig);
        });
        return sig;
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
            this.averageMem(this.csvFileName, this.rate * 2, "Config");
        }
        else {
            setTimeout(() => {
                this.update(signal);
            }, 1000);
        }
    }
    snapMem() {
        if (!this.close) {
            this.memWriter.snapshot();
            setTimeout(() => {
                this.snapMem();
            }, 500);
        }
    }
}
exports.QPROPConfigServiceApp = QPROPConfigServiceApp;
class QPROPDataAccessServiceApp extends spiders_js_1.Application {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(new spiders_js_1.SpiderActorMirror(), myAddress, myPort);
        this.qprop = new QPROPApplication_1.QPROPApplication(this, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        this.thisDir = __dirname;
        this.FleetData = FleetData;
        this.okType = okType;
        this.init();
    }
    init() {
        this.qprop.init();
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Data");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start() {
        console.log("Data ready");
        let sig = new this.FleetData(this.qprop);
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.qprop.psClient.subscribe(this.okType).once(() => {
            this.update(sig);
        });
        return sig;
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
            this.averageMem(this.csvFileName, this.rate * 2, "Data");
        }
        else {
            setTimeout(() => {
                this.update(signal);
            }, 1000);
        }
    }
    snapMem() {
        if (!this.close) {
            this.memWriter.snapshot();
            setTimeout(() => {
                this.snapMem();
            }, 500);
        }
    }
}
exports.QPROPDataAccessServiceApp = QPROPDataAccessServiceApp;
class QPROPGeoServiceApp extends spiders_js_1.Application {
    constructor(rate, totalVals, csvFileName, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(new spiders_js_1.SpiderActorMirror(), myAddress, myPort);
        this.qprop = new QPROPApplication_1.QPROPApplication(this, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.close = false;
        this.thisdir = __dirname;
        this.totalVals = totalVals;
        this.rate = rate;
        this.csvFileName = csvFileName;
        this.init();
    }
    init() {
        this.qprop.init();
        let writing = require(this.thisdir + "/writing");
        this.memWriter = new writing.MemoryWriter("Geo");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(imp) {
        console.log("Geo ready");
        let propagated = 0;
        return this.qprop.lift((fleetData) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Geo");
            }
            return fleetData.constructionTime;
        })(imp);
    }
    snapMem() {
        if (!this.close) {
            this.memWriter.snapshot();
            setTimeout(() => {
                this.snapMem();
            }, 500);
        }
    }
}
exports.QPROPGeoServiceApp = QPROPGeoServiceApp;
class QPROPDrivingServiceApp extends spiders_js_1.Application {
    constructor(rate, totalVals, csvFileName, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(new spiders_js_1.SpiderActorMirror(), myAddress, myPort);
        this.qprop = new QPROPApplication_1.QPROPApplication(this, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.close = false;
        this.thisDir = __dirname;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.init();
    }
    init() {
        this.qprop.init();
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Driving");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(data, geo) {
        console.log("Driving ready");
        let propagated = 0;
        return this.qprop.lift((data, geo) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Driving");
            }
            return geo;
        })(data, geo);
    }
    snapMem() {
        if (!this.close) {
            this.memWriter.snapshot();
            setTimeout(() => {
                this.snapMem();
            }, 500);
        }
    }
}
exports.QPROPDrivingServiceApp = QPROPDrivingServiceApp;
class QPROPDashboardServiceApp extends spiders_js_1.Application {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, myAdress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(new spiders_js_1.SpiderActorMirror(), myAdress, myPort);
        this.qprop = new QPROPApplication_1.QPROPApplication(this, ownType, parentTypes, childTypes, myAdress, myPort, psServerAddress, psServerPort);
        this.close = false;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.thisDir = __dirname;
        this.okType = okType;
        this.init();
    }
    init() {
        this.qprop.init();
        var csvWriter = require('csv-write-stream');
        var fs = require('fs');
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Dashboard");
        this.averageMem = writing.averageMem;
        this.averageResults = writing.averageResults;
        this.snapMem();
        this.writer = csvWriter({ headers: ["TTP"] });
        this.tWriter = csvWriter({ sendHeaders: false });
        this.pWriter = csvWriter({ sendHeaders: false });
        this.writer.pipe(fs.createWriteStream(this.thisDir + '/temp.csv'));
        this.tWriter.pipe(fs.createWriteStream(this.thisDir + "/Throughput/" + this.csvFileName + this.rate + ".csv", { flags: 'a' }));
        this.pWriter.pipe(fs.createWriteStream(this.thisDir + "/Processing/" + this.csvFileName + this.rate + ".csv", { flags: 'a' }));
    }
    start(driving, geo, config) {
        console.log("Dash ready");
        let valsReceived = 0;
        let lastDriving;
        let lastConfig;
        let firstPropagation = true;
        let benchStart;
        let processingTimes = [];
        this.qprop.psClient.publish("ok", this.okType);
        return this.qprop.lift((driving, geo, config) => {
            if (valsReceived + 1 <= this.totalVals) {
                console.log("Received: " + valsReceived + " needed: " + this.totalVals);
                if (firstPropagation) {
                    benchStart = Date.now();
                    firstPropagation = false;
                }
                let timeToPropagate;
                if (lastDriving != driving) {
                    timeToPropagate = Date.now() - driving;
                }
                else {
                    timeToPropagate = Date.now() - config.constructionTime;
                }
                lastDriving = driving;
                lastConfig = config;
                valsReceived++;
                this.writer.write([timeToPropagate]);
                processingTimes.push(timeToPropagate);
                if (valsReceived == this.totalVals) {
                    this.close = true;
                    console.log("Benchmark Finished");
                    this.writer.end();
                    this.memWriter.end();
                    let benchStop = Date.now();
                    this.tWriter.write({ time: (benchStop - benchStart), values: this.totalVals });
                    this.tWriter.end();
                    let total = 0;
                    processingTimes.forEach((pTime) => {
                        total += pTime;
                    });
                    let avg = total / processingTimes.length;
                    this.pWriter.write({ pTime: avg });
                    this.pWriter.end();
                    this.averageResults(this.csvFileName, this.rate).then(() => {
                        this.averageMem(this.csvFileName, this.rate, "Dashboard").then(() => {
                            require('child_process').exec("killall node");
                        });
                    });
                }
            }
        })(driving, geo, config);
    }
    snapMem() {
        if (!this.close) {
            this.memWriter.snapshot();
            setTimeout(() => {
                this.snapMem();
            }, 500);
        }
    }
}
exports.QPROPDashboardServiceApp = QPROPDashboardServiceApp;
class UseCaseApp extends spiders_js_1.Application {
    constructor() {
        super(new spiders_js_1.SpiderActorMirror(), "127.0.0.1", 8000);
        this.libs.setupPSServer();
    }
    dashDone() {
        this.kill();
        this.libs.setupPSServer();
        this.completeResolve();
    }
    onComplete() {
        return new Promise((resolve) => {
            this.completeResolve = resolve;
        });
    }
}
exports.UseCaseApp = UseCaseApp;
exports.dataTag = new spiders_js_1.PubSubTag("Data");
exports.configTag = new spiders_js_1.PubSubTag("Config");
exports.geoTag = new spiders_js_1.PubSubTag("Geo");
exports.drivingTag = new spiders_js_1.PubSubTag("Driving");
exports.dashTag = new spiders_js_1.PubSubTag("Dash");
exports.admitterTag = new spiders_js_1.PubSubTag("Admitter");
exports.okTag = new spiders_js_1.PubSubTag("ok");
//# sourceMappingURL=UseCaseApp.js.map