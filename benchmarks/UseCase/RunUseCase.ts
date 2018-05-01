import {UseCaseApp,UseCaseTags,getTags,QPROPConfigService,QPROPDataAccessService,QPROPGeoService,QPROPDrivingService,QPROPDashboardService} from "./UseCase"
/*
import {ServiceMonitor} from "../../../src/MicroService/ServiceMonitor";
import {Admitter, ConfigService, DashboardService, DataAccessService, DrivingService, GeoService} from "./UseCase";
let isQPROP     = process.argv[2] == "true"
let toSpawn     = process.argv[3]
let dataRate    = parseInt(process.argv[4])
let totalVals   = dataRate * 30
let csvFile     = process.argv[5]
switch (toSpawn){
    case "admitter":
        new Admitter(totalVals,csvFile,dataRate)
        break
    case "monitor":
        new ServiceMonitor()
        break
    case "data":
        new DataAccessService(isQPROP,dataRate,totalVals,csvFile)
        break
    case "config":
        new ConfigService(isQPROP,dataRate,totalVals,csvFile)
        break
    case "driving":
        new DrivingService(isQPROP,dataRate,totalVals,csvFile)
        break
    case "geo":
        new GeoService(isQPROP,dataRate,totalVals,csvFile)
        break
    case "dash":
        new DashboardService(isQPROP,dataRate,totalVals,csvFile)
        break
    default:
        throw new Error("unknown spawning argument")
}*/

let app                 = new UseCaseApp()
let tags : UseCaseTags  = getTags(app)
let testRate            = 2
let testTV              = 60
app.spawnActor(QPROPConfigService,[testRate,testTV,"config",tags.configTag,[],[tags.dashTag]])
app.spawnActor(QPROPDataAccessService,[testRate,testTV,"data",tags.dataTag,[],[tags.geoTag,tags.drivingTag]])
app.spawnActor(QPROPGeoService,[testRate,testTV,"geo",tags.geoTag,[tags.dataTag],[tags.drivingTag,tags.dashTag]])
app.spawnActor(QPROPDrivingService,[testRate,testTV,"driving",tags.drivingTag,[tags.dataTag,tags.geoTag],[tags.dashTag]])
app.spawnActor(QPROPDashboardService,[testRate,testTV,"dash",tags.dashTag,[tags.drivingTag,tags.geoTag,tags.configTag],[]])