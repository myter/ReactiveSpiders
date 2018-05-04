Object.defineProperty(exports, "__esModule", { value: true });
const UseCase_1 = require("./UseCase");
function runQPROPLoop(rate) {
    let totalValues = rate * 30;
    let loop = (index) => {
        let app = new UseCase_1.UseCaseApp();
        //app.spawnActorFromFile(__dirname +"/UseCase.js","QPROPConfigService",[rate,totalValues,"qprop",configTag,okTag,[],[dashTag]])
        app.spawnActor(UseCase_1.QPROPConfigService, [rate, totalValues, "qprop", UseCase_1.configTag, UseCase_1.okTag, [], [UseCase_1.dashTag]]);
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPDataAccessService",[rate,totalValues,"qprop",dataTag,okTag,[],[geoTag,drivingTag]])
        app.spawnActor(UseCase_1.QPROPDataAccessService, [rate, totalValues, "qprop", UseCase_1.dataTag, UseCase_1.okTag, [], [UseCase_1.geoTag, UseCase_1.drivingTag]]);
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPGeoService",[rate,totalValues,"qprop",geoTag,[dataTag],[drivingTag,dashTag]])
        app.spawnActor(UseCase_1.QPROPGeoService, [rate, totalValues, "qprop", UseCase_1.geoTag, [UseCase_1.dataTag], [UseCase_1.drivingTag, UseCase_1.dashTag]]);
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPDrivingService",[rate,totalValues,"qprop",drivingTag,[dataTag,geoTag],[dashTag]])
        app.spawnActor(UseCase_1.QPROPDrivingService, [rate, totalValues, "qprop", UseCase_1.drivingTag, [UseCase_1.dataTag, UseCase_1.geoTag], [UseCase_1.dashTag]]);
        //app.spawnActorFromFile(__dirname+"/UseCase","QPROPDashboardService",[rate,totalValues,"qprop",app,dashTag,okTag,[drivingTag,geoTag,configTag],[]])
        app.spawnActor(UseCase_1.QPROPDashboardService, [rate, totalValues, "qprop", app, UseCase_1.dashTag, UseCase_1.okTag, [UseCase_1.drivingTag, UseCase_1.geoTag, UseCase_1.configTag], []]);
        if (index > 0) {
            return app.onComplete().then(() => {
                return new Promise((resolve) => {
                    console.log("Finished QPROP " + rate + " iteration " + index);
                    setTimeout(() => {
                        resolve(loop(index - 1));
                    }, 10000);
                });
            });
        }
        else {
            app.kill();
        }
    };
    return loop(2);
}
//runQPROPLoop(2)
function runSIDUPLoop(rate) {
    let totalValues = rate * 30;
    let loop = (index) => {
        let app = new UseCase_1.UseCaseApp();
        app.spawnActor(UseCase_1.UseCaseAdmitter, [UseCase_1.admitterTag, totalValues, "sidup", rate]);
        app.spawnActor(UseCase_1.SIDUPConfigService, [rate, totalValues, "sidup", UseCase_1.configTag, UseCase_1.okTag, UseCase_1.admitterTag, []]);
        app.spawnActor(UseCase_1.SIDUPDataAccessService, [rate, totalValues, "sidup", UseCase_1.dataTag, UseCase_1.okTag, UseCase_1.admitterTag, []]);
        app.spawnActor(UseCase_1.SIDUPGeoService, [rate, totalValues, "sidup", UseCase_1.geoTag, UseCase_1.admitterTag, [UseCase_1.dataTag]]);
        app.spawnActor(UseCase_1.SIDUPDrivingService, [rate, totalValues, "sidup", UseCase_1.drivingTag, UseCase_1.admitterTag, [UseCase_1.dataTag, UseCase_1.geoTag]]);
        app.spawnActor(UseCase_1.SIDUPDashboardService, [rate, totalValues, "sidup", app, UseCase_1.dashTag, UseCase_1.okTag, UseCase_1.admitterTag, [UseCase_1.drivingTag, UseCase_1.geoTag, UseCase_1.configTag], true]);
        if (index > 0) {
            return app.onComplete().then(() => {
                return new Promise((resolve) => {
                    console.log("Finished SIDUP " + rate + " iteration " + index);
                    setTimeout(() => {
                        resolve(loop(index - 1));
                    }, 5000);
                });
            });
        }
        else {
            app.kill();
        }
    };
    return loop(2);
}
function runLoops(loopRunner, rates) {
    let loop = (index) => {
        if (index < rates.length) {
            return loopRunner(rates[index]).then(() => {
                return loop(index + 1);
            });
        }
    };
    return loop(0);
}
/*runLoops(runQPROPLoop,[2,50,100,150,200,250,300]).then(()=>{
    runLoops(runSIDUPLoop,[2,50,100,150,200,250,300]).then(()=>{
        console.log("ALL BENCHMARKS FINISHED")
    })
})*/
/*runQPROPLoop(100).then(()=>{
    runSIDUPLoop(100)
})*/
//runQPROPLoop(100)
let toSpawn = process.argv[2];
let rate = 200;
let totalValues = rate * 30;
switch (toSpawn) {
    case "app":
        new UseCase_1.UseCaseApp();
        break;
    case "data":
        new UseCase_1.QPROPDataAccessServiceApp(rate, totalValues, "qprop", UseCase_1.dataTag, UseCase_1.okTag, [], [UseCase_1.geoTag, UseCase_1.drivingTag], "127.0.0.1", 8002);
        break;
    case "config":
        new UseCase_1.QPROPConfigServiceApp(rate, totalValues, "qprop", UseCase_1.configTag, UseCase_1.okTag, [], [UseCase_1.dashTag], "127.0.0.1", 8001);
        break;
    case "driving":
        new UseCase_1.QPROPDrivingServiceApp(rate, totalValues, "qprop", UseCase_1.drivingTag, [UseCase_1.dataTag, UseCase_1.geoTag], [UseCase_1.dashTag], "127.0.0.1", 8010);
        break;
    case "geo":
        new UseCase_1.QPROPGeoServiceApp(rate, totalValues, "qprop", UseCase_1.geoTag, [UseCase_1.dataTag], [UseCase_1.drivingTag, UseCase_1.dashTag], "127.0.0.1", 8003);
        break;
    case "dash":
        new UseCase_1.QPROPDashboardServiceApp(rate, totalValues, "qprop", UseCase_1.dashTag, UseCase_1.okTag, [UseCase_1.drivingTag, UseCase_1.geoTag, UseCase_1.configTag], [], "127.0.0.1", 8011);
        break;
    default:
        throw new Error("unknown spawning argument");
}
//# sourceMappingURL=RunUseCase.js.map