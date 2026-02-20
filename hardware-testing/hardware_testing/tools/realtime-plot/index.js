// NOTE: removed "gravimetric-" from string so buttons can be smaller
const testNames = [
  'Realtime-plot',
]
function getEmptyData() {
  return [
    {
      x: [], // time
      y: [], // pressure
      type: 'scatter',
      name: 'Data',
      marker: {
        color: '#006fff',
      },
    },
    // {
    //   x: [], // time
    //   y: [], // another y axis
    //   type: 'scatter',
    //   name: 'Unstable Grams',
    //   marker: {
    //     color: '#1d1c1c',
    //   },
    // },
  ]
}

function getEmptyPlotlyData() {
  const emptyGravData = getEmptyData()
  return [emptyGravData[0]]; //,emptyGravData[1]],emptyPipetteData[0]]
}

function parseDataCSV(CSVData, retData) {
  if (!CSVData.length) {
    return retData
  }
  // split CSV by newline
  const CSVDataLines = CSVData.split('\n')
  // grab CSV header
  const headerItems = CSVDataLines[0].split(',')
  if (!headerItems.length) {
    return retData
  }
  // get indices of desired columns
  const relativeTimeIdx = headerItems.indexOf('Time')
  const dataIdx = headerItems.indexOf('Pressure')
  // const undataIdx = headerItems.indexOf('unstable-grams')
  // save each sample to the plotly data arrays
  for (let i = 1; i < CSVDataLines.length; i++) {
    // ignore empty lines
    if (!CSVDataLines[i].length) {
      continue
    }
    const CSVLineItems = CSVDataLines[i].split(',')
    const relativeTime = Number(CSVLineItems[relativeTimeIdx])
    retData[0].x.push(relativeTime)
    retData[1].x.push(relativeTime)
    // set value as `undefined` to keep it blank in the plot
    let stableGrams
    if (CSVLineItems[dataIdx].length) {
      stableGrams = Number(CSVLineItems[dataIdx])
    }
    retData[0].y.push(stableGrams) // stable
  }
  return retData
}

