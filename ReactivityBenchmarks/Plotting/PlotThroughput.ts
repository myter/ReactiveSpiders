export{}
var plotly = require('plotly')("fmyter", "2vS7PnPW9rby030FBL2L");
var fss = require('fs')
var csv = require('fast-csv')
var Stats = require('fast-stats').Stats;

var xVals : string[] = []
for(var i = 0;i < 350;i+=50){
    if(i == 0){
        xVals.push("1")
    }
    else{
        xVals.push(i.toString())
    }
}

let getAllData = (prefix,arrayIndex,fileIndex,resolver,valuesArray,errorArray) =>{
    return new Promise((resolve)=>{
        let stream
        if(fileIndex == 0){
            stream          = fss.createReadStream("../UseCase/Bertha/Regular/Throughput/"+prefix+"2.csv");
        }
        else{
            stream          = fss.createReadStream("../UseCase/Bertha/Regular/Throughput/"+prefix+fileIndex+".csv");
        }
        let allData         = []
        var csvStream = csv()
            .on("data", function(data){
                //Convert to seconds
                let timeTaken = parseInt(data[0]) / 1000
                let rProcessed = parseInt(data[1])
                allData.push(rProcessed / timeTaken)
            })
            .on("end", function(){
                let s = new Stats()
                s.push(allData)
                valuesArray[arrayIndex] = s.median()
                errorArray[arrayIndex] = s.moe()
                if(arrayIndex == 6){
                    resolver([valuesArray,errorArray])
                }
                else if(arrayIndex == 0){
                    return getAllData(prefix,arrayIndex+1,fileIndex+50,resolve,valuesArray,errorArray)
                }
                else{
                    return getAllData(prefix,arrayIndex+1,fileIndex+50,resolver,valuesArray,errorArray)
                }
            });
        stream.pipe(csvStream)
    })
}
getAllData("qprop",0,0,null,new Array(7),new Array(7)).then(([qpropValues,qpropError])=>{
    getAllData("sidup",0,0,null,new Array(7),new Array(7)).then(([sidupValues,sidupError])=>{
        let qpropData = {
            x: xVals,
            y: qpropValues,
            error_y: {
                type: "data",
                array: qpropError,
                visible: true
            },
            name: "QPROP"
        }
        let sidupData = {
            x: xVals,
            y: sidupValues,error_y: {
                type: "data",
                array: sidupError,
                visible: true
            },
            name: "SID-UP"
        }
        let layout = {
            showlegend: true,
            legend: {
                x: 0,
                y: 1
            },
            title: "Throughput under Varying Load",
            xaxis: {
                title: "Load (requests/s)",
                /*titlefont: {
                    family: "Courier New, monospace",
                    size: 18,
                    color: "#7f7f7f"
                }*/
            },
            yaxis: {
                title: "Throughput (requests/s)",
                /*titlefont: {
                    family: "Courier New, monospace",
                    size: 18,
                    color: "#7f7f7f"
                }*/
            },
            annotations: [
                {
                    x:45,
                    y:50,
                    xref: "x",
                    yref: "y",
                    text: "Weekend load",
                    showarrow: true,
                    arrowhead: 1,
                    ax: 0,
                    ay: -40
                },
                {
                    x:75,
                    y:80,
                    xref: "x",
                    yref: "y",
                    text: "Evening load",
                    showarrow: true,
                    arrowhead: 1,
                    ax: 0,
                    ay: -40
                },
                {
                    x:300,
                    y:310,
                    xref: "x",
                    yref: "y",
                    text: "Daytime load",
                    showarrow: true,
                    arrowhead: 1,
                    ax: 0,
                    ay: -40
                }
            ]
        }
        let figure = {
            data: [qpropData,sidupData],
            layout : layout
        }
        let imgOpts = {
            format: 'pdf',
            width: 500,
            height: 500
        }
        plotly.getImage(figure, imgOpts, function (error, imageStream) {
            if (error) return console.log (error);

            var fileStream = fss.createWriteStream('throughput.pdf');
            imageStream.pipe(fileStream);
        });
    })
})