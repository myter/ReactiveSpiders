import {mutating, Signal} from "../../src/Signal";
import {SIDUPAdmitter} from "../../src/SID-UP/SIDUPAdmitter";
import {QPROPActor} from "../../src/QPROP/QPROPActor";
import {Application, PubSubTag, SpiderActorMirror} from "spiders.js";
import {SIDUPActor} from "../../src/SID-UP/SIDUPActor";
import {QPROPApplication} from "../../src/QPROP/QPROPApplication";

class FleetData extends Signal{
    constructionTime

    constructor(mirr){
        super(mirr)
        this.constructionTime = Date.now()
    }

    @mutating
    actualise(){
        this.constructionTime = Date.now()
    }

    equals(otherFleetDataSignal : FleetData){
        return this.constructionTime == otherFleetDataSignal.constructionTime
    }
}



export class QPROPConfigServiceApp extends QPROPApplication{
    FleetData
    rate
    totalVals
    memWriter
    averageMem
    csvFileName
    produced
    close
    thisDir
    okType

    constructor(rate,totalVals,csvFileName,ownType : PubSubTag,okType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,myAddress,myPort,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(ownType,parentTypes,childTypes,myAddress,myPort,psServerAddress,psServerPort)
        this.rate           = rate / 2
        this.totalVals      = totalVals / 2
        this.FleetData      = FleetData
        this.csvFileName    = csvFileName
        this.produced       = 0
        this.close          = false
        this.okType         = okType
        this.thisDir        = __dirname
        this.init()
    }

    init(){
        super.init()
        let writing         = require(this.thisDir+"/writing")
        this.memWriter      = new writing.MemoryWriter("Config")
        this.averageMem     = writing.averageMem
        this.snapMem()
    }

    start(){
        console.log("Config ready")
        let sig = new this.FleetData(this)
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.psClient.subscribe(this.okType).once(()=>{
            this.update(sig)
        })
        return sig
    }

    update(signal){
        for(var i = 0;i < this.rate ;i++){
            this.totalVals--
            this.produced++
            signal.actualise()
        }
        //Memory not measured for max throughput benchmarks
        if(this.totalVals <= 0){
            this.close = true
            this.memWriter.end()
            this.averageMem(this.csvFileName,this.rate*2,"Config")
        }
        else{
            setTimeout(()=>{
                this.update(signal)
            },1000)
        }
    }

    snapMem(){
        if(!this.close){
            this.memWriter.snapshot()
            setTimeout(()=>{
                this.snapMem()
            },500)
        }
    }
}

export class QPROPDataAccessServiceApp extends QPROPApplication{
    rate
    totalVals
    memWriter
    averageMem
    csvFileName
    produced
    close
    thisDir
    FleetData
    okType

    constructor(rate,totalVals,csvFileName,ownType : PubSubTag,okType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,myAddress,myPort,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(ownType,parentTypes,childTypes,myAddress,myPort,psServerAddress,psServerPort)
        this.rate           = rate / 2
        this.totalVals      = totalVals / 2
        this.csvFileName    = csvFileName
        this.produced       = 0
        this.close          = false
        this.thisDir        = __dirname
        this.FleetData      = FleetData
        this.okType         = okType
        this.init()
    }

    init(){
        super.init()
        let writing     = require(this.thisDir+"/writing")
        this.memWriter  = new writing.MemoryWriter("Data")
        this.averageMem = writing.averageMem
        this.snapMem()
    }

    start(){
        console.log("Data ready")
        let sig = new this.FleetData(this)
        //Wait for construction to be completed (for both QPROP and SIDUP)
        this.psClient.subscribe(this.okType).once(()=>{
            this.update(sig)
        })
        return sig
    }

    update(signal){
        for(var i = 0;i < this.rate;i++){
            this.totalVals--
            this.produced++
            signal.actualise()
        }
        if(this.totalVals <= 0){
            this.close = true
            this.memWriter.end()
            this.averageMem(this.csvFileName,this.rate*2,"Data")
        }
        else{
            setTimeout(()=>{
                this.update(signal)
            },1000)
        }
    }

    snapMem(){
        if(!this.close){
            this.memWriter.snapshot()
            setTimeout(()=>{
                this.snapMem()
            },500)
        }
    }
}

export class QPROPGeoServiceApp extends QPROPApplication{
    memWriter
    averageMem
    close
    thisdir
    rate
    totalVals
    csvFileName

    constructor(rate,totalVals,csvFileName,ownType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,myAddress,myPort,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(ownType,parentTypes,childTypes,myAddress,myPort,psServerAddress,psServerPort)
        this.close          = false
        this.thisdir        = __dirname
        this.totalVals      = totalVals
        this.rate           = rate
        this.csvFileName    = csvFileName
        this.init()
    }

    init(){
        super.init()
        let writing     = require(this.thisdir+"/writing")
        this.memWriter  = new writing.MemoryWriter("Geo")
        this.averageMem = writing.averageMem
        this.snapMem()
    }

    start(imp){
        console.log("Geo ready")
        let propagated = 0
        return this.lift((fleetData : FleetData)=>{
            propagated++
            if(propagated == this.totalVals / 2){
                this.close = true
                this.memWriter.end()
                this.averageMem(this.csvFileName,this.rate,"Geo")
            }
            return fleetData.constructionTime
        })(imp)
    }

    snapMem(){
        if(!this.close){
            this.memWriter.snapshot()
            setTimeout(()=>{
                this.snapMem()
            },500)
        }
    }
}

