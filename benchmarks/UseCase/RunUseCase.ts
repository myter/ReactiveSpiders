import {UseCaseApp,UseCaseTags,getTags,QPROPConfigService,QPROPDataAccessService,QPROPGeoService,QPROPDrivingService,QPROPDashboardService,SIDUPConfigService,SIDUPDataAccessService,SIDUPGeoService,SIDUPDrivingService,SIDUPDashboardService,UseCaseAdmitter} from "./UseCase"

function runQPROPLoop(rate) : Promise<any>{
    let totalValues = rate * 30
    let loop = (index)=>{
        let app = new UseCaseApp()
        let tags : UseCaseTags  = getTags(app)
        app.spawnActor(QPROPConfigService,[rate,totalValues,"qprop",tags.configTag,[],[tags.dashTag]])
        app.spawnActor(QPROPDataAccessService,[rate,totalValues,"qprop",tags.dataTag,[],[tags.geoTag,tags.drivingTag]])
        app.spawnActor(QPROPGeoService,[rate,totalValues,"qprop",tags.geoTag,[tags.dataTag],[tags.drivingTag,tags.dashTag]])
        app.spawnActor(QPROPDrivingService,[rate,totalValues,"qprop",tags.drivingTag,[tags.dataTag,tags.geoTag],[tags.dashTag]])
        app.spawnActor(QPROPDashboardService,[rate,totalValues,"qprop",app,tags.dashTag,[tags.drivingTag,tags.geoTag,tags.configTag],[]])
        if(index > 0){
            return app.onComplete().then(()=>{
                return new Promise((resolve)=>{
                    console.log("Finished QPROP " + rate + " iteration " + index)
                    setTimeout(()=>{
                        resolve(loop(index -1))
                    },2000)
                })
            })
        }
        else{
            app.kill()
        }
    }
    return loop(10)
}

function runSIDUPLoop(rate){
    let totalValues = rate * 30
    let loop = (index)=>{
        let app = new UseCaseApp()
        let tags : UseCaseTags  = getTags(app)
        app.spawnActor(UseCaseAdmitter,[tags.admitterTag,totalValues,"sidup",rate])
        app.spawnActor(SIDUPConfigService,[rate,totalValues,"sidup",tags.configTag,tags.admitterTag,[]])
        app.spawnActor(SIDUPDataAccessService,[rate,totalValues,"sidup",tags.dataTag,tags.admitterTag,[]])
        app.spawnActor(SIDUPGeoService,[rate,totalValues,"sidup",tags.geoTag,tags.admitterTag,[tags.dataTag]])
        app.spawnActor(SIDUPDrivingService,[rate,totalValues,"sidup",tags.drivingTag,tags.admitterTag,[tags.dataTag,tags.geoTag]])
        app.spawnActor(SIDUPDashboardService,[rate,totalValues,"sidup",app,tags.dashTag,tags.admitterTag,[tags.drivingTag,tags.geoTag,tags.configTag],true])
        if(index > 0){
            return app.onComplete().then(()=>{
                return new Promise((resolve)=>{
                    console.log("Finished SIDUP " + rate + " iteration " + index)
                    setTimeout(()=>{
                        resolve(loop(index -1))
                    },2000)
                })
            })
        }
        else{
            app.kill()
        }
    }
    return loop(10)
}
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
//runLoops(runQPROPLoop,[2,50,100,150,200,250,300])
/*runLoops(runQPROPLoop,[2,50,100,150,200,250,300]).then(()=>{
    runLoops(runSIDUPLoop,[2,50,100,150,200,250,300]).then(()=>{
        console.log("ALL BENCHMARKS FINISHED")
    })
})*/

runQPROPLoop(100)


