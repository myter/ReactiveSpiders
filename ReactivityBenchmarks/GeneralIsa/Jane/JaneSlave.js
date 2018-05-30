Object.defineProperty(exports, "__esModule", { value: true });
var spiders = require("../../../src/spiders");
var util = require('util');
class JaneSlave extends spiders.Application {
    constructor() {
        super(thisIP, slavePort);
        this.remote(masterIP, masterPort).then((masterRef) => {
            this.masterRef = masterRef;
            masterRef.register(this);
        });
    }
    spawn(toSpawn, isQPROP, dataRate, csvFile, changes, monitorIP, monitorPort) {
        let command = util.format("node ../RegularJane.js %s %s %d %s %d %s %d %s %d", toSpawn, isQPROP, dataRate, csvFile, changes, thisIP, piPort, monitorIP, monitorPort);
        this.pi = require('child_process').exec(command);
    }
    killPi() {
        if (this.pi) {
            this.pi.kill('SIGINT');
        }
    }
}
//let networkInterface = "em1"
let networkInterface = "eth0";
var os = require('os');
var networkInterfaces = os.networkInterfaces();
var thisIP = networkInterfaces[networkInterface][0].address;
//let slavePort           = 8005
//let piPort              = 8006
let masterIP = process.argv[2];
let masterPort = parseInt(process.argv[3]);
//TODO temp to test on bertha
let slavePort = parseInt(process.argv[4]);
let piPort = slavePort + 100;
let slav = new JaneSlave();
//# sourceMappingURL=JaneSlave.js.map