function readCSVAndPlot(csvFilePath) {
  fetch(csvFilePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load CSV file: ${response.statusText}`);
      }
      return response.text();
    })
    .then((csvData) => {
      const rows = csvData.split('\n');
      const xData = [];
      const yData = [];

      rows.forEach((row, index) => {
        const columns = row.split(',');
        if (index > 0 && columns.length >= 2) { // Skip header row and ensure at least 2 columns
          xData.push(columns[0]); // First column for x-axis
          yData.push(columns[1]); // Second column for y-axis
        }
      });

      const plotData = [
        {
          x: xData,
          y: yData,
          type: 'scatter',
          mode: 'lines+markers',
          name: 'CSV Data',
          marker: { color: '#006fff' },
        },
      ];

      const layout = {
        title: 'Pressure vs Time',
        xaxis: { title: 'Time (s)', autorange: true },
        yaxis: { title: 'Pressure (mbar)', autorange: true },
        uirevision: true,
      };

      Plotly.newPlot('plotly', plotData, layout, { responsive: true }); // eslint-disable-line no-undef
    })
    .catch((error) => {
      console.error('Error reading CSV file:', error);
    });
}

window.addEventListener('load', function (evt) {
  const _updateTimeoutMillis = 100
  const _reloadTimeoutMillis = 1000 * 10
  let _timeout
  let _timeoutReload
  const layout = {
    title: 'Pressure vs Time',
    xaxis: { 
      title: 'Time (s)', // X Axis Label
      autorange: true },
    yaxis: { 
      title: 'Pressure (mbar)', // Y Axis Label
      autorange: true }, 
    uirevision: true, // Preserve UI state (e.g., zoom level) on updates
  }
  const name_input_div = document.getElementById('testname')
  const button_input_div = document.getElementById('buttoncontainer')
  const allButtons = []
  for (let i = 0; i < testNames.length; i++) {
    const btn = document.createElement('input')
    btn.type = 'button'
    btn.value = testNames[i]
    btn.onclick = function () {
      name_input_div.value = btn.value
      _setTestNameOfServer(null)
    }
    btn.style.backgroundColor = 'grey'
    btn.style.marginRight = '5px'
    button_input_div.appendChild(btn)
    allButtons.push(btn)
  }

  const plotlyDivName = 'plotly'

  function _clearTimeout() {
    if (_timeout) {
      clearTimeout(_timeout)
      _timeout = undefined
    }
    if (_timeoutReload) {
      clearTimeout(_timeoutReload)
      _timeoutReload = undefined
    }
  }

  function _onScreenSizeUpdate(evt) {
    const div = document.getElementById(plotlyDivName)
    div.style.width = window.innerWidth - 50 + 'px'
    div.style.height = window.innerHeight - 100 + 'px'
    button_input_div.style.width = window.innerWidth - 50 + 'px'
    if (window.innerWidth - 160 > 400) {
      name_input_div.style.width = window.innerWidth - 160 + 'px'
    } else {
      name_input_div.style.width = 400 + 'px'
    }
  }

  function _initializePlot() {
    const initData = getEmptyPlotlyData()
    const layout = {
    title: 'Pressure vs Time',
    xaxis: {
      title: 'Time (s)',
      autorange: true,
    },
    yaxis: {
      title: 'Pressure (mbar)',
      autorange: true,
    },
    uirevision: true,
    };
    Plotly.newPlot('plotly', initData, layout, { responsive: true }) // eslint-disable-line no-undef
  }

  function _onTestNameResponse() {
    _clearTimeout();
    const responseData = JSON.parse(this.responseText);

    // Directly update the plot with the latest data
    _getLatestDataFromServer();
  }

  function _onServerError(evt) {
    clearTimeout()
    document.body.style.backgroundColor = 'red'
    document.body.innerHTML = '<h1>Lost Connection (refresh)</h1>'
    location.reload()
  }

  function _getLatestDataFromServer(evt) {
    _clearTimeout();
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('error', _onServerError);
    oReq.addEventListener('load', function () {
      _clearTimeout();
      const responseData = JSON.parse(this.responseText);

      // Debug: Log the response data
      console.log('Response Data:', responseData);

      // Extract Time and Pressure data
      const timeData = responseData.latest.Time;
      const pressureData = responseData.latest.Pressure;

      // Debug: Log the extracted data
      console.log('Time Data:', timeData);
      console.log('Pressure Data:', pressureData);

      // Prepare Plotly data
      const newData = [
        {
          x: timeData, // Time on the x-axis
          y: pressureData, // Pressure on the y-axis
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Pressure vs Time',
          marker: { color: '#006fff' },
        },
      ];

      // Debug: Log the data being sent to Plotly
      console.log('Plotly Data:', newData);

      // Update the plot
      layout.title = responseData.latest.name;
      Plotly.react('plotly', newData, layout, { responsive: true }); // eslint-disable-line no-undef
      _timeout = setTimeout(_getLatestDataFromServer, _updateTimeoutMillis);
    });
    oReq.open('GET', 'http://' + window.location.host + '/data/latest');
    oReq.send();
    _timeoutReload = setTimeout(_onServerError, _reloadTimeoutMillis);
  }

  function _getTestNameFromServer(evt) {
    const oReq = new XMLHttpRequest()
    oReq.addEventListener('error', _onServerError)
    oReq.addEventListener('load', _onTestNameResponse)
    oReq.open('GET', 'http://' + window.location.host + '/name')
    oReq.send()
  }

  function _setTestNameOfServer(evt) {
    _clearTimeout()
    _initializePlot()
    const oReq = new XMLHttpRequest()
    oReq.addEventListener('error', _onServerError)
    oReq.addEventListener('load', _onTestNameResponse)
    oReq.open(
      'GET',
      'http://' + window.location.host + '/name/' + name_input_div.value
    )
    oReq.send()
  }

  name_input_div.addEventListener('keyup', function (evt) {
    if (evt.keyCode === 13) {
      _setTestNameOfServer(evt)
    }
  })
  window.addEventListener('resize', _onScreenSizeUpdate)
  _onScreenSizeUpdate(evt)
  _getTestNameFromServer()
})
