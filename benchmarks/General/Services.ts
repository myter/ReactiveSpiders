import {Application} from "spiders.js";
import {mutating, Signal} from "../../src/Signal";
import {SIDUPAdmitter} from "../../src/SID-UP/SIDUPAdmitter";
import {QPROPActor} from "../../src/QPROP/QPROPActor";
import {PersistMemWriter} from "./writing";

var csvWriter = require('csv-write-stream')
var fs = require('fs')
var csv = require('fast-csv')

//PI tags
let app = new Application()
export var pi2Tag           = new app.libs.PubSubTag("2")
export var pi3Tag           = new app.libs.PubSubTag("3")
export var pi4Tag           = new app.libs.PubSubTag("4")
export var pi5Tag           = new app.libs.PubSubTag("5")
export var pi6Tag           = new app.libs.PubSubTag("6")
export var pi7Tag           = new app.libs.PubSubTag("7")
export var pi8Tag           = new app.libs.PubSubTag("8")
export var pi9Tag           = new app.libs.PubSubTag("9")
export var pi10Tag          = new app.libs.PubSubTag("10")
export var pi11Tag          = new app.libs.PubSubTag("11")
export var pi12Tag          = new app.libs.PubSubTag("12")
export var pi13Tag          = new app.libs.PubSubTag("13")
export var pi14Tag          = new app.libs.PubSubTag("14")
export var pi15Tag          = new app.libs.PubSubTag("15")
export var pi16Tag          = new app.libs.PubSubTag("16")
export var pi17Tag          = new app.libs.PubSubTag("17")
export var pi18Tag          = new app.libs.PubSubTag("18")
export var pi19Tag          = new app.libs.PubSubTag("19")
export var pi20Tag          = new app.libs.PubSubTag("20")
export var pi21Tag          = new app.libs.PubSubTag("21")
export var pi22Tag          = new app.libs.PubSubTag("22")
export var pi23Tag          = new app.libs.PubSubTag("23")
export var pi24Tag          = new app.libs.PubSubTag("24")
export var pi25Tag          = new app.libs.PubSubTag("25")
export var pi26Tag          = new app.libs.PubSubTag("26")
export var pi27Tag          = new app.libs.PubSubTag("27")
export var pi28Tag          = new app.libs.PubSubTag("28")
export var pi29Tag          = new app.libs.PubSubTag("29")
export var pi30Tag          = new app.libs.PubSubTag("30")
export var pi31Tag          = new app.libs.PubSubTag("31")
export var pi32Tag          = new app.libs.PubSubTag("32")
export var pi33Tag          = new app.libs.PubSubTag("33")
export var pi34Tag          = new app.libs.PubSubTag("34")
export var pi35Tag          = new app.libs.PubSubTag("35")
export var pi36Tag          = new app.libs.PubSubTag("36")
export var pi37Tag          = new app.libs.PubSubTag("37")
export var pi38Tag          = new app.libs.PubSubTag("38")
export var pi39Tag          = new app.libs.PubSubTag("39")
export var pi40Tag          = new app.libs.PubSubTag("40")
export var pi41Tag          = new app.libs.PubSubTag("41")
export var pi42Tag          = new app.libs.PubSubTag("42")
export var pi43Tag          = new app.libs.PubSubTag("43")
export var pi44Tag          = new app.libs.PubSubTag("44")
export var pi45Tag          = new app.libs.PubSubTag("45")
export var pi46Tag          = new app.libs.PubSubTag("46")
export var pi47Tag          = new app.libs.PubSubTag("47")
export var pi48Tag          = new app.libs.PubSubTag("48")
export var pi49Tag          = new app.libs.PubSubTag("49")
export var pi50Tag          = new app.libs.PubSubTag("50")
export var pi51Tag          = new app.libs.PubSubTag("51")
export var pi52Tag          = new app.libs.PubSubTag("52")
export var pi53Tag          = new app.libs.PubSubTag("53")
export var pi54Tag          = new app.libs.PubSubTag("54")
export var pi55Tag          = new app.libs.PubSubTag("55")
export var pi56Tag          = new app.libs.PubSubTag("56")
export var pi57Tag          = new app.libs.PubSubTag("57")
export var pi58Tag          = new app.libs.PubSubTag("58")
export var pi59Tag          = new app.libs.PubSubTag("59")
export var admitterTag      = new app.libs.PubSubTag("Admitter")
app.kill()
app = null
export var monitorId     = 0
export var monitorIP     = "10.0.0.10"
export var monitorPort   = 8001
export var admitterId   = 1
export var admitterIP   = "10.0.0.10"
export var admitterPort = 8002
export var piIds        = []
for(var i = 2;i < 60;i++){
    piIds.push(i)
}
export var piAddresses = piIds.map((id,index)=>{
    if(id >= 2 && id <= 14){
        return "10.0.0.10"
    }
    else if(id > 14 && id <= 30){
        return "10.0.0.11"
    }
    else if(id > 30 && id <= 45){
        return "10.0.0.12"
    }
    else {
        return "10.0.0.13"
    }
})
let base = 8003
export var piPorts      = piIds.map((id,index)=>{
    return base + index
})
export function mapToName(piHostName){
    return piHostName
}
//PI tags




