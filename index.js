var XLSX = require('xlsx');
var fs = require('fs');
var http = require('http');



function GetTableFromExcel() {
    
    // const buf = fs.readFileSync('./sam.xlsx');
    const buf = fs.readFileSync('./PB_4.3.2021_v2.xlsx');

    const wb = XLSX.read(buf, {type:'buffer'});
    
    //get the name of First Sheet.
    let tester = wb.SheetNames[2];
    let howToScale = wb.SheetNames[3];

    //Read all rows from First Sheet into an JSON array.
    let excelRows = XLSX.utils.sheet_to_json(wb.Sheets[tester]);
    let scaleRows = XLSX.utils.sheet_to_json(wb.Sheets[howToScale]);

    console.log(excelRows, scaleRows)
    //Create the object for steps of column headers
    let keysForColumns = Object.keys(scaleRows[0]);
    let scaleObj = {}
    keysForColumns.forEach(key => {
        if (key != 'id') {
            scaleObj[key] = {
                values: []
            };
        }
    });

    scaleRows.forEach(rows => {
        keysForColumns.forEach(key => {
            if (key != 'id') {
                scaleObj[key][rows['id']] = rows[key];
            }
        });
    });

    //Create the values array on each scale based on start, end, and step amounts
    for (const key in scaleObj) {
        for (let i = parseFloat(scaleObj[key].start); i <= parseFloat(scaleObj[key].end);) {
            scaleObj[key].values.push(i);
            i += parseFloat(scaleObj[key].scale);
        }
    }

    console.log(scaleObj)

    //Format the colums in order to make maps
    var colums = Object.keys(excelRows[0]);
    colums.pop();
    colums.shift();
    

    //This is the driver, does our recurssion and creates the screens
    //Then it checks each 'screen' against all symbols and groups them
    function cartesian(...args) {
        args = args[0];
        var r = [], max = args.length - 1;

        function helper(arr, i) {
            for (var j = 0, l = args[i].length; j < l; j++) {
                var a = arr.slice(0); // clone arr
                a.push(args[i][j]);
                if (i == max)
                    r.push(a);
                else
                    helper(a, i + 1);
            }
        }

        helper([], 0);

        //make the screens with the symbols and 'good' or 'bad' amounts
        let theGoodOnes = [];
        r.forEach(arr => {
            let map = {};
            colums.forEach((field, index) => {
                map[field] = arr[index]
            });
            let ratingMap = {
                R: 0,
                G: 0,
                B: 0,
                Y: 0,
                GG: 0
            };
            let theShit = [];
            let symbols = [];
            excelRows.forEach(symbol => {
                let toAddCount = 0;
                for (const field in symbol) {
                    if (map.hasOwnProperty(field)) {
                        if (parseFloat(symbol[field]) > parseFloat(map[field])) {
                            toAddCount += 1;
                        }
                    }
                }

                if (toAddCount == arr.length) {
                    symbols.push(symbol);

                    if (ratingMap.hasOwnProperty(symbol['therightstuff'])) {
                        ratingMap[symbol['therightstuff']] += 1;
                    }
                }

            });

            //pushing the new screen obj with symbols and counts on to array.
            theShit.push({
                distribution: ratingMap,
                screen: map,
                symbols
            });

            //Here we can decide what gets surfaced to us based on different parameters
            if(symbols.length) {
                //if ((a / (a +b) >= .5) && symbols.length > 2) {
                     theGoodOnes.push(theShit);
               // }
            }
        });
        console.log(theGoodOnes, 'good ones');
    };

    //create the array of values from the field objs we created earlier
    const screensToPass = []
    colums.forEach(field => {
        screensToPass.push(scaleObj[field].values)
    });
    
    //pass them into our driver
    cartesian([...screensToPass]);
};

//create a server object:
http.createServer(function (req, res) {
    GetTableFromExcel();
    res.write('Hello World!'); //write a response
    res.end(); //end the response
    
}).listen(3000, function () {
    console.log("server start at port 3000"); //the server object listens on port 3000
});