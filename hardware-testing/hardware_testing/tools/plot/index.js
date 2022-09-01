function getEmptyGravData() {
  return [
    {
      x: [], // relative-time
      y: [], // stable-grams
      type: 'scatter',
      name: 'Stable Grams',
      marker: {
        color: '#006fff',
      },
    },
    {
      x: [], // relative-time
      y: [], // unstable-grams
      type: 'scatter',
      name: 'Unstable Grams',
      marker: {
        color: '#d0241b',
      },
    },
  ]
}

function getEmptyPipetteData() {
  return [
    {
      x: [], // relative-time
      y: [], // event-timestamp
      type: 'scatter',
      name: 'Pipette Event',
      marker: {
        color: '#006fff',
      },
    },
  ]
}

function getEmptyPlotlyData() {
  const emptyGravData = getEmptyGravData()
  const emptyPipetteData = getEmptyPipetteData()
  return [emptyGravData[0], emptyGravData[1], emptyPipetteData[0]]
}

function parsePipetteCSV(CSVData, retData) {
  // TODO: figure out how to parse this
  if (!CSVData.length) {
    return retData
  }
  //    example = {
  //        x: [1, 2, 3, 4, 5],
  //        y: [1, 6, 3, 6, 1],
  //        mode: 'markers+text',
  //        type: 'scatter',
  //        name: 'Team A',
  //        text: ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'],
  //        textposition: 'top center',
  //        textfont: {
  //            family:  'Raleway, sans-serif'
  //        },
  //        marker: { size: 12 }
  //    }
  return retData
}

function parseGravimetricCSV(CSVData, retData) {
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
  const relativeTimeIdx = headerItems.indexOf('relative-time')
  const stableGramsIdx = headerItems.indexOf('stable-grams')
  const unstableGramsIdx = headerItems.indexOf('unstable-grams')
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
    if (CSVLineItems[stableGramsIdx].length) {
      stableGrams = Number(CSVLineItems[stableGramsIdx])
    }
    retData[0].y.push(stableGrams) // stable
    let unstableGrams
    if (CSVLineItems[unstableGramsIdx].length) {
      unstableGrams = Number(CSVLineItems[unstableGramsIdx])
    }
    retData[1].y.push(unstableGrams) // unstable
  }
  return retData
}

window.addEventListener('load', function (evt) {
  const _updateIntervalMillis = 1000
  let _interval
  const layout = {
    title: 'Untitled',
    uirevision: true,
    xaxis: { autorange: true },
    yaxis: { autorange: true },
  }
  const name_input_div = document.getElementById('testname')
  const plotlyDivName = 'plotly'

  function _clearInterval() {
    if (_interval) {
      clearInterval(_interval)
      _interval = undefined
    }
  }

  function _onScreenSizeUpdate(evt) {
    const div = document.getElementById(plotlyDivName)
    div.style.width = window.innerWidth - 50 + 'px'
    div.style.height = window.innerHeight - 100 + 'px'
  }

  function _initializePlot() {
    const initData = getEmptyPlotlyData()
    layout.title = ''
    Plotly.newPlot('plotly', initData, layout, { responsive: true }) // eslint-disable-line no-undef
  }

  function _onTestNameResponse() {
    const responseData = JSON.parse(this.responseText)
    name_input_div.value = responseData.name
    _clearInterval()
    _interval = setInterval(_getLatestDataFromServer, _updateIntervalMillis)
    _getLatestDataFromServer()
  }

  function _getLatestDataFromServer(evt) {
    const oReq = new XMLHttpRequest()
    oReq.addEventListener('load', function () {
      const responseData = JSON.parse(this.responseText)
      let newData = getEmptyPlotlyData()
      newData = parseGravimetricCSV(responseData.latest.csv, newData)
      newData = parsePipetteCSV(responseData.latest.csvPipette, newData)
      // const newDataPipette = parsePipetteCSV(responseData.latest.csvPipette);
      // TODO: figure out how to plot this...
      layout.title = responseData.latest.name
      Plotly.react(plotlyDivName, newData, layout, { responsive: true }) // eslint-disable-line no-undef
    })
    oReq.open('GET', 'http://' + window.location.host + '/data/latest')
    oReq.send()
  }

  function _getTestNameFromServer(evt) {
    const oReq = new XMLHttpRequest()
    oReq.addEventListener('load', _onTestNameResponse)
    oReq.open('GET', 'http://' + window.location.host + '/name')
    oReq.send()
  }

  function _setTestNameOfServer(evt) {
    _clearInterval()
    _initializePlot()
    const oReq = new XMLHttpRequest()
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
