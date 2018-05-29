import {
    Admitter, DerivedService, mapToName,
    pi12Tag, pi13Tag, pi14Tag, pi15Tag, pi16Tag, pi17Tag, pi18Tag, pi19Tag, pi20Tag, pi21Tag, pi22Tag,
    pi23Tag, pi24Tag, pi25Tag, pi26Tag, pi27Tag, pi28Tag, pi29Tag,
    pi2Tag, pi30Tag, pi31Tag, pi32Tag, pi33Tag, pi34Tag, pi35Tag, pi36Tag, pi37Tag, pi38Tag, pi39Tag, pi3Tag, pi40Tag,
    pi41Tag, pi42Tag, pi43Tag, pi44Tag, pi45Tag, pi46Tag, pi47Tag, pi48Tag, pi49Tag, pi4Tag,
    pi50Tag, pi51Tag, pi52Tag, pi53Tag, pi54Tag, pi55Tag, pi56Tag, pi57Tag, pi58Tag, pi59Tag, pi5Tag, pi6Tag,
    pi7Tag,
    ServiceInfo, SinkService, SourceService, pi10Tag, pi8Tag, pi11Tag, pi9Tag
} from "./ServicesJane";
import {ServiceMonitor} from "../../src/MicroService/ServiceMonitor";

export var pi2 = new ServiceInfo(pi2Tag,[],[pi12Tag,pi13Tag])
export var pi3 = new ServiceInfo(pi3Tag,[],[pi14Tag,pi15Tag])
export var pi4 = new ServiceInfo(pi4Tag,[],[pi12Tag])
export var pi5 = new ServiceInfo(pi5Tag,[],[pi14Tag])
export var pi6 = new ServiceInfo(pi6Tag,[],[pi30Tag])
export var pi7 = new ServiceInfo(pi7Tag,[],[pi19Tag,pi20Tag])
export var pi8 = new ServiceInfo(pi8Tag,[],[pi16Tag])
export var pi9 = new ServiceInfo(pi9Tag,[],[pi20Tag])
export var pi10 = new ServiceInfo(pi10Tag,[],[pi17Tag])
export var pi11 = new ServiceInfo(pi11Tag,[],[pi18Tag])
export var pi12 = new ServiceInfo(pi12Tag,[pi2Tag,pi4Tag],[pi21Tag,pi22Tag])
export var pi13 = new ServiceInfo(pi13Tag,[pi2Tag],[pi22Tag])
export var pi14 = new ServiceInfo(pi14Tag,[pi3Tag,pi5Tag],[pi23Tag,pi24Tag])
export var pi15 = new ServiceInfo(pi15Tag,[pi3Tag],[pi23Tag,pi24Tag])
export var pi16 = new ServiceInfo(pi16Tag,[pi8Tag],[pi25Tag,pi26Tag])
export var pi17 = new ServiceInfo(pi17Tag,[pi10Tag],[pi26Tag])
export var pi18 = new ServiceInfo(pi18Tag,[pi11Tag],[pi27Tag])
export var pi19 = new ServiceInfo(pi19Tag,[pi7Tag],[pi28Tag,pi29Tag])
export var pi20 = new ServiceInfo(pi20Tag,[pi7Tag,pi9Tag],[pi29Tag])
export var pi21 = new ServiceInfo(pi21Tag,[pi12Tag],[pi31Tag])
export var pi22 = new ServiceInfo(pi22Tag,[pi12Tag,pi13Tag],[pi32Tag])
export var pi23 = new ServiceInfo(pi23Tag,[pi14Tag,pi15Tag],[pi33Tag])
export var pi24 = new ServiceInfo(pi24Tag,[pi14Tag,pi15Tag],[pi33Tag])
export var pi25 = new ServiceInfo(pi25Tag,[pi16Tag],[pi34Tag])
export var pi26 = new ServiceInfo(pi26Tag,[pi16Tag,pi17Tag],[pi35Tag])
export var pi27 = new ServiceInfo(pi27Tag,[pi18Tag],[pi36Tag])
export var pi28 = new ServiceInfo(pi28Tag,[pi19Tag],[pi37Tag])
export var pi29 = new ServiceInfo(pi29Tag,[pi19Tag,pi20Tag],[pi38Tag])
export var pi30 = new ServiceInfo(pi30Tag,[pi6Tag],[pi39Tag,pi40Tag])
export var pi31 = new ServiceInfo(pi31Tag,[pi21Tag],[pi39Tag])
export var pi32 = new ServiceInfo(pi32Tag,[pi22Tag],[pi41Tag])
export var pi33 = new ServiceInfo(pi33Tag,[pi23Tag,pi24Tag],[pi42Tag])
export var pi34 = new ServiceInfo(pi34Tag,[pi25Tag],[pi43Tag])
export var pi35 = new ServiceInfo(pi35Tag,[pi26Tag],[pi44Tag])
export var pi36 = new ServiceInfo(pi36Tag,[pi27Tag],[pi45Tag])
export var pi37 = new ServiceInfo(pi37Tag,[pi28Tag],[pi46Tag])
export var pi38 = new ServiceInfo(pi38Tag,[pi29Tag],[pi47Tag])
export var pi39 = new ServiceInfo(pi39Tag,[pi30Tag,pi31Tag],[pi48Tag])
export var pi40 = new ServiceInfo(pi40Tag,[pi30Tag],[pi49Tag,pi50Tag])
export var pi41 = new ServiceInfo(pi41Tag,[pi32Tag],[pi50Tag])
export var pi42 = new ServiceInfo(pi42Tag,[pi33Tag],[pi50Tag])
export var pi43 = new ServiceInfo(pi43Tag,[pi34Tag],[pi51Tag])
export var pi44 = new ServiceInfo(pi44Tag,[pi35Tag],[pi52Tag,pi51Tag])
export var pi45 = new ServiceInfo(pi45Tag,[pi36Tag],[pi53Tag])
export var pi46 = new ServiceInfo(pi46Tag,[pi37Tag],[pi54Tag])
export var pi47 = new ServiceInfo(pi47Tag,[pi38Tag],[pi54Tag,pi55Tag])
export var pi48 = new ServiceInfo(pi48Tag,[pi39Tag],[pi57Tag])
export var pi49 = new ServiceInfo(pi49Tag,[pi40Tag],[pi57Tag])
export var pi50 = new ServiceInfo(pi50Tag,[pi40Tag,pi41Tag,pi42Tag],[pi57Tag])
export var pi51 = new ServiceInfo(pi51Tag,[pi43Tag,pi44Tag],[pi56Tag])
export var pi52 = new ServiceInfo(pi52Tag,[pi44Tag],[pi56Tag],)
export var pi53 = new ServiceInfo(pi53Tag,[pi45Tag],[pi58Tag])
export var pi54 = new ServiceInfo(pi54Tag,[pi46Tag,pi47Tag],[pi58Tag])
export var pi55 = new ServiceInfo(pi55Tag,[pi47Tag],[pi58Tag])
export var pi56 = new ServiceInfo(pi56Tag,[pi51Tag,pi52Tag],[pi59Tag])
export var pi57 = new ServiceInfo(pi57Tag,[pi48Tag,pi49Tag,pi50Tag],[pi59Tag])
export var pi58 = new ServiceInfo(pi58Tag,[pi53Tag,pi54Tag,pi55Tag],[pi59Tag])
export var pi59 = new ServiceInfo(pi59Tag,[pi57Tag,pi56Tag,pi58Tag],[])




