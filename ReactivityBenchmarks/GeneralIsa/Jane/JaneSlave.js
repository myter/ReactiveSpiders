Object.defineProperty(exports, "__esModule", { value: true });
const RegularJane_1 = require("../RegularJane");
var spiders = require("../../../src/spiders");
class JaneSlave extends spiders.Application {
    constructor() {
        super(thisIP, slavePort);
        this.remote(masterIP, masterPort).then((masterRef) => {
            this.masterRef = masterRef;
            masterRef.register(this);
        });
    }
    spawn(toSpawn, isQPROP, dataRate, totalVals, csvFile, changes, monitorIP, monitorPort) {
        RegularJane_1.spawnPi(toSpawn, isQPROP, dataRate, totalVals, csvFile, changes, thisIP, piPort, monitorIP, monitorPort);
        console.log("PI SPAWNED!!");
    }
}
let networkInterface = "em1";
var os = require('os');
var networkInterfaces = os.networkInterfaces();
var thisIP = networkInterfaces[networkInterface][0].address;
let slavePort = 8005;
let piPort = 8006;
let masterIP = process.argv[2];
let masterPort = parseInt(process.argv[3]);
let slav = new JaneSlave();
//# sourceMappingURL=JaneSlave.js.map