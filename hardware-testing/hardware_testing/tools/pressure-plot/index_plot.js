// Plot configurations - add/remove entries here to control which plots are displayed
const plotConfigs = [
  {
    divId: 'plotly1',
    xColumn: 'Time',
    yColumns: ['Pressure'],
    title: 'Pressure vs Time',
    yAxisLabel: 'Pressure (mbar)',
    colors: ['#006fff'],
  },
  // {
  //   divId: 'plotly2',
  //   xColumn: 'Time',
  //   yColumns: ['Temperature'],
  //   title: 'Temperature vs Time',
  //   yAxisLabel: 'Temperature',
  //   colors: ['#ff5733'],
  // },
]

const testNames = [
  'Realtime-plot',
]

function createPlotContainers() {
  const container = document.getElementById('plot-container');
  plotConfigs.forEach((config) => {
    const plotDiv = document.createElement('div');
    plotDiv.id = config.divId;
    plotDiv.style.width = '100%';
    plotDiv.style.height = '400px';
    plotDiv.style.marginTop = '20px';
    plotDiv.style.border = 'solid 2px black';
    container.appendChild(plotDiv);
  });
}

function initializePlots() {
  plotConfigs.forEach((config) => {
    const emptyData = config.yColumns.map((yCol, i) => ({
      x: [],
      y: [],
      type: 'scatter',
      mode: 'lines+markers',
      name: yCol,
      marker: { color: config.colors[i] || '#006fff' },
    }));
    const layout = {
      title: config.title,
      xaxis: { title: config.xColumn + ' (s)', autorange: true },
      yaxis: { title: config.yAxisLabel, autorange: true },
      uirevision: true,
    };
    Plotly.newPlot(config.divId, emptyData, layout, { responsive: true }); // eslint-disable-line no-undef
  });
}

function updatePlot(config, responseData) {
  const timeData = responseData.latest[config.xColumn];

  if (!Array.isArray(timeData)) {
    console.error('Invalid time data for plot:', config.title);
    return;
  }

  const newData = config.yColumns.map((yColumn, i) => {
    const yData = responseData.latest[yColumn];

    if (!Array.isArray(yData)) {
      console.error('Invalid data for column:', yColumn);
      return null;
    }

    return {
      x: timeData,
      y: yData,
      type: 'scatter',
      mode: 'lines+markers',
      name: yColumn,
      marker: { color: config.colors[i] || '#006fff' },
    };
  }).filter(Boolean);

  const layout = {
    title: responseData.latest.name || config.title,
    xaxis: { title: config.xColumn + ' (s)', autorange: true },
    yaxis: { title: config.yAxisLabel, autorange: true },
    uirevision: true,
  };

  Plotly.react(config.divId, newData, layout, { responsive: true }); // eslint-disable-line no-undef
}

function updateAllPlots(responseData) {
  plotConfigs.forEach((config) => {
    updatePlot(config, responseData);
  });
}

window.addEventListener('load', function (evt) {
  const _updateTimeoutMillis = 100
  const _reloadTimeoutMillis = 1000 * 10
  let _timeout
  let _timeoutReload

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

  // Create plot containers and initialize empty plots
  createPlotContainers();
  initializePlots();

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
    const plotWidth = window.innerWidth - 50 + 'px'
    const plotHeight = (window.innerHeight / plotConfigs.length) - 80 + 'px'
    plotConfigs.forEach((config) => {
      const div = document.getElementById(config.divId)
      if (div) {
        div.style.width = plotWidth
        div.style.height = plotHeight
      }
    })
    button_input_div.style.width = window.innerWidth - 50 + 'px'
    if (window.innerWidth - 160 > 400) {
      name_input_div.style.width = window.innerWidth - 160 + 'px'
    } else {
      name_input_div.style.width = 400 + 'px'
    }
  }

  function _onTestNameResponse() {
    _clearTimeout();
    const responseData = JSON.parse(this.responseText);
    _getLatestDataFromServer();
  }

  function _onServerError(evt) {
    _clearTimeout()
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
      console.log('Response Data:', responseData);

      // Update ALL plots with the latest data
      updateAllPlots(responseData);

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
    initializePlots()
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
