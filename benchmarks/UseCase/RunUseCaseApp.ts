import {
    configTag,
    dashTag,
    dataTag,
    drivingTag,
    geoTag,
    okTag, QPROPConfigServiceApp, QPROPDashboardServiceApp,
    QPROPDataAccessServiceApp, QPROPDrivingServiceApp, QPROPGeoServiceApp,
    UseCaseApp
} from "./UseCaseApp";

let toSpawn     = process.argv[2]
let rate        = 300
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