export function spawnPi(toSpawn,isQPROP,dataRate,totalVals,csvFile,changes,ownIp,ownPort,monitorIP,monitorPort,master?){
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
    switch (toSpawn){
        case "admitter":
            new Admitter(ownIp,ownPort,monitorIP,monitorPort,totalVals,csvFile,dataRate,10,dynLinks,changes,master)
            break
        case "monitor":
            new ServiceMonitor(monitorIP,monitorPort)
            break
        case "pi2":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi2.tag,pi2.parents,pi2.children,dynLinks,changes)
            break;
        case "pi3":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi3.tag,pi3.parents,pi3.children,[],changes)
            break;
        case "pi4":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi4.tag,pi4.parents,pi4.children,[],changes)
            break;
        case "pi5":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi5.tag,pi5.parents,pi5.children,[],changes)
            break;
        case "pi6":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi6.tag,pi6.parents,pi6.children,[],changes)
            break;
        case "pi7":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi7.tag,pi7.parents,pi7.children,[],changes)
            break;
        case "pi8":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi8.tag,pi8.parents,pi8.children,[],changes)
            break;
        case "pi9":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi9.tag,pi9.parents,pi9.children,[],changes)
            break;
        case "pi10":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi10.tag,pi10.parents,pi10.children,[],changes)
            break;
        case "pi11":
            new SourceService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi11.tag,pi11.parents,pi11.children,[],changes)
            break;
        case "pi12":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi12.tag,pi12.parents,pi12.children, changes)
            break;
        case "pi13":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi13.tag,pi13.parents,pi13.children, changes)
            break;
        case "pi14":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi14.tag,pi14.parents,pi14.children, changes)
            break;
        case "pi15":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi15.tag,pi15.parents,pi15.children, changes)
            break;
        case "pi16":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi16.tag,pi16.parents,pi16.children, changes)
            break;
        case "pi17":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi17.tag,pi17.parents,pi17.children, changes)
            break;
        case "pi18":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi18.tag,pi18.parents,pi18.children, changes)
            break;
        case "pi19":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi19.tag,pi19.parents,pi19.children, changes)
            break;
        case "pi20":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi20.tag,pi20.parents,pi20.children, changes)
            break;
        case "pi21":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi21.tag,pi21.parents,pi21.children, changes)
            break;
        case "pi22":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi22.tag,pi22.parents,pi22.children, changes)
            break;
        case "pi23":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi23.tag,pi23.parents,pi23.children, changes)
            break;
        case "pi24":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi24.tag,pi24.parents,pi24.children, changes)
            break;
        case "pi25":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi25.tag,pi25.parents,pi25.children, changes)
            break;
        case "pi26":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi26.tag,pi26.parents,pi26.children, changes)
            break;
        case "pi27":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi27.tag,pi27.parents,pi27.children, changes)
            break;
        case "pi28":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi28.tag,pi28.parents,pi28.children, changes)
            break;
        case "pi29":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi29.tag,pi29.parents,pi29.children, changes)
            break;
        case "pi30":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi30.tag,pi30.parents,pi30.children, changes)
            break;
        case "pi31":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi31.tag,pi31.parents,pi31.children, changes)
            break;
        case "pi32":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi32.tag,pi32.parents,pi32.children, changes)
            break;
        case "pi33":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi33.tag,pi33.parents,pi33.children, changes)
            break;
        case "pi34":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi34.tag,pi34.parents,pi34.children, changes)
            break;
        case "pi35":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi35.tag,pi35.parents,pi35.children, changes)
            break;
        case "pi36":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi36.tag,pi36.parents,pi36.children, changes)
            break;
        case "pi37":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi37.tag,pi37.parents,pi37.children, changes)
            break;
        case "pi38":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi38.tag,pi38.parents,pi38.children, changes)
            break;
        case "pi39":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi39.tag,pi39.parents,pi39.children, changes)
            break;
        case "pi40":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi40.tag,pi40.parents,pi40.children, changes)
            break;
        case "pi41":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi41.tag,pi41.parents,pi41.children, changes)
            break;
        case "pi42":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi42.tag,pi42.parents,pi42.children, changes)
            break;
        case "pi43":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi43.tag,pi43.parents,pi43.children, changes)
            break;
        case "pi44":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi44.tag,pi44.parents,pi44.children, changes)
            break;
        case "pi45":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi45.tag,pi45.parents,pi45.children, changes)
            break;
        case "pi46":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi46.tag,pi46.parents,pi46.children, changes)
            break;
        case "pi47":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi47.tag,pi47.parents,pi47.children, changes)
            break;
        case "pi48":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi48.tag,pi48.parents,pi48.children, changes)
            break;
        case "pi49":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi49.tag,pi49.parents,pi49.children, changes)
            break;
        case "pi50":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi50.tag,pi50.parents,pi50.children, changes)
            break;
        case "pi51":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi51.tag,pi51.parents,pi51.children, changes)
            break;
        case "pi52":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi52.tag,pi52.parents,pi52.children, changes)
            break;
        case "pi53":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi53.tag,pi53.parents,pi53.children, changes)
            break;
        case "pi54":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi54.tag,pi54.parents,pi54.children, changes)
            break;
        case "pi55":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi55.tag,pi55.parents,pi55.children, changes)
            break;
        case "pi56":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi56.tag,pi56.parents,pi56.children, changes)
            break;
        case "pi57":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi57.tag,pi57.parents,pi57.children, changes)
            break;
        case "pi58":
            new DerivedService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi58.tag,pi58.parents,pi58.children, changes)
            break;
        case "pi59":
            new SinkService(isQPROP,dataRate,totalVals,csvFile,ownIp,ownPort,monitorIP,monitorPort,pi59.tag,pi59.parents,pi59.children,10,changes,master)
            break;
        default:
            throw new Error("unknown spawning argument: " + toSpawn)
    }
}


