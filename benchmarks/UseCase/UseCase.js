var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Signal_1 = require("../../src/Signal");
const SIDUPAdmitter_1 = require("../../src/SID-UP/SIDUPAdmitter");
const QPROPActor_1 = require("../../src/QPROP/QPROPActor");
const spiders_js_1 = require("spiders.js");
const SIDUPActor_1 = require("../../src/SID-UP/SIDUPActor");
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
class UseCaseAdmitter extends SIDUPAdmitter_1.SIDUPAdmitter {
    constructor(admitterTag, totalVals, csvFileName, dataRate) {
        super(admitterTag, 2, 1);
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.dataRate = dataRate;
        this.thisdir = __dirname;
    }
    init() {
        let writing = require(this.thisdir + "/writing");
        let MemoryWriter = writing.MemoryWriter;
        var csvWriter = require('csv-write-stream');
        var fs = require('fs');
        this.close = false;
        let writer = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream(this.thisdir + "/Processing/" + this.csvFileName + this.dataRate + ".csv", { flags: 'a' }));
        this.memWriter = new MemoryWriter("Admitter");
        this.snapMem();
        let valsReceived = -1;
        this.changeListener = (newValue) => {
            let propagationTime = Date.now();
            newValue.constructionTime = propagationTime;
            return newValue;
        };
        let admitTimes = [];
        let processTimes = [];
        this.idleListener = () => {
            valsReceived++;
            if (valsReceived > 0) {
                this.close = true;
                let processTime = Date.now() - (admitTimes.splice(0, 1)[0]);
                processTimes.push(processTime);
                if (valsReceived == this.totalVals) {
                    let total = 0;
                    processTimes.forEach((pTime) => {
                        total += pTime;
                    });
                    let avg = total / processTimes.length;
                    writer.write({ pTime: avg });
                    writer.end();
                    this.memWriter.end();
                    writing.averageMem(this.csvFileName, this.dataRate, "Admitter");
                }
            }
        };
        this.admitListener = () => {
            admitTimes.push(Date.now());
        };
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
exports.UseCaseAdmitter = UseCaseAdmitter;
class SIDUPConfigService extends SIDUPActor_1.SIDUPActor {
    constructor(rate, totalVals, csvFileName, ownType, okType, admType, parents, ...rest) {
        super(ownType, admType, parents, ...rest);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.FleetData = FleetData;
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        this.thisDir = __dirname;
        this.okType = okType;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Config");
        this.averageMem = writing.averageMem;
        this.snapMem();
        let sig = new this.FleetData(this.libs.reflectOnActor());
        this.psClient.subscribe(this.okType).once(() => {
            this.update(sig);
        });
        this.publishSignal(sig);
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
exports.SIDUPConfigService = SIDUPConfigService;
class QPROPConfigService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, psServerAddress, psServerPort);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.FleetData = FleetData;
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        this.okType = okType;
        this.thisDir = __dirname;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Config");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start() {
        console.log("Config ready");
        let sig = new this.FleetData(this.libs.reflectOnActor());
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.psClient.subscribe(this.okType).once(() => {
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
exports.QPROPConfigService = QPROPConfigService;
class QPROPConfigServiceApp extends QPROPActor_1.QPROPApplication {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        this.okType = okType;
        this.thisDir = __dirname;
        this.init();
    }
    init() {
        super.init();
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Config");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start() {
        console.log("Config ready");
        let sig = new FleetData(this.libs.reflectOnActor());
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.psClient.subscribe(this.okType).once(() => {
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
class SIDUPDataAccessService extends SIDUPActor_1.SIDUPActor {
    constructor(rate, totalVals, csvFileName, ownType, okType, admType, parents, ...rest) {
        super(ownType, admType, parents, ...rest);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        this.thisDir = __dirname;
        this.FleetData = FleetData;
        this.okType = okType;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Data");
        this.averageMem = writing.averageMem;
        this.snapMem();
        let sig = new this.FleetData(this.libs.reflectOnActor());
        this.psClient.subscribe(this.okType).once(() => {
            this.update(sig);
        });
        this.publishSignal(sig);
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
exports.SIDUPDataAccessService = SIDUPDataAccessService;
class QPROPDataAccessService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, psServerAddress, psServerPort);
        this.rate = rate / 2;
        this.totalVals = totalVals / 2;
        this.csvFileName = csvFileName;
        this.produced = 0;
        this.close = false;
        this.thisDir = __dirname;
        this.FleetData = FleetData;
        this.okType = okType;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Data");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start() {
        console.log("Data ready");
        let sig = new this.FleetData(this.libs.reflectOnActor());
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.psClient.subscribe(this.okType).once(() => {
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
exports.QPROPDataAccessService = QPROPDataAccessService;
class QPROPDataAccessServiceApp extends QPROPActor_1.QPROPApplication {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
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
        super.init();
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Data");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start() {
        console.log("Data ready");
        let sig = new this.FleetData(this.libs.reflectOnActor());
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.psClient.subscribe(this.okType).once(() => {
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
class SIDUPGeoService extends SIDUPActor_1.SIDUPActor {
    constructor(rate, totalVals, csvFileName, ownType, admType, parents, ...rest) {
        super(ownType, admType, parents, ...rest);
        this.close = false;
        this.thisdir = __dirname;
        this.totalVals = totalVals;
        this.rate = rate;
        this.csvFileName = csvFileName;
    }
    init() {
        let writing = require(this.thisdir + "/writing");
        this.memWriter = new writing.MemoryWriter("Geo");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(imp) {
        let propagated = 0;
        let sig = this.libs.lift((fleetData) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Geo");
            }
            return fleetData;
        })(imp);
        this.publishSignal(sig);
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
exports.SIDUPGeoService = SIDUPGeoService;
class QPROPGeoService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, ownType, parentTypes, childTypes, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, psServerAddress, psServerPort);
        this.close = false;
        this.thisdir = __dirname;
        this.totalVals = totalVals;
        this.rate = rate;
        this.csvFileName = csvFileName;
    }
    init() {
        let writing = require(this.thisdir + "/writing");
        this.memWriter = new writing.MemoryWriter("Geo");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(imp) {
        console.log("Geo ready");
        let propagated = 0;
        return this.libs.lift((fleetData) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Geo");
            }
            return fleetData;
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
exports.QPROPGeoService = QPROPGeoService;
class QPROPGeoServiceApp extends QPROPActor_1.QPROPApplication {
    constructor(rate, totalVals, csvFileName, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.close = false;
        this.thisdir = __dirname;
        this.totalVals = totalVals;
        this.rate = rate;
        this.csvFileName = csvFileName;
        this.init();
    }
    init() {
        super.init();
        let writing = require(this.thisdir + "/writing");
        this.memWriter = new writing.MemoryWriter("Geo");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(imp) {
        console.log("Geo ready");
        let propagated = 0;
        return this.libs.lift((fleetData) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Geo");
            }
            return fleetData;
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
class SIDUPDrivingService extends SIDUPActor_1.SIDUPActor {
    constructor(rate, totalVals, csvFileName, ownType, admType, parents, ...rest) {
        super(ownType, admType, parents, ...rest);
        this.close = false;
        this.thisDir = __dirname;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Driving");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(data, geo) {
        let propagated = 0;
        let sig = this.libs.lift((data, geo) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Driving");
            }
            return data;
        })(data, geo);
        this.publishSignal(sig);
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
exports.SIDUPDrivingService = SIDUPDrivingService;
class QPROPDrivingService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, ownType, parentTypes, childTypes, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, psServerAddress, psServerPort);
        this.close = false;
        this.thisDir = __dirname;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Driving");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(data, geo) {
        console.log("Driving ready");
        let propagated = 0;
        return this.libs.lift((data, geo) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Driving");
            }
            return data;
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
exports.QPROPDrivingService = QPROPDrivingService;
class QPROPDrivingServiceApp extends QPROPActor_1.QPROPApplication {
    constructor(rate, totalVals, csvFileName, ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.close = false;
        this.thisDir = __dirname;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.init();
    }
    init() {
        super.init();
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Driving");
        this.averageMem = writing.averageMem;
        this.snapMem();
    }
    start(data, geo) {
        console.log("Driving ready");
        let propagated = 0;
        return this.libs.lift((data, geo) => {
            propagated++;
            if (propagated == this.totalVals / 2) {
                this.close = true;
                this.memWriter.end();
                this.averageMem(this.csvFileName, this.rate, "Driving");
            }
            return data;
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
class SIDUPDashboardService extends SIDUPActor_1.SIDUPActor {
    constructor(rate, totalVals, csvFileName, killRef, ownType, okType, admType, parents, ...rest) {
        super(ownType, admType, parents, ...rest);
        this.close = false;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.thisDir = __dirname;
        this.killRef = killRef;
        this.okType = okType;
    }
    init() {
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
        let valsReceived = 0;
        let lastDriving;
        let lastConfig;
        let firstPropagation = true;
        let benchStart;
        let processingTimes = [];
        this.psClient.publish("ok", this.okType);
        return this.libs.lift((driving, geo, config) => {
            if (valsReceived + 1 <= this.totalVals) {
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
                    this.averageResults(this.csvFileName, this.rate).then(() => {
                        this.averageMem(this.csvFileName, this.rate, "Dashboard").then(() => {
                            this.killRef.dashDone();
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
exports.SIDUPDashboardService = SIDUPDashboardService;
class QPROPDashboardService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, killRef, ownType, okType, parentTypes, childTypes, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, psServerAddress, psServerPort);
        this.close = false;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.thisDir = __dirname;
        this.killRef = killRef;
        this.okType = okType;
    }
    init() {
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
        this.psClient.publish("ok", this.okType);
        return this.libs.lift((driving, geo, config) => {
            if (valsReceived + 1 <= this.totalVals) {
                console.log("Received: " + valsReceived + " needed: " + this.totalVals);
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
                            this.killRef.dashDone();
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
exports.QPROPDashboardService = QPROPDashboardService;
class QPROPDashboardServiceApp extends QPROPActor_1.QPROPApplication {
    constructor(rate, totalVals, csvFileName, ownType, okType, parentTypes, childTypes, myAddress, myPort, psServerAddress = "127.0.0.1", psServerPort = 8000) {
        super(ownType, parentTypes, childTypes, myAddress, myPort, psServerAddress, psServerPort);
        this.close = false;
        this.rate = rate;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.thisDir = __dirname;
        this.okType = okType;
        this.init();
    }
    init() {
        super.init();
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
        this.psClient.publish("ok", this.okType);
        return this.libs.lift((driving, geo, config) => {
            if (valsReceived + 1 <= this.totalVals) {
                console.log("Received: " + valsReceived + " needed: " + this.totalVals);
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
//# sourceMappingURL=UseCase.js.map