export class QPROPDrivingServiceApp extends QPROPApplication{
    memWriter
    averageMem
    close
    rate
    totalVals
    csvFileName
    thisDir

    constructor(rate,totalVals,csvFileName,ownType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,myAddress,myPort,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(ownType,parentTypes,childTypes,myAddress,myPort,psServerAddress,psServerPort)
        this.close          = false
        this.thisDir        = __dirname
        this.rate           = rate
        this.totalVals      = totalVals
        this.csvFileName    = csvFileName
        this.init()
    }

    init(){
        super.init()
        let writing     = require(this.thisDir+"/writing")
        this.memWriter  = new writing.MemoryWriter("Driving")
        this.averageMem = writing.averageMem
        this.snapMem()
    }

    start(data,geo){
        console.log("Driving ready")
        let propagated = 0
        return this.lift((data,geo)=>{
            propagated++
            if(propagated == this.totalVals / 2){
                this.close = true
                this.memWriter.end()
                this.averageMem(this.csvFileName,this.rate,"Driving")
            }
            return geo
        })(data,geo)
    }

    snapMem(){
        if(!this.close){
            this.memWriter.snapshot()
            setTimeout(()=>{
                this.snapMem()
            },500)
        }
    }
}

export class QPROPDashboardServiceApp extends QPROPApplication{
    memWriter
    averageMem
    averageResults
    close
    thisDir
    rate
    totalVals
    csvFileName
    writer
    tWriter
    pWriter
    okType

    constructor(rate,totalVals,csvFileName,ownType : PubSubTag,okType : PubSubTag,parentTypes : Array<PubSubTag>,childTypes : Array<PubSubTag>,myAdress,myPort,psServerAddress = "127.0.0.1",psServerPort = 8000){
        super(ownType,parentTypes,childTypes,myAdress,myPort,psServerAddress,psServerPort)
        this.close          = false
        this.rate           = rate
        this.totalVals      = totalVals
        this.csvFileName    = csvFileName
        this.thisDir        = __dirname
        this.okType         = okType
        this.init()
    }

    init(){
        super.init()
        var csvWriter           = require('csv-write-stream')
        var fs                  = require('fs')
        let writing             = require(this.thisDir+"/writing")
        this.memWriter          = new writing.MemoryWriter("Dashboard")
        this.averageMem         = writing.averageMem
        this.averageResults     = writing.averageResults
        this.snapMem()
        this.writer             = csvWriter({headers: ["TTP"]})
        this.tWriter            = csvWriter({sendHeaders: false})
        this.pWriter            = csvWriter({sendHeaders: false})
        this.writer.pipe(fs.createWriteStream(this.thisDir+'/temp.csv'))
        this.tWriter.pipe(fs.createWriteStream(this.thisDir+"/Throughput/"+this.csvFileName+this.rate+".csv",{flags: 'a'}))
        this.pWriter.pipe(fs.createWriteStream(this.thisDir+"/Processing/"+this.csvFileName+this.rate+".csv",{flags: 'a'}))
    }

    start(driving,geo,config){
        console.log("Dash ready")
        let valsReceived = 0
        let lastDriving
        let lastConfig
        let firstPropagation = true
        let benchStart
        let processingTimes = []
        this.psClient.publish("ok",this.okType)
        return this.lift((driving,geo,config)=>{
            if(valsReceived +1 <= this.totalVals){
                console.log("Received: " + valsReceived + " needed: " + this.totalVals)
                if(firstPropagation){
                    benchStart = Date.now()
                    firstPropagation = false
                }
                let timeToPropagate
                if(lastDriving != driving){
                    timeToPropagate = Date.now() - driving
                }
                else{
                    timeToPropagate = Date.now() - config.constructionTime
                }
                lastDriving = driving
                lastConfig  = config
                valsReceived++
                this.writer.write([timeToPropagate])
                processingTimes.push(timeToPropagate)
                if(valsReceived == this.totalVals){
                    this.close = true
                    console.log("Benchmark Finished")
                    this.writer.end()
                    this.memWriter.end()
                    let benchStop = Date.now()
                    this.tWriter.write({time: (benchStop - benchStart),values: this.totalVals})
                    this.tWriter.end()
                    let total = 0
                    processingTimes.forEach((pTime)=>{
                        total += pTime
                    })
                    let avg = total / processingTimes.length
                    this.pWriter.write({pTime: avg})
                    this.pWriter.end()
                    this.averageResults(this.csvFileName,this.rate).then(()=>{
                        this.averageMem(this.csvFileName,this.rate,"Dashboard").then(()=>{
                            require('child_process').exec("killall node");
                        })
                    })
                }
            }
        })(driving,geo,config)
    }

    snapMem(){
        if(!this.close){
            this.memWriter.snapshot()
            setTimeout(()=>{
                this.snapMem()
            },500)
        }
    }
}

export class UseCaseApp extends Application{
    completeResolve
    constructor(){
        super(new SpiderActorMirror(),"127.0.0.1",8000)
        this.libs.setupPSServer()
    }

    dashDone(){
        this.kill()
        this.libs.setupPSServer()
        this.completeResolve()
    }

    onComplete(){
        return new Promise((resolve)=>{
            this.completeResolve = resolve
        })
    }
}

export var dataTag      = new PubSubTag("Data")
export var configTag    = new PubSubTag("Config")
export var geoTag       = new PubSubTag("Geo")
export var drivingTag   = new PubSubTag("Driving")
export var dashTag      = new PubSubTag("Dash")
export var admitterTag  = new PubSubTag("Admitter")
export var okTag        = new PubSubTag("ok")