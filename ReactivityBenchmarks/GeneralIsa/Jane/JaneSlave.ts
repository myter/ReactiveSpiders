import {SpiderLib} from "../../../src/spiders";
import {mapToName} from "../Services";
import {spawnPi} from "../RegularJane";
var spiders : SpiderLib = require("../../../src/spiders")

class JaneSlave extends spiders.Application {
    masterRef

    constructor() {
        super(myIP, slavePort)
        this.remote(masterIP, masterPort).then((masterRef) => {
            this.masterRef = masterRef
            masterRef.register(this)
        })
    }

    spawn(toSpawn,isQPROP,dataRate,totalVals,csvFile,changes,ownIp,ownPort,monitorIP,monitorPort){
        spawnPi(toSpawn,isQPROP,dataRate,totalVals,csvFile,changes,myIP,piPort,monitorIP,monitorPort)
    }
}

let myIP
let slavePort        = 8001
let piPort           = 8000
let masterIP         = process.argv[2]
let masterPort       = parseInt(process.argv[3])
let slav             = new JaneSlave()