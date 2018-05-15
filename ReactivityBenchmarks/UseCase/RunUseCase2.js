Object.defineProperty(exports, "__esModule", { value: true });
const ServiceMonitor_1 = require("../../src/MicroService/ServiceMonitor");
const UseCase2_1 = require("./UseCase2");
let isQPROP = process.argv[2] == "true";
let toSpawn = process.argv[3];
let dataRate = parseInt(process.argv[4]);
let totalVals = dataRate * 30;
let csvFile = process.argv[5];
switch (toSpawn) {
    case "admitter":
        new UseCase2_1.Admitter(totalVals, csvFile, dataRate);
        break;
    case "monitor":
        new ServiceMonitor_1.ServiceMonitor();
        break;
    case "data":
        new UseCase2_1.DataAccessService(isQPROP, dataRate, totalVals, csvFile);
        break;
    case "config":
        new UseCase2_1.ConfigService(isQPROP, dataRate, totalVals, csvFile);
        break;
    case "driving":
        new UseCase2_1.DrivingService(isQPROP, dataRate, totalVals, csvFile);
        break;
    case "geo":
        new UseCase2_1.GeoService(isQPROP, dataRate, totalVals, csvFile);
        break;
    case "dash":
        new UseCase2_1.DashboardService(isQPROP, dataRate, totalVals, csvFile);
        break;
    default:
        throw new Error("unknown spawning argument");
}
//# sourceMappingURL=RunUseCase2.js.map