Object.defineProperty(exports, "__esModule", { value: true });
var spiders = require("../../../src/spiders");
var util = require('util');
//Jane master is either going to run the sink node in the case of QPROP or the admitter in the case of SIDUP
class JaneMaster extends spiders.Application {
    constructor(ip, port) {
        super(ip, port);
        this.slaves = [];
    }
    register(slaveRef) {
        this.slaves.push(slaveRef);
        console.log("Slaves registered : " + this.slaves.length);
        if (this.slaves.length == 57) {
            console.log("STARTING BENCHMARKS");
            runAll();
        }
    }
    startRound(rate, changes) {
        let slaveIndex = 0;
        let proms = [];
        for (var i = 2; i < 59; i++) {
            proms.push(this.slaves[slaveIndex].spawn("pi" + i, isQPROP, rate, csvFile, changes, monitorIP, monitorPort));
            slaveIndex++;
        }
        return Promise.all(proms);
    }
}
//let networkInterface = "em1" (set back to 0)
let networkInterface = "enp0s25";
var os = require('os');
var networkInterfaces = os.networkInterfaces();
var thisIP = networkInterfaces[networkInterface][0].address;
console.log("Master running on " + thisIP);
var masterPort = 8001;
var monitorPort = 8002;
var monitorIP = thisIP;
var fiftyPort = 8003;
var admitterPort = 8004;
let isQPROP = process.argv[2] == "true";
let csvFile = process.argv[3];
let dynamic = process.argv[4] == "true";
//1,50,100,150,200,250,300 are the datarates
let allRates = [1, 50, 100, 150, 200, 250];
let allChanges = [1, 5, 10, 15, 20];
let master = new JaneMaster(thisIP, masterPort);
let monitor;
let admitter;
let pi59;
function spawn(toSpawn, isQPROP, dataRate, csvFile, changes, thisIP, piPort, monitorIP, monitorPort, sync) {
    let command = util.format("node ../RegularJane.js %s %s %d %s %d %s %d %s %d", toSpawn, isQPROP, dataRate, csvFile, changes, thisIP, piPort, monitorIP, monitorPort);
    if (sync) {
        let pi = require('child_process').execSync(command, { stdio: [0, 1, 2] });
        return pi;
    }
    else {
        return require('child_process').exec(command);
    }
}
function runBenchmark(rate, changes) {
    return master.startRound(rate, changes).then(() => {
        monitor = spawn("monitor", isQPROP, rate, csvFile, changes, thisIP, monitorPort, monitorIP, monitorPort, false);
        if (!isQPROP) {
            pi59 = spawn("pi59", isQPROP, rate, csvFile, changes, thisIP, 8005, monitorIP, monitorPort, false);
            spawn("admitter", isQPROP, rate, csvFile, changes, thisIP, admitterPort, monitorIP, monitorPort, true);
        }
        else {
            spawn("pi59", isQPROP, rate, csvFile, changes, thisIP, 8005, monitorIP, monitorPort, true);
        }
        console.log("BENCHMARK FINISHED !!");
        monitor.kill();
        if (pi59) {
            pi59.kill();
        }
        let ps = master.slaves.map((slave) => {
            return slave.killPi();
        });
        return Promise.all(ps);
    });
}
function runAll() {
    if (dynamic) {
        //TODO run for each config yada yada
        runBenchmark(100, 20).then(() => {
            console.log("Running second iteration");
            runBenchmark(100, 20).then(() => {
                console.log("ALL DONE !!!");
            });
        });
    }
    else {
        //TODO run for each config yada yada
        runBenchmark(10, 0).then(() => {
            console.log("Running second iteration");
            runBenchmark(10, 0).then(() => {
                console.log("ALL DONE !!!");
            });
        });
    }
}
//# sourceMappingURL=JaneMaster.js.map