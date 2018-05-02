var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const spiders_js_1 = require("spiders.js");
const Signal_1 = require("../../src/Signal");
const SIDUPAdmitter_1 = require("../../src/SID-UP/SIDUPAdmitter");
const QPROPActor_1 = require("../../src/QPROP/QPROPActor");
var csvWriter = require('csv-write-stream');
var fs = require('fs');
var csv = require('fast-csv');
//PI tags
let app = new spiders_js_1.Application();
exports.pi2Tag = new app.libs.PubSubTag("2");
exports.pi3Tag = new app.libs.PubSubTag("3");
exports.pi4Tag = new app.libs.PubSubTag("4");
exports.pi5Tag = new app.libs.PubSubTag("5");
exports.pi6Tag = new app.libs.PubSubTag("6");
exports.pi7Tag = new app.libs.PubSubTag("7");
exports.pi8Tag = new app.libs.PubSubTag("8");
exports.pi9Tag = new app.libs.PubSubTag("9");
exports.pi10Tag = new app.libs.PubSubTag("10");
exports.pi11Tag = new app.libs.PubSubTag("11");
exports.pi12Tag = new app.libs.PubSubTag("12");
exports.pi13Tag = new app.libs.PubSubTag("13");
exports.pi14Tag = new app.libs.PubSubTag("14");
exports.pi15Tag = new app.libs.PubSubTag("15");
exports.pi16Tag = new app.libs.PubSubTag("16");
exports.pi17Tag = new app.libs.PubSubTag("17");
exports.pi18Tag = new app.libs.PubSubTag("18");
exports.pi19Tag = new app.libs.PubSubTag("19");
exports.pi20Tag = new app.libs.PubSubTag("20");
exports.pi21Tag = new app.libs.PubSubTag("21");
exports.pi22Tag = new app.libs.PubSubTag("22");
exports.pi23Tag = new app.libs.PubSubTag("23");
exports.pi24Tag = new app.libs.PubSubTag("24");
exports.pi25Tag = new app.libs.PubSubTag("25");
exports.pi26Tag = new app.libs.PubSubTag("26");
exports.pi27Tag = new app.libs.PubSubTag("27");
exports.pi28Tag = new app.libs.PubSubTag("28");
exports.pi29Tag = new app.libs.PubSubTag("29");
exports.pi30Tag = new app.libs.PubSubTag("30");
exports.pi31Tag = new app.libs.PubSubTag("31");
exports.pi32Tag = new app.libs.PubSubTag("32");
exports.pi33Tag = new app.libs.PubSubTag("33");
exports.pi34Tag = new app.libs.PubSubTag("34");
exports.pi35Tag = new app.libs.PubSubTag("35");
exports.pi36Tag = new app.libs.PubSubTag("36");
exports.pi37Tag = new app.libs.PubSubTag("37");
exports.pi38Tag = new app.libs.PubSubTag("38");
exports.pi39Tag = new app.libs.PubSubTag("39");
exports.pi40Tag = new app.libs.PubSubTag("40");
exports.pi41Tag = new app.libs.PubSubTag("41");
exports.pi42Tag = new app.libs.PubSubTag("42");
exports.pi43Tag = new app.libs.PubSubTag("43");
exports.pi44Tag = new app.libs.PubSubTag("44");
exports.pi45Tag = new app.libs.PubSubTag("45");
exports.pi46Tag = new app.libs.PubSubTag("46");
exports.pi47Tag = new app.libs.PubSubTag("47");
exports.pi48Tag = new app.libs.PubSubTag("48");
exports.pi49Tag = new app.libs.PubSubTag("49");
exports.pi50Tag = new app.libs.PubSubTag("50");
exports.pi51Tag = new app.libs.PubSubTag("51");
exports.pi52Tag = new app.libs.PubSubTag("52");
exports.pi53Tag = new app.libs.PubSubTag("53");
exports.pi54Tag = new app.libs.PubSubTag("54");
exports.pi55Tag = new app.libs.PubSubTag("55");
exports.pi56Tag = new app.libs.PubSubTag("56");
exports.pi57Tag = new app.libs.PubSubTag("57");
exports.pi58Tag = new app.libs.PubSubTag("58");
exports.pi59Tag = new app.libs.PubSubTag("59");
exports.admitterTag = new app.libs.PubSubTag("Admitter");
app.kill();
app = null;
exports.monitorId = 0;
exports.monitorIP = "10.0.0.10";
exports.monitorPort = 8001;
exports.admitterId = 1;
exports.admitterIP = "10.0.0.10";
exports.admitterPort = 8002;
exports.piIds = [];
for (var i = 2; i < 60; i++) {
    exports.piIds.push(i);
}
exports.piAddresses = exports.piIds.map((id, index) => {
    if (id >= 2 && id <= 14) {
        return "10.0.0.10";
    }
    else if (id > 14 && id <= 30) {
        return "10.0.0.11";
    }
    else if (id > 30 && id <= 45) {
        return "10.0.0.12";
    }
    else {
        return "10.0.0.13";
    }
});
let base = 8003;
exports.piPorts = exports.piIds.map((id, index) => {
    return base + index;
});
function mapToName(piHostName) {
    return piHostName;
}
exports.mapToName = mapToName;
//PI tags
class PropagationValue extends Signal_1.Signal {
    constructor(mirr) {
        super(mirr);
        this.constructionTime = Date.now();
    }
    actualise() {
        this.constructionTime = Date.now();
    }
    equals(otherVal) {
        return this.constructionTime == otherVal.constructionTime;
    }
}
__decorate([
    Signal_1.mutating
], PropagationValue.prototype, "actualise", null);
exports.PropagationValue = PropagationValue;
class ServiceInfo {
    constructor(tag, parents, children, address, port) {
        this.tag = tag;
        this.parents = parents;
        this.children = children;
        this.address = address;
        this.port = port;
    }
}
exports.ServiceInfo = ServiceInfo;
class Admitter extends SIDUPAdmitter_1.SIDUPAdmitter {
    constructor(admiterTag, psServerAddress, psServerPort, totalVals, csvFileName, dataRate, numSources, dynamicLinks, changes) {
        super(admiterTag, numSources, 1, psServerAddress, psServerPort);
        this.close = false;
        this.dynamicLinks = dynamicLinks;
        this.thisDir = __dirname;
        this.changes = changes;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.dataRate = dataRate;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.MemoryWriter("Admitter");
        var csvWriter = require('csv-write-stream');
        var fs = require('fs');
        let writer = csvWriter({ sendHeaders: false });
        if (this.changes > 0) {
            writer.pipe(fs.createWriteStream(this.thisDir + "/Processing/" + this.csvFileName + this.changes + ".csv", { flags: 'a' }));
        }
        else {
            writer.pipe(fs.createWriteStream(this.thisDir + "/Processing/" + this.csvFileName + this.dataRate + ".csv", { flags: 'a' }));
        }
        this.snapMem();
        this.changeListener = (newValue) => {
            let propagationTime = Date.now();
            newValue.constructionTime = propagationTime;
            return newValue;
        };
        let valsReceived = -1;
        let admitTimes = [];
        let processTimes = [];
        this.idleListener = () => {
            valsReceived++;
            if (valsReceived > 0) {
                if (valsReceived == 1) {
                    this.checkDynamicLinks();
                }
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
                    if (this.changes > 0) {
                        writing.averageMem(this.csvFileName, this.changes, "Admitter", true);
                    }
                    else {
                        writing.averageMem(this.csvFileName, this.dataRate, "Admitter", true);
                    }
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
    checkDynamicLinks() {
        if (this.dynamicLinks.length > 0) {
            setTimeout(() => {
                let link = this.dynamicLinks.splice(0, 1)[0];
                let from = link.from;
                let to = link.to;
                console.log("ADDING DYNAMIC DEPENDENCY");
                console.log("From: " + from.tagVal + " to: " + to.tagVal);
                this.addDependency(from, to);
                this.checkDynamicLinks();
            }, Math.floor(Math.random() * 100) + 50);
        }
    }
}
exports.Admitter = Admitter;
class QPROPSourceService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, serverAddress, serverPort, myTag, directParentsTags, directChildrenTags, dynamicLinkTags, changes) {
        super(myTag, directParentsTags, directChildrenTags, serverAddress, serverPort);
        this.rate = rate;
        this.changes = changes;
        this.PropagationValue = PropagationValue;
        this.close = false;
        this.myTag = myTag;
        this.dynamicLinks = dynamicLinkTags;
        this.totalVals = totalVals;
        this.csvFileName = csvFileName;
        this.thisDir = __dirname;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.PersistMemWriter();
        this.snapMem();
    }
    start() {
        let sig = this.PropagationValue(this.libs.reflectOnActor());
        //Wait for construction to be completed (for both QPROP and SIDUP)
        setTimeout(() => {
            this.update(sig);
            this.checkDynamicLinks();
        }, 10000);
        return sig;
    }
    update(signal) {
        for (var i = 0; i < this.rate; i++) {
            this.totalVals--;
            signal.actualise();
        }
        setTimeout(() => {
            this.update(signal);
        }, 1000);
    }
    snapMem() {
        if (!this.close) {
            if (this.changes > 0) {
                this.memWriter.snapshot(this.csvFileName, this.changes, this.myTag.tagVal);
            }
            else {
                this.memWriter.snapshot(this.csvFileName, this.rate, this.myTag.tagVal);
            }
            setTimeout(() => {
                this.snapMem();
            }, 500);
        }
    }
    checkDynamicLinks() {
        if (this.dynamicLinks.length > 0) {
            setTimeout(() => {
                let link = this.dynamicLinks.splice(0, 1)[0];
                let from = link.from;
                let to = link.to;
                if (this.myTag.equals(to)) {
                    console.log("ADDING DYNAMIC DEPENDENCY");
                    console.log("From: " + from.tagVal + " to: " + to.tagVal);
                    this.addDependency(from);
                    this.checkDynamicLinks();
                }
            }, Math.floor(Math.random() * 100) + 50);
        }
    }
}
exports.QPROPSourceService = QPROPSourceService;
class QPROPDerivedService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, serverAddress, serverPort, myTag, directParentsTag, directChildrenTags, dynamicLinkTags, changes) {
        super(myTag, directParentsTag, directChildrenTags, serverAddress, serverPort);
        this.close = false;
        this.rate = rate;
        this.changes = changes;
        this.csvfileName = csvFileName;
        this.myTag = myTag;
        this.thisDir = __dirname;
        this.dynamicLinks = dynamicLinkTags;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        this.memWriter = new writing.PersistMemWriter();
        this.snapMem();
    }
    start(imp) {
        let firstPropagation = true;
        let lastArgs;
        return this.libs.lift((args) => {
            this.checkDynamicLinks();
            if (firstPropagation) {
                firstPropagation = false;
                lastArgs = args;
                let ret;
                args.forEach((v) => {
                    if (v) {
                        ret = v;
                    }
                });
                return ret;
            }
            else {
                let newV;
                args.some((v, index) => {
                    if (lastArgs[index] != v && v != undefined && v != null) {
                        newV = v;
                        return true;
                    }
                });
                lastArgs = args;
                return newV;
            }
        })(imp);
    }
    snapMem() {
        if (!this.close) {
            if (this.changes > 0) {
                this.memWriter.snapshot(this.csvfileName, this.changes, this.myTag.tagVal);
            }
            else {
                this.memWriter.snapshot(this.csvfileName, this.rate, this.myTag.tagVal);
            }
            setTimeout(() => {
                this.snapMem();
            }, 500);
        }
    }
    checkDynamicLinks() {
        if (this.dynamicLinks.length > 0) {
            setTimeout(() => {
                let link = this.dynamicLinks.splice(0, 1)[0];
                let from = link.from;
                let to = link.to;
                if (this.myTag.equals(to)) {
                    console.log("ADDING DYNAMIC DEPENDENCY");
                    console.log("From: " + from.tagVal + " to: " + to.tagVal);
                    this.addDependency(from);
                    this.checkDynamicLinks();
                }
            }, Math.floor(Math.random() * 100) + 50);
        }
    }
}
exports.QPROPDerivedService = QPROPDerivedService;
class QPROPSinkService extends QPROPActor_1.QPROPActor {
    constructor(rate, totalVals, csvFileName, serverAddress, serverPort, myTag, directParentTags, directChildrenTags, numSources, dynamicLinks, changes) {
        super(myTag, directParentTags, directChildrenTags, serverAddress, serverPort);
        this.close = false;
        this.changes = changes;
        this.dynamicLinks = dynamicLinks;
        this.thisDir = __dirname;
        this.myTag = myTag;
        this.csvFileName = csvFileName;
        this.rate = rate;
        this.totalVals = totalVals;
    }
    init() {
        let writing = require(this.thisDir + "/writing");
        var csvWriter = require('csv-write-stream');
        var fs = require('fs');
        this.memWriter = new writing.MemoryWriter(this.myTag.tagVal);
        this.averageResults = writing.averageResults;
        this.averageMem = writing.averageMem;
        this.snapMem();
        this.writer = csvWriter({ headers: ["TTP"] });
        this.tWriter = csvWriter({ sendHeaders: false });
        this.pWriter = csvWriter({ sendHeaders: false });
        this.writer.pipe(fs.createWriteStream(this.thisDir + '/temp.csv'));
        if (this.changes > 0) {
            this.tWriter.pipe(fs.createWriteStream(this.thisDir + "/Throughput/" + this.csvFileName + this.changes + ".csv", { flags: 'a' }));
            this.pWriter.pipe(fs.createWriteStream(this.thisDir + "/Processing/" + this.csvFileName + this.changes + ".csv", { flags: 'a' }));
        }
        else {
            this.tWriter.pipe(fs.createWriteStream(this.thisDir + "/Throughput/" + this.csvFileName + this.rate + ".csv", { flags: 'a' }));
            this.pWriter.pipe(fs.createWriteStream(this.thisDir + "/Processing/" + this.csvFileName + this.rate + ".csv", { flags: 'a' }));
        }
    }
    start(imp) {
        let lastArgs;
        let firstPropagation = true;
        let benchStart;
        let processingTimes = [];
        let valsReceived = 0;
        return this.libs.lift((args) => {
            this.checkDynamicLinks();
            let timeToPropagate;
            if (firstPropagation) {
                benchStart = Date.now();
                firstPropagation = false;
                lastArgs = args;
                args.forEach((v) => {
                    if (v) {
                        timeToPropagate = Date.now() - v.constructionTime;
                    }
                });
            }
            else {
                let newV;
                args.some((v, index) => {
                    if (lastArgs[index] != v && v != undefined && v != null) {
                        newV = v;
                        return true;
                    }
                });
                timeToPropagate = Date.now() - newV.constructionTime;
            }
            lastArgs = args;
            valsReceived++;
            console.log("Values propagated: " + valsReceived);
            this.writer.write([timeToPropagate]);
            processingTimes.push(timeToPropagate);
            if (valsReceived == this.totalVals) {
                console.log("Benchmark Finished");
                this.writer.end();
                let benchStop = Date.now();
                this.tWriter.write({ time: (benchStop - benchStart), values: this.totalVals });
                this.tWriter.end();
                this.memWriter.end();
                //QPROP SPECIFIC
                let total = 0;
                processingTimes.forEach((pTime) => {
                    total += pTime;
                });
                let avg = total / processingTimes.length;
                this.pWriter.write({ pTime: avg });
                this.pWriter.end();
                if (this.changes > 0) {
                    this.averageResults(this.csvFileName, this.changes);
                    this.averageMem(this.csvFileName, this.changes, this.myTag.tagVal);
                }
                else {
                    this.averageResults(this.csvFileName, this.rate);
                    this.averageMem(this.csvFileName, this.rate, this.myTag.tagVal);
                }
            }
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
    checkDynamicLinks() {
        if (this.dynamicLinks.length > 0) {
            setTimeout(() => {
                let link = this.dynamicLinks.splice(0, 1)[0];
                let from = link.from;
                let to = link.to;
                if (this.myTag.equals(to)) {
                    console.log("ADDING DYNAMIC DEPENDENCY");
                    console.log("From: " + from.tagVal + " to: " + to.tagVal);
                    this.addDependency(from);
                    this.checkDynamicLinks();
                }
            }, Math.floor(Math.random() * 100) + 50);
        }
    }
}
exports.QPROPSinkService = QPROPSinkService;
//# sourceMappingURL=Services.js.map