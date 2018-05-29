import {SpiderLib} from "../../../src/spiders";
import {
    pi12,
    pi13, pi16, pi17,
    pi21,
    pi22, pi25, pi26, pi28, pi29,
    pi30,
    pi31,
    pi32, pi33, pi34, pi35, pi37, pi38,
    pi39,
    pi41,
    pi42, pi43, pi44, pi47,
    pi48,
    pi49,
    pi50,
    pi6, pi8,
    spawnPi
} from "../RegularJane";
import {mapToName} from "../ServicesJane";
var spiders : SpiderLib = require("../../../src/spiders")


//TODO REPL to send commands to slaves
//TODO monitoring of down nodes + check if all nodes there before sending message

//Jane master is either going to run the sink node in the case of QPROP or the admitter in the case of SIDUP
class JaneMaster extends spiders.Application{
    constructor(ip : string,port : number){
        super(ip,port)
    }

    register(slaveRef){

    }

    benchEnd(){

    }


}
let networkInterface = "em1"
var os = require( 'os' );
var networkInterfaces = os.networkInterfaces( );
var thisIP        = networkInterfaces[networkInterface][1].address
var masterPort    = 8000
var monitorPort   = 8001
var monitorIP     = thisIP
var fiftyPort     = 8002
var admitterPort  = 8003

let isQPROP         = process.argv[2] == "true"
let toSpawn         = mapToName(process.argv[3])
let csvFile         = process.argv[4]
let dynamic         = process.argv[5] == "true"
/*let dataRate    = parseInt(process.argv[3]) / 10
let totalVals   = dataRate * 30
let csvFile     = process.argv[4]
let changes     = parseInt(process.argv[5])*/

//1,50,100,150,200,250,300 are the datarates
let allRates        = [1,50,100,150,200,250]
let allChanges      = [1,5,10,15,20]

function generateDynLinks(changes){
    //Avoid introducing cycles and double dependencies
    let dynLinks = []
    if(changes == 1){
        dynLinks.push({from: pi6.tag,to: pi31.tag})
    }
    else if(changes == 5){
        dynLinks.push({from: pi6.tag,to: pi31.tag})
        dynLinks.push({from: pi21.tag,to: pi32.tag})
        dynLinks.push({from: pi39.tag,to: pi49.tag})
        dynLinks.push({from: pi49.tag,to: pi50.tag})
        dynLinks.push({from: pi32.tag,to: pi42.tag})
    }
    else if(changes == 10){
        dynLinks.push({from: pi6.tag,to: pi31.tag})
        dynLinks.push({from: pi21.tag,to: pi32.tag})
        dynLinks.push({from: pi39.tag,to: pi49.tag})
        dynLinks.push({from: pi49.tag,to: pi50.tag})
        dynLinks.push({from: pi32.tag,to: pi42.tag})
        dynLinks.push({from: pi48.tag,to: pi49.tag})
        dynLinks.push({from: pi30.tag,to: pi31.tag})
        dynLinks.push({from: pi21.tag,to: pi22.tag})
        dynLinks.push({from: pi31.tag,to: pi41.tag})
        dynLinks.push({from: pi12.tag,to: pi13.tag})
    }
    else if(changes == 15){
        dynLinks.push({from: pi8.tag,to: pi17.tag})
        dynLinks.push({from: pi16.tag,to: pi17.tag})
        dynLinks.push({from: pi25.tag,to: pi26.tag})
        dynLinks.push({from: pi34.tag,to: pi35.tag})
        dynLinks.push({from: pi32.tag,to: pi33.tag})

        dynLinks.push({from: pi6.tag,to: pi31.tag})
        dynLinks.push({from: pi21.tag,to: pi32.tag})
        dynLinks.push({from: pi39.tag,to: pi49.tag})
        dynLinks.push({from: pi49.tag,to: pi50.tag})
        dynLinks.push({from: pi32.tag,to: pi42.tag})
        dynLinks.push({from: pi48.tag,to: pi49.tag})
        dynLinks.push({from: pi30.tag,to: pi31.tag})
        dynLinks.push({from: pi21.tag,to: pi22.tag})
        dynLinks.push({from: pi31.tag,to: pi41.tag})
        dynLinks.push({from: pi12.tag,to: pi13.tag})


    }
    else if(changes == 20){
        dynLinks.push({from: pi8.tag,to: pi17.tag})
        dynLinks.push({from: pi16.tag,to: pi17.tag})
        dynLinks.push({from: pi25.tag,to: pi26.tag})
        dynLinks.push({from: pi34.tag,to: pi35.tag})
        dynLinks.push({from: pi32.tag,to: pi33.tag})
        dynLinks.push({from: pi6.tag,to: pi31.tag})
        dynLinks.push({from: pi21.tag,to: pi32.tag})
        dynLinks.push({from: pi39.tag,to: pi49.tag})
        dynLinks.push({from: pi49.tag,to: pi50.tag})
        dynLinks.push({from: pi32.tag,to: pi42.tag})
        dynLinks.push({from: pi48.tag,to: pi49.tag})
        dynLinks.push({from: pi30.tag,to: pi31.tag})
        dynLinks.push({from: pi21.tag,to: pi22.tag})
        dynLinks.push({from: pi31.tag,to: pi41.tag})
        dynLinks.push({from: pi12.tag,to: pi13.tag})

        dynLinks.push({from: pi28.tag,to: pi29.tag})
        dynLinks.push({from: pi43.tag,to: pi44.tag})
        dynLinks.push({from: pi28.tag,to: pi33.tag})
        dynLinks.push({from: pi37.tag,to: pi47.tag})
        dynLinks.push({from: pi37.tag,to: pi38.tag})
    }
    return dynLinks
}


let master = new JaneMaster(thisIP,masterPort)

function runBenchmark(rate,changes){
    let totalVals = rate * 30
    spawnPi("monitor",isQPROP,rate,totalVals,csvFile,changes,thisIP,monitorPort,monitorIP,monitorPort)
    //TODO need to provide ref to Jane Master to sink service for termination detection
    spawnPi("59",isQPROP,rate,totalVals,csvFile,changes,thisIP,8005,monitorIP,8004)
    //TODO instruct master to start and return completion promise
    if(!isQPROP){
        spawnPi("admitter",isQPROP,rate,totalVals,csvFile,changes,thisIP,admitterPort,monitorIP,monitorPort)
    }
}

function runAll(){
    if(dynamic){

    }
    else{

    }
}

