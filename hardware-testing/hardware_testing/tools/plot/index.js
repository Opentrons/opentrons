// NOTE: removed "gravimetric-" from string so buttons can be smaller
const testNames = [
  'rnd',
  'daily-setup',
  'ot3-p50-multi',
  'ot3-p50-multi-50ul-tip-increment',
  'ot3-p50-single',
  'ot3-p1000-96',
  'ot3-p1000-multi',
  'ot3-p1000-multi-50ul-tip-increment',
  'ot3-p1000-multi-200ul-tip-increment',
  'ot3-p1000-multi-1000ul-tip-increment',
  'ot3-p1000-single',
]
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
  const _updateTimeoutMillis = 100
  const _reloadTimeoutMillis = 1000 * 10
  let _timeout
  let _timeoutReload
  const layout = {
    title: 'Untitled',
    uirevision: true,
    xaxis: { autorange: true },
    yaxis: { autorange: true },
  }
  const name_input_div = document.getElementById('testname')
  const button_input_div = document.getElementById('buttoncontainer')
  const allButtons = []
  for (let i = 0; i < testNames.length; i++) {
    const btn = document.createElement('input')
    btn.type = 'button'
    btn.value = testNames[i]
    btn.onclick = function () {
      name_input_div.value = 'gravimetric-' + btn.value
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
    layout.title = ''
    Plotly.newPlot('plotly', initData, layout, { responsive: true }) // eslint-disable-line no-undef
  }

  function _onTestNameResponse() {
    _clearTimeout()
    const responseData = JSON.parse(this.responseText)
    name_input_div.value = responseData.name
    let btn_val
    for (let i = 0; i < allButtons.length; i++) {
      btn_val = 'gravimetric-' + allButtons[i].value
      if (btn_val === responseData.name) {
        allButtons[i].style.backgroundColor = 'yellow'
      } else {
        allButtons[i].style.backgroundColor = '#bbb'
      }
    }
    _getLatestDataFromServer()
  }

  function _onServerError(evt) {
    clearTimeout()
    document.body.style.backgroundColor = 'red'
    document.body.innerHTML = '<h1>Lost Connection (refresh)</h1>'
    location.reload()
  }

  function _getLatestDataFromServer(evt) {
    _clearTimeout()
    const oReq = new XMLHttpRequest()
    oReq.addEventListener('error', _onServerError)
    oReq.addEventListener('load', function () {
      _clearTimeout()
      const responseData = JSON.parse(this.responseText)
      let newData = getEmptyPlotlyData()
      newData = parseGravimetricCSV(responseData.latest.csv, newData)
      newData = parsePipetteCSV(responseData.latest.csvPipette, newData)
      // const newDataPipette = parsePipetteCSV(responseData.latest.csvPipette);
      // TODO: figure out how to plot this...
      layout.title = responseData.latest.name
      Plotly.react(plotlyDivName, newData, layout, { responsive: true }) // eslint-disable-line no-undef
      _timeout = setTimeout(_getLatestDataFromServer, _updateTimeoutMillis)
    })
    oReq.open('GET', 'http://' + window.location.host + '/data/latest')
    oReq.send()
    _timeoutReload = setTimeout(_onServerError, _reloadTimeoutMillis)
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
