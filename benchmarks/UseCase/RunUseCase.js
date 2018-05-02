Object.defineProperty(exports, "__esModule", { value: true });
const UseCase_1 = require("./UseCase");
function runQPROPLoop(rate) {
    let totalValues = rate * 30;
    let loop = (index) => {
        let app = new UseCase_1.UseCaseApp();
        let tags = UseCase_1.getTags(app);
        app.spawnActor(UseCase_1.QPROPConfigService, [rate, totalValues, "qprop", tags.configTag, [], [tags.dashTag]]);
        app.spawnActor(UseCase_1.QPROPDataAccessService, [rate, totalValues, "qprop", tags.dataTag, [], [tags.geoTag, tags.drivingTag]]);
        app.spawnActor(UseCase_1.QPROPGeoService, [rate, totalValues, "qprop", tags.geoTag, [tags.dataTag], [tags.drivingTag, tags.dashTag]]);
        app.spawnActor(UseCase_1.QPROPDrivingService, [rate, totalValues, "qprop", tags.drivingTag, [tags.dataTag, tags.geoTag], [tags.dashTag]]);
        app.spawnActor(UseCase_1.QPROPDashboardService, [rate, totalValues, "qprop", app, tags.dashTag, [tags.drivingTag, tags.geoTag, tags.configTag], []]);
        if (index > 0) {
            return app.onComplete().then(() => {
                return new Promise((resolve) => {
                    console.log("Finished QPROP " + rate + " iteration " + index);
                    setTimeout(() => {
                        resolve(loop(index - 1));
                    }, 2000);
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
        app.spawnActor(UseCase_1.SIDUPConfigService, [rate, totalValues, "sidup", tags.configTag, tags.admitterTag, []]);
        app.spawnActor(UseCase_1.SIDUPDataAccessService, [rate, totalValues, "sidup", tags.dataTag, tags.admitterTag, []]);
        app.spawnActor(UseCase_1.SIDUPGeoService, [rate, totalValues, "sidup", tags.geoTag, tags.admitterTag, [tags.dataTag]]);
        app.spawnActor(UseCase_1.SIDUPDrivingService, [rate, totalValues, "sidup", tags.drivingTag, tags.admitterTag, [tags.dataTag, tags.geoTag]]);
        app.spawnActor(UseCase_1.SIDUPDashboardService, [rate, totalValues, "sidup", app, tags.dashTag, tags.admitterTag, [tags.drivingTag, tags.geoTag, tags.configTag], true]);
        if (index > 0) {
            return app.onComplete().then(() => {
                return new Promise((resolve) => {
                    console.log("Finished SIDUP " + rate + " iteration " + index);
                    setTimeout(() => {
                        resolve(loop(index - 1));
                    }, 2000);
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
//runLoops(runQPROPLoop,[2,50,100,150,200,250,300])
/*runLoops(runQPROPLoop,[2,50,100,150,200,250,300]).then(()=>{
    runLoops(runSIDUPLoop,[2,50,100,150,200,250,300]).then(()=>{
        console.log("ALL BENCHMARKS FINISHED")
    })
})*/
runQPROPLoop(100);
//# sourceMappingURL=RunUseCase.js.map