Object.defineProperty(exports, "__esModule", { value: true });
const UseCaseApp_1 = require("./UseCaseApp");
let toSpawn = process.argv[2];
let rate = 300;
let totalValues = rate * 30;
switch (toSpawn) {
    case "app":
        new UseCaseApp_1.UseCaseApp();
        break;
    case "data":
        new UseCaseApp_1.QPROPDataAccessServiceApp(rate, totalValues, "qprop", UseCaseApp_1.dataTag, UseCaseApp_1.okTag, [], [UseCaseApp_1.geoTag, UseCaseApp_1.drivingTag], "127.0.0.1", 8002);
        break;
    case "config":
        new UseCaseApp_1.QPROPConfigServiceApp(rate, totalValues, "qprop", UseCaseApp_1.configTag, UseCaseApp_1.okTag, [], [UseCaseApp_1.dashTag], "127.0.0.1", 8001);
        break;
    case "driving":
        new UseCaseApp_1.QPROPDrivingServiceApp(rate, totalValues, "qprop", UseCaseApp_1.drivingTag, [UseCaseApp_1.dataTag, UseCaseApp_1.geoTag], [UseCaseApp_1.dashTag], "127.0.0.1", 8010);
        break;
    case "geo":
        new UseCaseApp_1.QPROPGeoServiceApp(rate, totalValues, "qprop", UseCaseApp_1.geoTag, [UseCaseApp_1.dataTag], [UseCaseApp_1.drivingTag, UseCaseApp_1.dashTag], "127.0.0.1", 8003);
        break;
    case "dash":
        new UseCaseApp_1.QPROPDashboardServiceApp(rate, totalValues, "qprop", UseCaseApp_1.dashTag, UseCaseApp_1.okTag, [UseCaseApp_1.drivingTag, UseCaseApp_1.geoTag, UseCaseApp_1.configTag], [], "127.0.0.1", 8011);
        break;
    default:
        throw new Error("unknown spawning argument");
}
//# sourceMappingURL=RunUseCaseApp.js.map