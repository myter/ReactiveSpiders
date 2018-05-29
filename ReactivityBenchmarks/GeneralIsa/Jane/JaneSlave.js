Object.defineProperty(exports, "__esModule", { value: true });
const RegularJane_1 = require("../RegularJane");
var spiders = require("../../../src/spiders");
class JaneSlave extends spiders.Application {
    constructor() {
        super(myIP, slavePort);
        this.remote(masterIP, masterPort).then((masterRef) => {
            this.masterRef = masterRef;
            masterRef.register(this);
        });
    }
    spawn(toSpawn, isQPROP, dataRate, totalVals, csvFile, changes, monitorIP, monitorPort) {
        RegularJane_1.spawnPi(toSpawn, isQPROP, dataRate, totalVals, csvFile, changes, myIP, piPort, monitorIP, monitorPort);
        console.log("PI SPAWNED!!");
    }
}
let myIP;
let slavePort = 8005;
let piPort = 8006;
let masterIP = process.argv[2];
let masterPort = parseInt(process.argv[3]);
let slav = new JaneSlave();
//# sourceMappingURL=JaneSlave.js.map