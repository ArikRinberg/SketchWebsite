var sketch = null
const K = 16
var auto = false

var randomFunction = () => {
    // return jStat.normal.sample(0,1).toFixed(2);;
    return Math.floor(Math.random() * 100);
}

function onSetUniform() {
    randomFunction = () => Math.floor(Math.random() * 100);
}

function onSetNormal() {
    randomFunction = () => jStat.normal.sample(0,1).toFixed(2);
}

function onSetGamma() {
    randomFunction = () => jStat.gamma.sample(1,2 ).toFixed(2);
}

function resetSketch() {
    sketch = new Quantiles(K);
    updateTable()
    resetGraph()
}

function resetGraph() {
    var xyValues = [{x:0, y:0}]
    new Chart("myChart", {
    type: "scatter",
    data: {
        datasets: [{
        pointRadius: 4,
        pointBackgroundColor: "rgba(0,0,255,1)",
        data: xyValues
        }]
    },
    });
}

function createBase() {
    const table = document.getElementById("base-table");
    var row = table.insertRow(-1);
    for (let i = 0; i < K * 2; i++) {
        const cell = row.insertCell(-1);
        cell.innerHTML = 0;
        cell.classList.add("quantile-data");
    }
    for (let i = 0; i < 32; i++) {
        row = table.insertRow(-1);
        for (let j = 0; j < K; j++) {
            const cell = row.insertCell(-1);
            cell.innerHTML = 0;
            cell.classList.add("quantile-data");
        }
    }

    sketch = new Quantiles(K);
}

function updateTable() {
    const div = document.getElementById("total-number-elements");
    if (sketch.n > 2 **33) {
        div.innerHTML = "Exceeded Sketch Size"
    } else {
        div.innerHTML = "Number of elements inserted: " + sketch.n
    }
    const table = document.getElementById("base-table");
    var row = table.rows[0];
    var i;
    for (i = 0; i < 2*K; i++) {
        var cell = row.cells[i]
        if (sketch.idx <= i) {
            cell.innerHTML = "-";
        } else {
            cell.innerHTML = sketch.baseArray[i];;
        }
    }
    for (i = 0; i < 32; i++) {
        row = table.rows[i + 1];
        for (let j = 0; j < K; j++) {
            cell = row.cells[j]
            if (sketch.levels[i] == null) {
                cell.innerHTML = "-";
            } else {
                cell.innerHTML = sketch.levels[i][j];
            }
        }
    }

}

function onGenerateClick() {
    var samples = sketch.query()
    var xyValues = []
    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        xyValues.push({x: s[0], y:s[1]})
    }
    if (xyValues == []) {
        xyValues.push({x:0, y:0});
    }
    new Chart("myChart", {
    type: "scatter",
    data: {
        datasets: [{
        pointRadius: 4,
        pointBackgroundColor: "rgba(0,0,255,1)",
        data: xyValues
        }]
    },
    });
    console.log("Setting Focus")
    document.getElementById("chart-focus").scrollIntoView({behavior:"smooth"})
}

document.addEventListener('DOMContentLoaded', function() {
    createBase();
    updateTable();
    resetGraph()
    

 }, false);

var autoInterval = null
function onToggleAuto() {
    const btn = document.getElementById("btn-auto");
    auto = ! auto
    if (auto) {
        autoInterval = setInterval(() =>
        {
            onInsertClick();
        },
        100);
        btn.innerText = "Stop Auto"
    } else {
        btn.innerText = "Start Auto"
        clearInterval(autoInterval);
    }
}

function onLargeInsertClick() {
    const inputNum = document.getElementById("input-number");
    const num = inputNum.value
    for (let i = 0; i < num; i++) {
        const e = randomFunction()
        sketch.add(e);  
    }
    updateTable();
}


function onInsertClick() {
    const e = randomFunction()
    sketch.add(e);        

    updateTable();
}

class Quantiles {
    constructor(k) {
        this.k = k
        this.baseArray = Array(2*k).fill(0);
        this.idx = 0;
        this.levels = Array(32).fill(null)
        this.n = 0
    }

    add(e) {
        this.n += 1
        this.baseArray[this.idx] = e
        this.idx += 1
        if (this.idx == 2 * this.k) {
            this.propagate()
            this.idx = 0;
        }
    }

    propagate() {
        var arrayCopy = [... this.baseArray]

        var sampledArray = this.sampleArray(arrayCopy)
        var i;
        for (i = 0; i < 32; i++) {
            if (this.levels[i] == null) {
                this.levels[i] = [...sampledArray]
                break
            } else {
                arrayCopy = [...sampledArray, ...this.levels[i]]
                this.levels[i] = null
                sampledArray = this.sampleArray(arrayCopy)
            }
        }
        if (i == 32) {
            console.log("Quantiles sketch is full!!!!");
        }
    }

    sampleArray(arr) {
        arr = arr.sort((a,b) => a-b)
        const indices = Math.floor(Math.random() * 2); // Random integer between 0 and 1
        var sampledArray = Array(this.k).fill(0);
        for (let i = 0; i < sampledArray.length; i++) {
            sampledArray[i] = arr[2*i + indices];
        }
        return sampledArray
    }

    query() {
        var samples = []
        for (let i = 0; i < this.idx; i++) {
            samples.push([this.baseArray[i], 1])
        }
        for (let i = 0; i < 32; i++) {
            const weight = 2 ** (i+1);
            if (this.levels[i] == null) {
                continue
            }
            for (let j = 0; j < this.levels[i].length; j++) {
                samples.push([this.levels[i][j], weight])
            }
        }
        if (samples.length  == 0) {
            return samples
        }
        samples.sort((a,b) => a[0] - b[0])
        var condensedSamples = [samples[0]]
        var lastAdded = samples[0][0]
        for (let i = 1; i < samples.length; i++) {
            const element = samples[i];
            if (element[0] == lastAdded) {
                condensedSamples[condensedSamples.length - 1][1] += element[1]
            } else {
                const currWeight = condensedSamples[condensedSamples.length - 1][1]
                condensedSamples.push([element[0], element[1] + currWeight])
                lastAdded = element[0]
            }
            
        }
        return condensedSamples
    }
 }

//  const sketch = Quantiles(16);
