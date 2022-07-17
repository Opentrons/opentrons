function getEmptyPlotlyData() {
    return [
        {
            x: [],  // relative-time
            y: [],  // stable-grams
            type: 'scatter',
            name: 'Stable Grams',
            marker: {
                color: '#006fff'
            }
        },
        {
            x: [],  // relative-time
            y: [],  // unstable-grams
            type: 'scatter',
            name: 'Unstable Grams',
            marker: {
                color: '#d0241b'
            }
        }
    ];
}

function parseGravimetricCSV(CSVData) {
    var retData = getEmptyPlotlyData();
    if (!CSVData.length) {
        return retData;
    }
    // split CSV by newline
    var CSVDataLines = CSVData.split('\n');
    // grab CSV header
    var headerItems = CSVDataLines[0].split(',');
    if (!headerItems.length) {
        return retData
    }
    // get indices of desired columns
    var relativeTimeIdx = headerItems.indexOf('relative-time');
    var stableGramsIdx = headerItems.indexOf('stable-grams');
    var unstableGramsIdx = headerItems.indexOf('unstable-grams');
    // save each sample to the plotly data arrays
    for (var i=1;i<CSVDataLines.length;i++) {
        // ignore empty lines
        if (!CSVDataLines[i].length) {
            continue;
        }
        var CSVLineItems = CSVDataLines[i].split(',');
        var relativeTime = Number(CSVLineItems[relativeTimeIdx]);
        retData[0].x.push(relativeTime);
        retData[1].x.push(relativeTime);
        // set value as `undefined` to keep it blank in the plot
        var stableGrams = undefined;
        if (CSVLineItems[stableGramsIdx].length) {
            stableGrams = Number(CSVLineItems[stableGramsIdx]);
        }
        retData[0].y.push(stableGrams); // stable
        var unstableGrams = undefined;
        if (CSVLineItems[unstableGramsIdx].length) {
            unstableGrams = Number(CSVLineItems[unstableGramsIdx]);
        }
        retData[1].y.push(unstableGrams); // unstable
    }
    return retData;
}

window.addEventListener('load', function (evt) {
    // resize the Plotly div so it's nearly the size of the screen
    function _onScreenSizeUpdate(evt) {
        var div = document.getElementById('plotly');
        div.style.width = (window.innerWidth - 50) + 'px';
        div.style.height = (window.innerHeight - 50) + 'px';
    }
    _onScreenSizeUpdate(evt);
    window.addEventListener('resize', _onScreenSizeUpdate);

    var layout = {
        title: 'Untitled',
        uirevision: true,
        xaxis: {autorange: true},
        yaxis: {autorange: true},
    };
    function _getLatestDataFromServer(evt) {
        var oReq = new XMLHttpRequest();
        oReq.addEventListener('load', function () {
            var responseData = JSON.parse(this.responseText);
            var newData = parseGravimetricCSV(responseData.latest.csv);
            layout.title = responseData.latest.name
            Plotly.react('plotly', newData, layout, {responsive: true});
        });
        oReq.open('GET', 'http://' + window.location.host + '/data/latest');
        oReq.send();
    }
    var initData = getEmptyPlotlyData();
    Plotly.newPlot('plotly', initData, layout, {responsive: true});
    setInterval(_getLatestDataFromServer, 500);
    _getLatestDataFromServer();
});
