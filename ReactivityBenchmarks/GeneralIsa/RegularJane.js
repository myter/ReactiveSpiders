Object.defineProperty(exports, "__esModule", { value: true });
const ServicesJane_1 = require("./ServicesJane");
const ServiceMonitor_1 = require("../../src/MicroService/ServiceMonitor");
exports.pi2 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi2Tag, [], [ServicesJane_1.pi12Tag, ServicesJane_1.pi13Tag]);
exports.pi3 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi3Tag, [], [ServicesJane_1.pi14Tag, ServicesJane_1.pi15Tag]);
exports.pi4 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi4Tag, [], [ServicesJane_1.pi12Tag]);
exports.pi5 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi5Tag, [], [ServicesJane_1.pi14Tag]);
exports.pi6 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi6Tag, [], [ServicesJane_1.pi30Tag]);
exports.pi7 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi7Tag, [], [ServicesJane_1.pi19Tag, ServicesJane_1.pi20Tag]);
exports.pi8 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi8Tag, [], [ServicesJane_1.pi16Tag]);
exports.pi9 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi9Tag, [], [ServicesJane_1.pi20Tag]);
exports.pi10 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi10Tag, [], [ServicesJane_1.pi17Tag]);
exports.pi11 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi11Tag, [], [ServicesJane_1.pi18Tag]);
exports.pi12 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi12Tag, [ServicesJane_1.pi2Tag, ServicesJane_1.pi4Tag], [ServicesJane_1.pi21Tag, ServicesJane_1.pi22Tag]);
exports.pi13 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi13Tag, [ServicesJane_1.pi2Tag], [ServicesJane_1.pi22Tag]);
exports.pi14 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi14Tag, [ServicesJane_1.pi3Tag, ServicesJane_1.pi5Tag], [ServicesJane_1.pi23Tag, ServicesJane_1.pi24Tag]);
exports.pi15 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi15Tag, [ServicesJane_1.pi3Tag], [ServicesJane_1.pi23Tag, ServicesJane_1.pi24Tag]);
exports.pi16 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi16Tag, [ServicesJane_1.pi8Tag], [ServicesJane_1.pi25Tag, ServicesJane_1.pi26Tag]);
exports.pi17 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi17Tag, [ServicesJane_1.pi10Tag], [ServicesJane_1.pi26Tag]);
exports.pi18 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi18Tag, [ServicesJane_1.pi11Tag], [ServicesJane_1.pi27Tag]);
exports.pi19 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi19Tag, [ServicesJane_1.pi7Tag], [ServicesJane_1.pi28Tag, ServicesJane_1.pi29Tag]);
exports.pi20 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi20Tag, [ServicesJane_1.pi7Tag, ServicesJane_1.pi9Tag], [ServicesJane_1.pi29Tag]);
exports.pi21 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi21Tag, [ServicesJane_1.pi12Tag], [ServicesJane_1.pi31Tag]);
exports.pi22 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi22Tag, [ServicesJane_1.pi12Tag, ServicesJane_1.pi13Tag], [ServicesJane_1.pi32Tag]);
exports.pi23 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi23Tag, [ServicesJane_1.pi14Tag, ServicesJane_1.pi15Tag], [ServicesJane_1.pi33Tag]);
exports.pi24 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi24Tag, [ServicesJane_1.pi14Tag, ServicesJane_1.pi15Tag], [ServicesJane_1.pi33Tag]);
exports.pi25 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi25Tag, [ServicesJane_1.pi16Tag], [ServicesJane_1.pi34Tag]);
exports.pi26 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi26Tag, [ServicesJane_1.pi16Tag, ServicesJane_1.pi17Tag], [ServicesJane_1.pi35Tag]);
exports.pi27 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi27Tag, [ServicesJane_1.pi18Tag], [ServicesJane_1.pi36Tag]);
exports.pi28 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi28Tag, [ServicesJane_1.pi19Tag], [ServicesJane_1.pi37Tag]);
exports.pi29 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi29Tag, [ServicesJane_1.pi19Tag, ServicesJane_1.pi20Tag], [ServicesJane_1.pi38Tag]);
exports.pi30 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi30Tag, [ServicesJane_1.pi6Tag], [ServicesJane_1.pi39Tag, ServicesJane_1.pi40Tag]);
exports.pi31 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi31Tag, [ServicesJane_1.pi21Tag], [ServicesJane_1.pi39Tag]);
exports.pi32 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi32Tag, [ServicesJane_1.pi22Tag], [ServicesJane_1.pi41Tag]);
exports.pi33 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi33Tag, [ServicesJane_1.pi23Tag, ServicesJane_1.pi24Tag], [ServicesJane_1.pi42Tag]);
exports.pi34 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi34Tag, [ServicesJane_1.pi25Tag], [ServicesJane_1.pi43Tag]);
exports.pi35 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi35Tag, [ServicesJane_1.pi26Tag], [ServicesJane_1.pi44Tag]);
exports.pi36 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi36Tag, [ServicesJane_1.pi27Tag], [ServicesJane_1.pi45Tag]);
exports.pi37 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi37Tag, [ServicesJane_1.pi28Tag], [ServicesJane_1.pi46Tag]);
exports.pi38 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi38Tag, [ServicesJane_1.pi29Tag], [ServicesJane_1.pi47Tag]);
exports.pi39 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi39Tag, [ServicesJane_1.pi30Tag, ServicesJane_1.pi31Tag], [ServicesJane_1.pi48Tag]);
exports.pi40 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi40Tag, [ServicesJane_1.pi30Tag], [ServicesJane_1.pi49Tag, ServicesJane_1.pi50Tag]);
exports.pi41 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi41Tag, [ServicesJane_1.pi32Tag], [ServicesJane_1.pi50Tag]);
exports.pi42 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi42Tag, [ServicesJane_1.pi33Tag], [ServicesJane_1.pi50Tag]);
exports.pi43 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi43Tag, [ServicesJane_1.pi34Tag], [ServicesJane_1.pi51Tag]);
exports.pi44 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi44Tag, [ServicesJane_1.pi35Tag], [ServicesJane_1.pi52Tag, ServicesJane_1.pi51Tag]);
exports.pi45 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi45Tag, [ServicesJane_1.pi36Tag], [ServicesJane_1.pi53Tag]);
exports.pi46 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi46Tag, [ServicesJane_1.pi37Tag], [ServicesJane_1.pi54Tag]);
exports.pi47 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi47Tag, [ServicesJane_1.pi38Tag], [ServicesJane_1.pi54Tag, ServicesJane_1.pi55Tag]);
exports.pi48 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi48Tag, [ServicesJane_1.pi39Tag], [ServicesJane_1.pi57Tag]);
exports.pi49 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi49Tag, [ServicesJane_1.pi40Tag], [ServicesJane_1.pi57Tag]);
exports.pi50 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi50Tag, [ServicesJane_1.pi40Tag, ServicesJane_1.pi41Tag, ServicesJane_1.pi42Tag], [ServicesJane_1.pi57Tag]);
exports.pi51 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi51Tag, [ServicesJane_1.pi43Tag, ServicesJane_1.pi44Tag], [ServicesJane_1.pi56Tag]);
exports.pi52 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi52Tag, [ServicesJane_1.pi44Tag], [ServicesJane_1.pi56Tag]);
exports.pi53 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi53Tag, [ServicesJane_1.pi45Tag], [ServicesJane_1.pi58Tag]);
exports.pi54 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi54Tag, [ServicesJane_1.pi46Tag, ServicesJane_1.pi47Tag], [ServicesJane_1.pi58Tag]);
exports.pi55 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi55Tag, [ServicesJane_1.pi47Tag], [ServicesJane_1.pi58Tag]);
exports.pi56 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi56Tag, [ServicesJane_1.pi51Tag, ServicesJane_1.pi52Tag], [ServicesJane_1.pi59Tag]);
exports.pi57 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi57Tag, [ServicesJane_1.pi48Tag, ServicesJane_1.pi49Tag, ServicesJane_1.pi50Tag], [ServicesJane_1.pi59Tag]);
exports.pi58 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi58Tag, [ServicesJane_1.pi53Tag, ServicesJane_1.pi54Tag, ServicesJane_1.pi55Tag], [ServicesJane_1.pi59Tag]);
exports.pi59 = new ServicesJane_1.ServiceInfo(ServicesJane_1.pi59Tag, [ServicesJane_1.pi57Tag, ServicesJane_1.pi56Tag, ServicesJane_1.pi58Tag], []);
function spawnPi(toSpawn, isQPROP, dataRate, totalVals, csvFile, changes, ownIp, ownPort, monitorIP, monitorPort, master) {
    //Avoid introducing cycles and double dependencies
    let dynLinks = [];
    if (changes == 1) {
        dynLinks.push({ from: exports.pi6.tag, to: exports.pi31.tag });
    }
    else if (changes == 5) {
        dynLinks.push({ from: exports.pi6.tag, to: exports.pi31.tag });
        dynLinks.push({ from: exports.pi21.tag, to: exports.pi32.tag });
        dynLinks.push({ from: exports.pi39.tag, to: exports.pi49.tag });
        dynLinks.push({ from: exports.pi49.tag, to: exports.pi50.tag });
        dynLinks.push({ from: exports.pi32.tag, to: exports.pi42.tag });
    }
    else if (changes == 10) {
        dynLinks.push({ from: exports.pi6.tag, to: exports.pi31.tag });
        dynLinks.push({ from: exports.pi21.tag, to: exports.pi32.tag });
        dynLinks.push({ from: exports.pi39.tag, to: exports.pi49.tag });
        dynLinks.push({ from: exports.pi49.tag, to: exports.pi50.tag });
        dynLinks.push({ from: exports.pi32.tag, to: exports.pi42.tag });
        dynLinks.push({ from: exports.pi48.tag, to: exports.pi49.tag });
        dynLinks.push({ from: exports.pi30.tag, to: exports.pi31.tag });
        dynLinks.push({ from: exports.pi21.tag, to: exports.pi22.tag });
        dynLinks.push({ from: exports.pi31.tag, to: exports.pi41.tag });
        dynLinks.push({ from: exports.pi12.tag, to: exports.pi13.tag });
    }
    else if (changes == 15) {
        dynLinks.push({ from: exports.pi8.tag, to: exports.pi17.tag });
        dynLinks.push({ from: exports.pi16.tag, to: exports.pi17.tag });
        dynLinks.push({ from: exports.pi25.tag, to: exports.pi26.tag });
        dynLinks.push({ from: exports.pi34.tag, to: exports.pi35.tag });
        dynLinks.push({ from: exports.pi32.tag, to: exports.pi33.tag });
        dynLinks.push({ from: exports.pi6.tag, to: exports.pi31.tag });
        dynLinks.push({ from: exports.pi21.tag, to: exports.pi32.tag });
        dynLinks.push({ from: exports.pi39.tag, to: exports.pi49.tag });
        dynLinks.push({ from: exports.pi49.tag, to: exports.pi50.tag });
        dynLinks.push({ from: exports.pi32.tag, to: exports.pi42.tag });
        dynLinks.push({ from: exports.pi48.tag, to: exports.pi49.tag });
        dynLinks.push({ from: exports.pi30.tag, to: exports.pi31.tag });
        dynLinks.push({ from: exports.pi21.tag, to: exports.pi22.tag });
        dynLinks.push({ from: exports.pi31.tag, to: exports.pi41.tag });
        dynLinks.push({ from: exports.pi12.tag, to: exports.pi13.tag });
    }
    else if (changes == 20) {
        dynLinks.push({ from: exports.pi8.tag, to: exports.pi17.tag });
        dynLinks.push({ from: exports.pi16.tag, to: exports.pi17.tag });
        dynLinks.push({ from: exports.pi25.tag, to: exports.pi26.tag });
        dynLinks.push({ from: exports.pi34.tag, to: exports.pi35.tag });
        dynLinks.push({ from: exports.pi32.tag, to: exports.pi33.tag });
        dynLinks.push({ from: exports.pi6.tag, to: exports.pi31.tag });
        dynLinks.push({ from: exports.pi21.tag, to: exports.pi32.tag });
        dynLinks.push({ from: exports.pi39.tag, to: exports.pi49.tag });
        dynLinks.push({ from: exports.pi49.tag, to: exports.pi50.tag });
        dynLinks.push({ from: exports.pi32.tag, to: exports.pi42.tag });
        dynLinks.push({ from: exports.pi48.tag, to: exports.pi49.tag });
        dynLinks.push({ from: exports.pi30.tag, to: exports.pi31.tag });
        dynLinks.push({ from: exports.pi21.tag, to: exports.pi22.tag });
        dynLinks.push({ from: exports.pi31.tag, to: exports.pi41.tag });
        dynLinks.push({ from: exports.pi12.tag, to: exports.pi13.tag });
        dynLinks.push({ from: exports.pi28.tag, to: exports.pi29.tag });
        dynLinks.push({ from: exports.pi43.tag, to: exports.pi44.tag });
        dynLinks.push({ from: exports.pi28.tag, to: exports.pi33.tag });
        dynLinks.push({ from: exports.pi37.tag, to: exports.pi47.tag });
        dynLinks.push({ from: exports.pi37.tag, to: exports.pi38.tag });
    }
    switch (toSpawn) {
        case "admitter":
            new ServicesJane_1.Admitter(ownIp, ownPort, monitorIP, monitorPort, totalVals, csvFile, dataRate, 10, dynLinks, changes, master);
            break;
        case "monitor":
            new ServiceMonitor_1.ServiceMonitor(monitorIP, monitorPort);
            break;
        case "pi2":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi2.tag, exports.pi2.parents, exports.pi2.children, dynLinks, changes);
            break;
        case "pi3":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi3.tag, exports.pi3.parents, exports.pi3.children, [], changes);
            break;
        case "pi4":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi4.tag, exports.pi4.parents, exports.pi4.children, [], changes);
            break;
        case "pi5":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi5.tag, exports.pi5.parents, exports.pi5.children, [], changes);
            break;
        case "pi6":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi6.tag, exports.pi6.parents, exports.pi6.children, [], changes);
            break;
        case "pi7":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi7.tag, exports.pi7.parents, exports.pi7.children, [], changes);
            break;
        case "pi8":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi8.tag, exports.pi8.parents, exports.pi8.children, [], changes);
            break;
        case "pi9":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi9.tag, exports.pi9.parents, exports.pi9.children, [], changes);
            break;
        case "pi10":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi10.tag, exports.pi10.parents, exports.pi10.children, [], changes);
            break;
        case "pi11":
            new ServicesJane_1.SourceService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi11.tag, exports.pi11.parents, exports.pi11.children, [], changes);
            break;
        case "pi12":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi12.tag, exports.pi12.parents, exports.pi12.children, changes);
            break;
        case "pi13":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi13.tag, exports.pi13.parents, exports.pi13.children, changes);
            break;
        case "pi14":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi14.tag, exports.pi14.parents, exports.pi14.children, changes);
            break;
        case "pi15":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi15.tag, exports.pi15.parents, exports.pi15.children, changes);
            break;
        case "pi16":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi16.tag, exports.pi16.parents, exports.pi16.children, changes);
            break;
        case "pi17":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi17.tag, exports.pi17.parents, exports.pi17.children, changes);
            break;
        case "pi18":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi18.tag, exports.pi18.parents, exports.pi18.children, changes);
            break;
        case "pi19":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi19.tag, exports.pi19.parents, exports.pi19.children, changes);
            break;
        case "pi20":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi20.tag, exports.pi20.parents, exports.pi20.children, changes);
            break;
        case "pi21":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi21.tag, exports.pi21.parents, exports.pi21.children, changes);
            break;
        case "pi22":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi22.tag, exports.pi22.parents, exports.pi22.children, changes);
            break;
        case "pi23":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi23.tag, exports.pi23.parents, exports.pi23.children, changes);
            break;
        case "pi24":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi24.tag, exports.pi24.parents, exports.pi24.children, changes);
            break;
        case "pi25":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi25.tag, exports.pi25.parents, exports.pi25.children, changes);
            break;
        case "pi26":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi26.tag, exports.pi26.parents, exports.pi26.children, changes);
            break;
        case "pi27":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi27.tag, exports.pi27.parents, exports.pi27.children, changes);
            break;
        case "pi28":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi28.tag, exports.pi28.parents, exports.pi28.children, changes);
            break;
        case "pi29":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi29.tag, exports.pi29.parents, exports.pi29.children, changes);
            break;
        case "pi30":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi30.tag, exports.pi30.parents, exports.pi30.children, changes);
            break;
        case "pi31":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi31.tag, exports.pi31.parents, exports.pi31.children, changes);
            break;
        case "pi32":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi32.tag, exports.pi32.parents, exports.pi32.children, changes);
            break;
        case "pi33":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi33.tag, exports.pi33.parents, exports.pi33.children, changes);
            break;
        case "pi34":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi34.tag, exports.pi34.parents, exports.pi34.children, changes);
            break;
        case "pi35":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi35.tag, exports.pi35.parents, exports.pi35.children, changes);
            break;
        case "pi36":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi36.tag, exports.pi36.parents, exports.pi36.children, changes);
            break;
        case "pi37":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi37.tag, exports.pi37.parents, exports.pi37.children, changes);
            break;
        case "pi38":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi38.tag, exports.pi38.parents, exports.pi38.children, changes);
            break;
        case "pi39":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi39.tag, exports.pi39.parents, exports.pi39.children, changes);
            break;
        case "pi40":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi40.tag, exports.pi40.parents, exports.pi40.children, changes);
            break;
        case "pi41":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi41.tag, exports.pi41.parents, exports.pi41.children, changes);
            break;
        case "pi42":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi42.tag, exports.pi42.parents, exports.pi42.children, changes);
            break;
        case "pi43":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi43.tag, exports.pi43.parents, exports.pi43.children, changes);
            break;
        case "pi44":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi44.tag, exports.pi44.parents, exports.pi44.children, changes);
            break;
        case "pi45":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi45.tag, exports.pi45.parents, exports.pi45.children, changes);
            break;
        case "pi46":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi46.tag, exports.pi46.parents, exports.pi46.children, changes);
            break;
        case "pi47":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi47.tag, exports.pi47.parents, exports.pi47.children, changes);
            break;
        case "pi48":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi48.tag, exports.pi48.parents, exports.pi48.children, changes);
            break;
        case "pi49":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi49.tag, exports.pi49.parents, exports.pi49.children, changes);
            break;
        case "pi50":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi50.tag, exports.pi50.parents, exports.pi50.children, changes);
            break;
        case "pi51":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi51.tag, exports.pi51.parents, exports.pi51.children, changes);
            break;
        case "pi52":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi52.tag, exports.pi52.parents, exports.pi52.children, changes);
            break;
        case "pi53":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi53.tag, exports.pi53.parents, exports.pi53.children, changes);
            break;
        case "pi54":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi54.tag, exports.pi54.parents, exports.pi54.children, changes);
            break;
        case "pi55":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi55.tag, exports.pi55.parents, exports.pi55.children, changes);
            break;
        case "pi56":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi56.tag, exports.pi56.parents, exports.pi56.children, changes);
            break;
        case "pi57":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi57.tag, exports.pi57.parents, exports.pi57.children, changes);
            break;
        case "pi58":
            new ServicesJane_1.DerivedService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi58.tag, exports.pi58.parents, exports.pi58.children, changes);
            break;
        case "pi59":
            new ServicesJane_1.SinkService(isQPROP, dataRate, totalVals, csvFile, ownIp, ownPort, monitorIP, monitorPort, exports.pi59.tag, exports.pi59.parents, exports.pi59.children, 10, changes, master);
            break;
        default:
            throw new Error("unknown spawning argument: " + toSpawn);
    }
}
exports.spawnPi = spawnPi;
//# sourceMappingURL=RegularJane.js.map