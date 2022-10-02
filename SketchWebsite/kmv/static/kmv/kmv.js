var sketch = null
const K = 7
var auto = false
var oldData = null

var randomFunction = () => {
    // return jStat.normal.sample(0,1).toFixed(2);;
    return Math.floor(Math.random() * 100);
}

function onCalcHash() {
    const inputNum = document.getElementById("input-number-for-hash");
    const num = inputNum.value
    const h = sketch.hashFun(num)
    const output = document.getElementById("hash-result");
    output.innerHTML = h
}

function resetSketch() {
    sketch = new KMV(K);
    updateTable()
}

function createBase() {
    const base = document.getElementById("base-div");
    oldData = Array(Math.log2(K+1)).fill([]);
    for (let l = 0; l < Math.log2(K+1); l++) {
        var row = document.createElement('div');
        row.classList.add("row")
        base.appendChild(row)
        // var row = table.insertRow(-1);
        oldData[l] = Array(2 ** l).fill(-1)
        for (let i = 0; i < 2 ** l; i++) {
            var cell = document.createElement('div');
            cell.classList.add("col")
            cell.classList.add("justify-content-center")
            row.appendChild(cell)
            // const cell = row.insertCell(-1);
            var p = document.createElement('p');
            p.classList.add("text-center")
            p.classList.add("justify-content-center")
            p.classList.add("quantile-data");
            p.classList.add("p-kmv-item")
            p.dataset.level = l
            p.dataset.col = i
            p.onmouseover = (event) => onMouseOnPar(event.target)
            p.onmouseleave = (event) => onMouseLeavePar(event.target)
            // <p class="justify-content-center text-center">
            //         1 of 1
            // </p>
            // p.style.display = 
            // p.classList.add("w-100")
            p.innerHTML = i;
            // cell.innerHTML = i;
            cell.appendChild(p)
            // cell.classList.add("quantile-data");
        }
    }
    sketch = new KMV(K);
}

function onMouseOnPar(par) {
    const level = par.dataset.level
    const col = par.dataset.col
    const e = sketch.arrays[level][col]
    const h = sketch.hashFun(e)
    par.innerHTML = String(h)
}

function onMouseLeavePar(par) {
    const level = par.dataset.level
    const col = par.dataset.col
    const e = sketch.arrays[level][col]
    par.innerHTML = String(e)
}

function updateTable() {
    // const base = document.getElementById("total-number-elements");
    // console.log()
    // if (sketch.n > 2 **33) {
    //     div.innerHTML = "Exceeded Sketch Size"
    // } else {
    //     div.innerHTML = "Number of elements inserted: " + sketch.n
    // }
    const base = document.getElementById("base-div");
    for (let l = 0; l < Math.log2(K+1); l++) {
        var row = base.children[l];
        for (let i = 0; i < 2 ** l; i++) {
            var cell = row.children[i]
            var par = cell.children[0]
            if (oldData[l][i] != sketch.arrays[l][i]) {
                updateKmvItem(par)
            }
            oldData[l][i] = sketch.arrays[l][i]
            par.innerHTML = String(sketch.arrays[l][i]);
        }
    }
}

function updateKmvItem(par) {
    par.style.transitionDuration = "0s"
    par.style.backgroundColor = "green";

    setTimeout(() => {
        par.style.transitionDuration = "1s"
        par.style.backgroundColor = "white";
    }, 10)
}

function onQueryClick() {
    const output = document.getElementById("query-result");
    output.innerHTML = sketch.query()
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

class KMV {

    /**
     * Returns a hash code from a string
     * @param  {String} str The string to hash.
     * @return {Number}    A 32bit integer
     * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     */
    createHash() {
        var max32 = Math.pow(2,32)
        var seed = Math.floor(Math.random() * max32);
        return (str) => {
            if (str == -1) {
                return 1
            }
            str = String(str)
            const hash = CryptoJS.MD5(String(str));
            const firstPart = Math.abs(hash.words[0])
            return firstPart  / max32;
        }
    }

    constructor(k) {
        this.k = k
        this.arrays = Array(Math.log2(k+1)).fill([]);
        this.inserted = 0;
        for (let l = 0; l < this.arrays.length; l++) {
            this.arrays[l] = Array(2 ** l).fill(-1)
        }
        this.hashFun = this.createHash()
        this.maxElement = 1
    }

    add(e) {
        this.inserted++;
        let h = this.hashFun(e)
        if (h < this.maxElement) {
            if (this.checkContains(h)) {
                console.log("Duplicate")
                return;
            }
            this.arrays[0][0] = e
            var prevIdx = 0
            for (let l = 1; l < this.arrays.length; l++) {
                var maxH = -1;
                var maxIdx = 0;
                for (let i = 0; i < this.arrays[l].length; i++) {
                    let currE = this.arrays[l][i]
                    const currH = this.hashFun(currE)
                    if ( h < currH && currH > maxH ) {
                        maxH = currH
                        maxIdx = i
                    }
                }
                if (maxH == -1) {
                    return
                }

                let temp = this.arrays[l][maxIdx]
                this.arrays[l][maxIdx] = e
                this.arrays[l-1][prevIdx] = temp
                prevIdx = maxIdx
                this.maxElement = this.hashFun(this.arrays[0][0])
            }
        }
    }

    checkContains(h) {
        for (let l = 1; l < this.arrays.length; l++) {
            for (let i = 0; i < this.arrays[l].length; i++) {
                let e = this.arrays[l][i]
                const currH = this.hashFun(e)
                if (currH == h) {
                    return true;
                }
            }
        }
        return false;
    }


    query() {
        if (this.inserted <= this.k) {
            return this.inserted
        }
        return this.k / this.hashFun(this.arrays[0][0]);
    }
 }