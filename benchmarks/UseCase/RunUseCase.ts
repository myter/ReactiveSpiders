import {
    UseCaseApp,
    QPROPConfigService,
    QPROPDataAccessService,
    QPROPGeoService,
    QPROPDrivingService,
    QPROPDashboardService,
    SIDUPConfigService,
    SIDUPDataAccessService,
    SIDUPGeoService,
    SIDUPDrivingService,
    SIDUPDashboardService,
    UseCaseAdmitter,
    QPROPConfigServiceApp,
    QPROPDataAccessServiceApp,
    QPROPGeoServiceApp,
    QPROPDrivingServiceApp,
    QPROPDashboardServiceApp, dataTag, configTag, geoTag, drivingTag, admitterTag, okTag, dashTag
} from "./UseCase"
import {Application} from "spiders.js";

function runQPROPLoop(rate) : Promise<any>{
    let totalValues = rate * 30
    let loop = (index)=>{
        let app = new UseCaseApp()
        //app.spawnActorFromFile(__dirname +"/UseCase.js","QPROPConfigService",[rate,totalValues,"qprop",configTag,okTag,[],[dashTag]])
        app.spawnActor(QPROPConfigService,[rate,totalValues,"qprop",configTag,okTag,[],[dashTag]])
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPDataAccessService",[rate,totalValues,"qprop",dataTag,okTag,[],[geoTag,drivingTag]])
        app.spawnActor(QPROPDataAccessService,[rate,totalValues,"qprop",dataTag,okTag,[],[geoTag,drivingTag]])
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPGeoService",[rate,totalValues,"qprop",geoTag,[dataTag],[drivingTag,dashTag]])
        app.spawnActor(QPROPGeoService,[rate,totalValues,"qprop",geoTag,[dataTag],[drivingTag,dashTag]])
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPDrivingService",[rate,totalValues,"qprop",drivingTag,[dataTag,geoTag],[dashTag]])
        app.spawnActor(QPROPDrivingService,[rate,totalValues,"qprop",drivingTag,[dataTag,geoTag],[dashTag]])
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPDashboardService",[rate,totalValues,"qprop",app,dashTag,okTag,[drivingTag,geoTag,configTag],[]])
        app.spawnActor(QPROPDashboardService,[rate,totalValues,"qprop",app,dashTag,okTag,[drivingTag,geoTag,configTag],[]])
        if(index > 0){
            return app.onComplete().then(()=>{
                return new Promise((resolve)=>{
                    console.log("Finished QPROP " + rate + " iteration " + index)
                    setTimeout(()=>{
                        resolve(loop(index -1))
                    },10000)
                })
            })
        }
        else{
            app.kill()
        }
    }
    return loop(2)
}
//runQPROPLoop(2)

/*function runSIDUPLoop(rate){
    let totalValues = rate * 30
    let loop = (index)=>{
        let app = new UseCaseApp()
        let tags : UseCaseTags  = getTags(app)
        app.spawnActor(UseCaseAdmitter,[admitterTag,totalValues,"sidup",rate])
        app.spawnActor(SIDUPConfigService,[rate,totalValues,"sidup",configTag,okTag,admitterTag,[]])
        app.spawnActor(SIDUPDataAccessService,[rate,totalValues,"sidup",dataTag,okTag,admitterTag,[]])
        app.spawnActor(SIDUPGeoService,[rate,totalValues,"sidup",geoTag,admitterTag,[dataTag]])
        app.spawnActor(SIDUPDrivingService,[rate,totalValues,"sidup",drivingTag,admitterTag,[dataTag,geoTag]])
        app.spawnActor(SIDUPDashboardService,[rate,totalValues,"sidup",app,dashTag,okTag,admitterTag,[drivingTag,geoTag,configTag],true])
        if(index > 0){
            return app.onComplete().then(()=>{
                return new Promise((resolve)=>{
                    console.log("Finished SIDUP " + rate + " iteration " + index)
                    setTimeout(()=>{
                        resolve(loop(index -1))
                    },5000)
                })
            })
        }
        else{
            app.kill()
        }
    }
    return loop(10)
}*/
function runLoops(loopRunner : Function,rates : Array<number>){
    let loop = (index)=>{
        if(index < rates.length){
            return loopRunner(rates[index]).then(()=>{
                return loop(index +1)
            })
        }
    }
    return loop(0)
}
/*runLoops(runQPROPLoop,[2,50,100,150,200,250,300]).then(()=>{
    runLoops(runSIDUPLoop,[2,50,100,150,200,250,300]).then(()=>{
        console.log("ALL BENCHMARKS FINISHED")
    })
})*/

let toSpawn     = process.argv[2]
let rate        = 200
let totalValues = rate * 30
switch (toSpawn){
    case "app":
        new UseCaseApp()
        break
    case "data":
        new QPROPDataAccessServiceApp(rate,totalValues,"qprop",dataTag,okTag,[],[geoTag,drivingTag],"127.0.0.1",8002)
        break
    case "config":
        new QPROPConfigServiceApp(rate,totalValues,"qprop",configTag,okTag,[],[dashTag],"127.0.0.1",8001)
        break
    case "driving":
        new QPROPDrivingServiceApp(rate,totalValues,"qprop",drivingTag,[dataTag,geoTag],[dashTag],"127.0.0.1",8010)
        break
    case "geo":
        new QPROPGeoServiceApp(rate,totalValues,"qprop",geoTag,[dataTag],[drivingTag,dashTag],"127.0.0.1",8003)
        break
    case "dash":
        new QPROPDashboardServiceApp(rate,totalValues,"qprop",dashTag,okTag,[drivingTag,geoTag,configTag],[],"127.0.0.1",8011)
        break
    default:
        throw new Error("unknown spawning argument")
}


