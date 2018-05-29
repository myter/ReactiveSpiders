Object.defineProperty(exports, "__esModule", { value: true });
const RegularJane_1 = require("../RegularJane");
const ServicesJane_1 = require("../ServicesJane");
var spiders = require("../../../src/spiders");
//TODO REPL to send commands to slaves
//TODO monitoring of down nodes + check if all nodes there before sending message
//Jane master is either going to run the sink node in the case of QPROP or the admitter in the case of SIDUP
class JaneMaster extends spiders.Application {
    constructor(ip, port) {
        super(ip, port);
    }
    register(slaveRef) {
        console.log("Slave registered!!");
    }
    benchEnd() {
    }
}
let networkInterface = "em1";
var os = require('os');
var networkInterfaces = os.networkInterfaces();
var thisIP = networkInterfaces[networkInterface][1].address;
var masterPort = 8000;
var monitorPort = 8001;
var monitorIP = thisIP;
var fiftyPort = 8002;
var admitterPort = 8003;
let isQPROP = process.argv[2] == "true";
let toSpawn = ServicesJane_1.mapToName(process.argv[3]);
let csvFile = process.argv[4];
let dynamic = process.argv[5] == "true";
/*let dataRate    = parseInt(process.argv[3]) / 10
let totalVals   = dataRate * 30
let csvFile     = process.argv[4]
let changes     = parseInt(process.argv[5])*/
//1,50,100,150,200,250,300 are the datarates
let allRates = [1, 50, 100, 150, 200, 250];
let allChanges = [1, 5, 10, 15, 20];
function generateDynLinks(changes) {
    //Avoid introducing cycles and double dependencies
    let dynLinks = [];
    if (changes == 1) {
        dynLinks.push({ from: RegularJane_1.pi6.tag, to: RegularJane_1.pi31.tag });
    }
    else if (changes == 5) {
        dynLinks.push({ from: RegularJane_1.pi6.tag, to: RegularJane_1.pi31.tag });
        dynLinks.push({ from: RegularJane_1.pi21.tag, to: RegularJane_1.pi32.tag });
        dynLinks.push({ from: RegularJane_1.pi39.tag, to: RegularJane_1.pi49.tag });
        dynLinks.push({ from: RegularJane_1.pi49.tag, to: RegularJane_1.pi50.tag });
        dynLinks.push({ from: RegularJane_1.pi32.tag, to: RegularJane_1.pi42.tag });
    }
    else if (changes == 10) {
        dynLinks.push({ from: RegularJane_1.pi6.tag, to: RegularJane_1.pi31.tag });
        dynLinks.push({ from: RegularJane_1.pi21.tag, to: RegularJane_1.pi32.tag });
        dynLinks.push({ from: RegularJane_1.pi39.tag, to: RegularJane_1.pi49.tag });
        dynLinks.push({ from: RegularJane_1.pi49.tag, to: RegularJane_1.pi50.tag });
        dynLinks.push({ from: RegularJane_1.pi32.tag, to: RegularJane_1.pi42.tag });
        dynLinks.push({ from: RegularJane_1.pi48.tag, to: RegularJane_1.pi49.tag });
        dynLinks.push({ from: RegularJane_1.pi30.tag, to: RegularJane_1.pi31.tag });
        dynLinks.push({ from: RegularJane_1.pi21.tag, to: RegularJane_1.pi22.tag });
        dynLinks.push({ from: RegularJane_1.pi31.tag, to: RegularJane_1.pi41.tag });
        dynLinks.push({ from: RegularJane_1.pi12.tag, to: RegularJane_1.pi13.tag });
    }
    else if (changes == 15) {
        dynLinks.push({ from: RegularJane_1.pi8.tag, to: RegularJane_1.pi17.tag });
        dynLinks.push({ from: RegularJane_1.pi16.tag, to: RegularJane_1.pi17.tag });
        dynLinks.push({ from: RegularJane_1.pi25.tag, to: RegularJane_1.pi26.tag });
        dynLinks.push({ from: RegularJane_1.pi34.tag, to: RegularJane_1.pi35.tag });
        dynLinks.push({ from: RegularJane_1.pi32.tag, to: RegularJane_1.pi33.tag });
        dynLinks.push({ from: RegularJane_1.pi6.tag, to: RegularJane_1.pi31.tag });
        dynLinks.push({ from: RegularJane_1.pi21.tag, to: RegularJane_1.pi32.tag });
        dynLinks.push({ from: RegularJane_1.pi39.tag, to: RegularJane_1.pi49.tag });
        dynLinks.push({ from: RegularJane_1.pi49.tag, to: RegularJane_1.pi50.tag });
        dynLinks.push({ from: RegularJane_1.pi32.tag, to: RegularJane_1.pi42.tag });
        dynLinks.push({ from: RegularJane_1.pi48.tag, to: RegularJane_1.pi49.tag });
        dynLinks.push({ from: RegularJane_1.pi30.tag, to: RegularJane_1.pi31.tag });
        dynLinks.push({ from: RegularJane_1.pi21.tag, to: RegularJane_1.pi22.tag });
        dynLinks.push({ from: RegularJane_1.pi31.tag, to: RegularJane_1.pi41.tag });
        dynLinks.push({ from: RegularJane_1.pi12.tag, to: RegularJane_1.pi13.tag });
    }
    else if (changes == 20) {
        dynLinks.push({ from: RegularJane_1.pi8.tag, to: RegularJane_1.pi17.tag });
        dynLinks.push({ from: RegularJane_1.pi16.tag, to: RegularJane_1.pi17.tag });
        dynLinks.push({ from: RegularJane_1.pi25.tag, to: RegularJane_1.pi26.tag });
        dynLinks.push({ from: RegularJane_1.pi34.tag, to: RegularJane_1.pi35.tag });
        dynLinks.push({ from: RegularJane_1.pi32.tag, to: RegularJane_1.pi33.tag });
        dynLinks.push({ from: RegularJane_1.pi6.tag, to: RegularJane_1.pi31.tag });
        dynLinks.push({ from: RegularJane_1.pi21.tag, to: RegularJane_1.pi32.tag });
        dynLinks.push({ from: RegularJane_1.pi39.tag, to: RegularJane_1.pi49.tag });
        dynLinks.push({ from: RegularJane_1.pi49.tag, to: RegularJane_1.pi50.tag });
        dynLinks.push({ from: RegularJane_1.pi32.tag, to: RegularJane_1.pi42.tag });
        dynLinks.push({ from: RegularJane_1.pi48.tag, to: RegularJane_1.pi49.tag });
        dynLinks.push({ from: RegularJane_1.pi30.tag, to: RegularJane_1.pi31.tag });
        dynLinks.push({ from: RegularJane_1.pi21.tag, to: RegularJane_1.pi22.tag });
        dynLinks.push({ from: RegularJane_1.pi31.tag, to: RegularJane_1.pi41.tag });
        dynLinks.push({ from: RegularJane_1.pi12.tag, to: RegularJane_1.pi13.tag });
        dynLinks.push({ from: RegularJane_1.pi28.tag, to: RegularJane_1.pi29.tag });
        dynLinks.push({ from: RegularJane_1.pi43.tag, to: RegularJane_1.pi44.tag });
        dynLinks.push({ from: RegularJane_1.pi28.tag, to: RegularJane_1.pi33.tag });
        dynLinks.push({ from: RegularJane_1.pi37.tag, to: RegularJane_1.pi47.tag });
        dynLinks.push({ from: RegularJane_1.pi37.tag, to: RegularJane_1.pi38.tag });
    }
    return dynLinks;
}
let master = new JaneMaster(thisIP, masterPort);
function runBenchmark(rate, changes) {
    let totalVals = rate * 30;
    RegularJane_1.spawnPi("monitor", isQPROP, rate, totalVals, csvFile, changes, thisIP, monitorPort, monitorIP, monitorPort);
    //TODO need to provide ref to Jane Master to sink service for termination detection
    RegularJane_1.spawnPi("59", isQPROP, rate, totalVals, csvFile, changes, thisIP, 8005, monitorIP, 8004);
    //TODO instruct master to start and return completion promise
    if (!isQPROP) {
        RegularJane_1.spawnPi("admitter", isQPROP, rate, totalVals, csvFile, changes, thisIP, admitterPort, monitorIP, monitorPort);
    }
}
function runAll() {
    if (dynamic) {
    }
    else {
    }
}
//# sourceMappingURL=JaneMaster.js.map