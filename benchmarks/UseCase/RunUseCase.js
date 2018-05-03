Object.defineProperty(exports, "__esModule", { value: true });
const UseCase_1 = require("./UseCase");
const spiders_js_1 = require("spiders.js");
function runQPROPLoop(rate) {
    let totalValues = rate * 30;
    let loop = (index) => {
        let app = new UseCase_1.UseCaseApp();
        let tags = UseCase_1.getTags(app);
        app.spawnActorFromFile(__dirname + "/UseCase.js", "QPROPConfigService", [rate, totalValues, "qprop", tags.configTag, tags.okTag, [], [tags.dashTag]]);
        //app.spawnActor(QPROPConfigService,[rate,totalValues,"qprop",tags.configTag,tags.okTag,[],[tags.dashTag]])
        app.spawnActorFromFile(__dirname + "/UseCase", "QPROPDataAccessService", [rate, totalValues, "qprop", tags.dataTag, tags.okTag, [], [tags.geoTag, tags.drivingTag]]);
        //app.spawnActor(QPROPDataAccessService,[rate,totalValues,"qprop",tags.dataTag,tags.okTag,[],[tags.geoTag,tags.drivingTag]])
        app.spawnActorFromFile(__dirname + "/UseCase", "QPROPGeoService", [rate, totalValues, "qprop", tags.geoTag, [tags.dataTag], [tags.drivingTag, tags.dashTag]]);
        //app.spawnActor(QPROPGeoService,[rate,totalValues,"qprop",tags.geoTag,[tags.dataTag],[tags.drivingTag,tags.dashTag]])
        app.spawnActorFromFile(__dirname + "/UseCase", "QPROPDrivingService", [rate, totalValues, "qprop", tags.drivingTag, [tags.dataTag, tags.geoTag], [tags.dashTag]]);
        //app.spawnActor(QPROPDrivingService,[rate,totalValues,"qprop",tags.drivingTag,[tags.dataTag,tags.geoTag],[tags.dashTag]])
        app.spawnActorFromFile(__dirname + "/UseCase", "QPROPDashboardService", [rate, totalValues, "qprop", app, tags.dashTag, tags.okTag, [tags.drivingTag, tags.geoTag, tags.configTag], []]);
        //app.spawnActor(QPROPDashboardService,[rate,totalValues,"qprop",app,tags.dashTag,tags.okTag,[tags.drivingTag,tags.geoTag,tags.configTag],[]])
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
    return loop(10);
}
function runSIDUPLoop(rate) {
    let totalValues = rate * 30;
    let loop = (index) => {
        let app = new UseCase_1.UseCaseApp();
        let tags = UseCase_1.getTags(app);
        app.spawnActor(UseCase_1.UseCaseAdmitter, [tags.admitterTag, totalValues, "sidup", rate]);
        app.spawnActor(UseCase_1.SIDUPConfigService, [rate, totalValues, "sidup", tags.configTag, tags.okTag, tags.admitterTag, []]);
        app.spawnActor(UseCase_1.SIDUPDataAccessService, [rate, totalValues, "sidup", tags.dataTag, tags.okTag, tags.admitterTag, []]);
        app.spawnActor(UseCase_1.SIDUPGeoService, [rate, totalValues, "sidup", tags.geoTag, tags.admitterTag, [tags.dataTag]]);
        app.spawnActor(UseCase_1.SIDUPDrivingService, [rate, totalValues, "sidup", tags.drivingTag, tags.admitterTag, [tags.dataTag, tags.geoTag]]);
        app.spawnActor(UseCase_1.SIDUPDashboardService, [rate, totalValues, "sidup", app, tags.dashTag, tags.okTag, tags.admitterTag, [tags.drivingTag, tags.geoTag, tags.configTag], true]);
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
    return loop(10);
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
let temp = new spiders_js_1.Application();
let tags = UseCase_1.getTags(temp);
temp.kill();
temp = null;
let toSpawn = process.argv[2];
let rate = 200;
let totalValues = rate * 30;
switch (toSpawn) {
    case "app":
        new UseCase_1.UseCaseApp();
        break;
    case "data":
        new UseCase_1.QPROPDataAccessServiceApp(rate, totalValues, "qprop", tags.dataTag, tags.okTag, [], [tags.geoTag, tags.drivingTag], "127.0.0.1", 8002);
        break;
    case "config":
        new UseCase_1.QPROPConfigServiceApp(rate, totalValues, "qprop", tags.configTag, tags.okTag, [], [tags.dashTag], "127.0.0.1", 8001);
        break;
    case "driving":
        new UseCase_1.QPROPDrivingServiceApp(rate, totalValues, "qprop", tags.drivingTag, [tags.dataTag, tags.geoTag], [tags.dashTag], "127.0.0.1", 8010);
        break;
    case "geo":
        new UseCase_1.QPROPGeoServiceApp(rate, totalValues, "qprop", tags.geoTag, [tags.dataTag], [tags.drivingTag, tags.dashTag], "127.0.0.1", 8003);
        break;
    case "dash":
        new UseCase_1.QPROPDashboardServiceApp(rate, totalValues, "qprop", tags.dashTag, tags.okTag, [tags.drivingTag, tags.geoTag, tags.configTag], [], "127.0.0.1", 8011);
        break;
    default:
        throw new Error("unknown spawning argument");
}
//# sourceMappingURL=RunUseCase.js.map