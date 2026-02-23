// Plot configurations - add/remove entries here to control which plots are displayed
// Each plot can specify a filePattern to load data from a different CSV file
const plotConfigs = [
  {
    divId: 'plotly1',
    xColumn: 'Time(s)',
    yColumns: ['current_gauge_pressure'],
    title: 'Pressure vs Time',
    yAxisLabel: 'Pressure (mbar)',
    colors: ['#006fff'],
    filePattern: 'PressureData', // matches CSV files containing "PressureData" in the name
  },
  {
    divId: 'plotly2',
    xColumn: 'Time(s)',
    yColumns: ['Flow_rate(sLM)'],
    title: 'Flow Rate (sLM) vs Time',
    yAxisLabel: 'Flow Rate (sLM)',
    colors: ['#ff3a33'],
    filePattern: 'FlowrateData', // matches CSV files containing "FlowrateData" in the name
  }
];

function createPlotContainers() {
  const container = document.getElementById('plot-container');
  plotConfigs.forEach((config, index) => {
    // Create outer wrapper div with border
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'plot-wrapper';
    wrapperDiv.style.width = '100%';
    wrapperDiv.style.height = '450px';
    wrapperDiv.style.marginBottom = '30px';
    wrapperDiv.style.display = 'block';
    wrapperDiv.style.position = 'relative';
    
    // Create inner div for Plotly
    const plotDiv = document.createElement('div');
    plotDiv.id = config.divId;
    plotDiv.style.width = '100%';
    plotDiv.style.height = '400px';
    plotDiv.style.margin = '0';
    plotDiv.style.padding = '0';
    
    // Append inner div to wrapper, then wrapper to container
    wrapperDiv.appendChild(plotDiv);
    container.appendChild(wrapperDiv);
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

function updatePlot(config, fileData) {
  if (!fileData) {
    console.error('No data returned for plot:', config.title, '(filePattern:', config.filePattern, ')');
    return;
  }

  const timeData = fileData[config.xColumn];

  if (!Array.isArray(timeData)) {
    console.error('Invalid time data for plot:', config.title);
    return;
  }

  const newData = config.yColumns.map((yColumn, i) => {
    const yData = fileData[yColumn];

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
    title: config.title,
    xaxis: { title: config.xColumn + ' (s)', autorange: true },
    yaxis: { title: config.yAxisLabel, autorange: true },
    uirevision: true,
  };

  Plotly.react(config.divId, newData, layout, { responsive: true }); // eslint-disable-line no-undef
}

function updateAllPlots(responseData) {
  plotConfigs.forEach((config) => {
    // Each plot's data is keyed by its filePattern in the response
    const fileData = responseData.latest[config.filePattern];
    updatePlot(config, fileData);
  });
}

window.addEventListener('load', function (evt) {
  const _updateTimeoutMillis = 100;
  const _reloadTimeoutMillis = 1000 * 10;
  let _timeout;
  let _timeoutReload;

  // Create plot containers and initialize empty plots
  createPlotContainers();
  initializePlots();

  function _clearTimeout() {
    if (_timeout) {
      clearTimeout(_timeout);
      _timeout = undefined;
    }
    if (_timeoutReload) {
      clearTimeout(_timeoutReload);
      _timeoutReload = undefined;
    }
  }

  function _onScreenSizeUpdate(evt) {
    // Disable dynamic resizing to prevent overlapping - use fixed CSS sizing instead
    console.log('Screen size update disabled to prevent plot overlapping');
    // Force proper stacking by ensuring each wrapper maintains its position
    plotConfigs.forEach((config, index) => {
      const div = document.getElementById(config.divId);
      if (div && div.parentElement) {
        // Force static positioning to prevent overlap
        div.parentElement.style.position = 'static';
        div.parentElement.style.display = 'block';
        div.parentElement.style.marginBottom = '50px';
        div.style.position = 'relative';
      }
    });
  }

  function _onTestNameResponse() {
    _clearTimeout();
    const responseData = JSON.parse(this.responseText);
    _getLatestDataFromServer();
  }

  function _onServerError(evt) {
    _clearTimeout();
    document.body.style.backgroundColor = 'red';
    document.body.innerHTML = '<h1>Lost Connection (refresh)</h1>';
    location.reload();
  }

  function _getLatestDataFromServer(evt) {
    _clearTimeout();
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('error', _onServerError);
    oReq.addEventListener('load', function () {
      _clearTimeout();
      const responseData = JSON.parse(this.responseText);

      // Update ALL plots with the latest data
      updateAllPlots(responseData);

      _timeout = setTimeout(_getLatestDataFromServer, _updateTimeoutMillis);
    });
    oReq.open('GET', 'http://' + window.location.host + '/data/latest');
    oReq.send();
    _timeoutReload = setTimeout(_onServerError, _reloadTimeoutMillis);
  }

  function _getTestNameFromServer(evt) {
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('error', _onServerError);
    oReq.addEventListener('load', _onTestNameResponse);
    oReq.open('GET', 'http://' + window.location.host + '/name');
    oReq.send();
  }

  function _setTestNameOfServer(evt) {
    _clearTimeout();
    initializePlots();
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('error', _onServerError);
    oReq.addEventListener('load', _onTestNameResponse);
    oReq.open(
      'GET',
      'http://' + window.location.host + '/name/' + name_input_div.value
    );
    oReq.send();
  }

  // window.addEventListener('resize', _onScreenSizeUpdate)
  // _onScreenSizeUpdate(evt)
  window.addEventListener('resize', _onScreenSizeUpdate);
  _onScreenSizeUpdate(evt);
  _getTestNameFromServer();
});