export class PropagationValue extends Signal{
    constructionTime

    constructor(mirr){
        super(mirr)
        this.constructionTime = Date.now()
    }

    @mutating
    actualise(){
        this.constructionTime = Date.now()
    }

    equals(otherVal : PropagationValue){
        return this.constructionTime == otherVal.constructionTime
    }
}

export class ServiceInfo{
    parents
    children
    address
    port
    tag
    constructor(tag,parents,children,address,port){
        this.tag = tag
        this.parents = parents
        this.children = children
        this.address = address
        this.port = port
    }
}



export class Admitter extends SIDUPAdmitter{
    memWriter
    close
    dynamicLinks
    thisDir
    changes
    totalVals
    csvFileName
    dataRate

    constructor(admiterTag,psServerAddress,psServerPort,totalVals,csvFileName,dataRate,numSources,dynamicLinks,changes){
        super(admiterTag,numSources,1,psServerAddress,psServerPort)
        this.close          = false
        this.dynamicLinks   = dynamicLinks
        this.thisDir        = __dirname
        this.changes        = changes
        this.totalVals      = totalVals
        this.csvFileName    = csvFileName
        this.dataRate       = dataRate
    }

    init(){
        let writing             = require(this.thisDir+"/writing")
        this.memWriter          = new writing.MemoryWriter("Admitter")
        var csvWriter           = require('csv-write-stream')
        var fs                  = require('fs')
        let writer              = csvWriter({ sendHeaders: false})
        if(this.changes > 0){
            writer.pipe(fs.createWriteStream(this.thisDir +"/Processing/"+this.csvFileName+this.changes+".csv",{flags: 'a'}))
        }
        else{
            writer.pipe(fs.createWriteStream(this.thisDir+"/Processing/"+this.csvFileName+this.dataRate+".csv",{flags: 'a'}))
        }
        this.snapMem()
        this.changeListener = (newValue) => {
            let propagationTime = Date.now()
            newValue.constructionTime = propagationTime
            return newValue
        }
        let valsReceived = -1
        let admitTimes = []
        let processTimes = []
        this.idleListener = ()=>{
            valsReceived++
            if(valsReceived > 0){
                if(valsReceived == 1){
                    this.checkDynamicLinks()
                }
                this.close = true
                let processTime = Date.now() - (admitTimes.splice(0,1)[0])
                processTimes.push(processTime)
                if(valsReceived == this.totalVals){
                    let total = 0
                    processTimes.forEach((pTime)=>{
                        total += pTime
                    })
                    let avg = total / processTimes.length
                    writer.write({pTime: avg})
                    writer.end()
                    this.memWriter.end()
                    if(this.changes > 0){
                        writing.averageMem(this.csvFileName,this.changes,"Admitter",true)
                    }
                    else{
                        writing.averageMem(this.csvFileName,this.dataRate,"Admitter",true)
                    }
                }
            }
        }
        this.admitListener = ()=>{
            admitTimes.push(Date.now())
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

    checkDynamicLinks(){
        if(this.dynamicLinks.length > 0){
            setTimeout(()=>{
                let link = this.dynamicLinks.splice(0,1)[0]
                let from = link.from
                let to  = link.to
                console.log("ADDING DYNAMIC DEPENDENCY")
                console.log("From: " + from.tagVal + " to: " + to.tagVal)
                this.addDependency(from,to)
                this.checkDynamicLinks()
            },Math.floor(Math.random() * 100) + 50)
        }
    }
}

export class QPROPSourceService extends QPROPActor{
    rate
    totalVals
    csvFileName
    memWriter
    close
    myTag
    dynamicLinks
    changes
    PropagationValue
    thisDir

    constructor(rate,totalVals,csvFileName,serverAddress,serverPort,myTag,directParentsTags,directChildrenTags,dynamicLinkTags,changes){
        super(myTag,directParentsTags,directChildrenTags,serverAddress,serverPort)
        this.rate               = rate
        this.changes            = changes
        this.PropagationValue   = PropagationValue
        this.close              = false
        this.myTag              = myTag
        this.dynamicLinks       = dynamicLinkTags
        this.totalVals          = totalVals
        this.csvFileName        = csvFileName
        this.thisDir            = __dirname
    }

    init(){
        let writing             = require(this.thisDir+"/writing")
        this.memWriter          = new writing.PersistMemWriter()
        this.snapMem()
    }

    start(){
        let sig = this.PropagationValue(this.libs.reflectOnActor())
        //Wait for construction to be completed (for both QPROP and SIDUP)
        setTimeout(()=>{
            this.update(sig)
            this.checkDynamicLinks()
        },10000)
        return sig
    }

    update(signal){
        for(var i = 0;i < this.rate;i++){
            this.totalVals--
            signal.actualise()
        }
        setTimeout(()=>{
            this.update(signal)
        },1000)
    }

    snapMem(){
        if(!this.close){
            if(this.changes > 0){
                this.memWriter.snapshot(this.csvFileName,this.changes,this.myTag.tagVal)

            }
            else{
                this.memWriter.snapshot(this.csvFileName,this.rate,this.myTag.tagVal)
            }
            setTimeout(()=>{
                this.snapMem()
            },500)
        }
    }

    checkDynamicLinks(){
        if(this.dynamicLinks.length > 0){
            setTimeout(()=>{
                let link = this.dynamicLinks.splice(0,1)[0]
                let from = link.from
                let to  = link.to
                if(this.myTag.equals(to)){
                    console.log("ADDING DYNAMIC DEPENDENCY")
                    console.log("From: " + from.tagVal + " to: " + to.tagVal)
                    this.addDependency(from)
                    this.checkDynamicLinks()
                }
            },Math.floor(Math.random() * 100) + 50)
        }
    }
}

export class QPROPDerivedService extends QPROPActor{
    close
    memWriter : PersistMemWriter
    csvfileName
    rate
    myTag
    changes
    thisDir
    dynamicLinks

    constructor(rate,totalVals,csvFileName,serverAddress,serverPort,myTag,directParentsTag,directChildrenTags,dynamicLinkTags,changes){
        super(myTag,directParentsTag,directChildrenTags,serverAddress,serverPort)
        this.close              = false
        this.rate               = rate
        this.changes            = changes
        this.csvfileName        = csvFileName
        this.myTag              = myTag
        this.thisDir            = __dirname
        this.dynamicLinks       = dynamicLinkTags
    }

    init(){
        let writing     = require(this.thisDir+"/writing")
        this.memWriter = new writing.PersistMemWriter()
        this.snapMem()
    }

    start(imp){
        let firstPropagation = true
        let lastArgs
        return this.libs.lift((args)=>{
            this.checkDynamicLinks()
            if(firstPropagation){
                firstPropagation = false
                lastArgs = args
                let ret
                args.forEach((v)=>{
                    if(v){
                        ret = v
                    }
                })
                return ret
            }
            else{
                let newV
                args.some((v,index)=>{
                    if(lastArgs[index] != v && v != undefined && v != null){
                        newV = v
                        return true
                    }
                })
                lastArgs = args
                return newV
            }
        })(imp)
    }

    snapMem(){
        if(!this.close){
            if(this.changes > 0){
                this.memWriter.snapshot(this.csvfileName,this.changes,this.myTag.tagVal)
            }
            else{
                this.memWriter.snapshot(this.csvfileName,this.rate,this.myTag.tagVal)
            }
            setTimeout(()=>{
                this.snapMem()
            },500)
        }
    }

    checkDynamicLinks(){
        if(this.dynamicLinks.length > 0){
            setTimeout(()=>{
                let link = this.dynamicLinks.splice(0,1)[0]
                let from = link.from
                let to  = link.to
                if(this.myTag.equals(to)){
                    console.log("ADDING DYNAMIC DEPENDENCY")
                    console.log("From: " + from.tagVal + " to: " + to.tagVal)
                    this.addDependency(from)
                    this.checkDynamicLinks()
                }
            },Math.floor(Math.random() * 100) + 50)
        }
    }
}

export class QPROPSinkService extends QPROPActor{
    close
    memWriter
    changes
    myTag
    dynamicLinks
    averageMem
    averageResults
    writer
    tWriter
    pWriter
    csvFileName
    rate
    totalVals

    constructor(rate,totalVals,csvFileName,serverAddress,serverPort,myTag,directParentTags,directChildrenTags,numSources,dynamicLinks,changes){
        super(myTag,directParentTags,directChildrenTags,serverAddress,serverPort)
        this.close          = false
        this.changes        = changes
        this.dynamicLinks   = dynamicLinks
        this.thisDir        = __dirname
        this.myTag          =  myTag
        this.csvFileName    = csvFileName
        this.rate           = rate
        this.totalVals      = totalVals
    }

    init(){
        let writing             = require(this.thisDir+"/writing")
        var csvWriter           = require('csv-write-stream')
        var fs                  = require('fs')
        this.memWriter          = new writing.MemoryWriter(this.myTag.tagVal)
        this.averageResults     = writing.averageResults
        this.averageMem         = writing.averageMem
        this.snapMem()
        this.writer             = csvWriter({headers: ["TTP"]})
        this.tWriter            = csvWriter({sendHeaders: false})
        this.pWriter            = csvWriter({sendHeaders: false})
        this.writer.pipe(fs.createWriteStream(this.thisDir+'/temp.csv'))
        if(this.changes > 0){
            this.tWriter.pipe(fs.createWriteStream(this.thisDir+"/Throughput/"+this.csvFileName+this.changes+".csv",{flags: 'a'}))
            this.pWriter.pipe(fs.createWriteStream(this.thisDir+"/Processing/"+this.csvFileName+this.changes+".csv",{flags: 'a'}))
        }
        else{
            this.tWriter.pipe(fs.createWriteStream(this.thisDir+"/Throughput/"+this.csvFileName+this.rate+".csv",{flags: 'a'}))
            this.pWriter.pipe(fs.createWriteStream(this.thisDir+"/Processing/"+this.csvFileName+this.rate+".csv",{flags: 'a'}))
        }
    }

    start(imp){
        let lastArgs
        let firstPropagation = true
        let benchStart
        let processingTimes = []
        let valsReceived = 0
        return this.libs.lift((args)=>{
            this.checkDynamicLinks()
            let timeToPropagate
            if(firstPropagation){
                benchStart = Date.now()
                firstPropagation = false
                lastArgs = args
                args.forEach((v)=>{
                    if(v){
                        timeToPropagate = Date.now() - v.constructionTime
                    }
                })
            }
            else{
                let newV
                args.some((v,index)=>{
                    if(lastArgs[index] != v && v != undefined && v != null){
                        newV = v
                        return true
                    }
                })
                timeToPropagate = Date.now() - newV.constructionTime
            }
            lastArgs = args
            valsReceived++
            console.log("Values propagated: " + valsReceived)
            this.writer.write([timeToPropagate])
            processingTimes.push(timeToPropagate)
            if(valsReceived == this.totalVals){
                console.log("Benchmark Finished")
                this.writer.end()
                let benchStop = Date.now()
                this.tWriter.write({time: (benchStop - benchStart),values: this.totalVals})
                this.tWriter.end()
                this.memWriter.end()
                //QPROP SPECIFIC
                let total = 0
                processingTimes.forEach((pTime)=>{
                    total += pTime
                })
                let avg = total / processingTimes.length
                this.pWriter.write({pTime: avg})
                this.pWriter.end()
                if(this.changes > 0){
                    this.averageResults(this.csvFileName,this.changes)
                    this.averageMem(this.csvFileName,this.changes,this.myTag.tagVal)
                }
                else{
                    this.averageResults(this.csvFileName,this.rate)
                    this.averageMem(this.csvFileName,this.rate,this.myTag.tagVal)
                }

            }
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

    checkDynamicLinks(){
        if(this.dynamicLinks.length > 0){
            setTimeout(()=>{
                let link = this.dynamicLinks.splice(0,1)[0]
                let from = link.from
                let to  = link.to
                if(this.myTag.equals(to)){
                    console.log("ADDING DYNAMIC DEPENDENCY")
                    console.log("From: " + from.tagVal + " to: " + to.tagVal)
                    this.addDependency(from)
                    this.checkDynamicLinks()
                }
            },Math.floor(Math.random() * 100) + 50)
        }
    }
}