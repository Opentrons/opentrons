// Real-time CSV plotting JavaScript
let isRunning = true;
let updateInterval = 500;
let updateCount = 0;
let currentData = null;
let plotInitialized = false;

// Configuration
const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'resetScale2d'],
    displaylogo: false
};

function updateStatus(message, isError = false) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = isError ? 'status error' : 'status';
}

function updateInfoPanel(data) {
    const now = new Date().toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = `Last Update: ${now}`;
    document.getElementById('updateCount').textContent = `Updates: ${++updateCount}`;
    
    if (data && data.latest && data.latest.data) {
        const csvData = data.latest.data;
        document.getElementById('dataDirectory').textContent = `Directory: ${data.latest.directory}`;
        document.getElementById('dataFile').textContent = `Current File: ${csvData.name || 'Unknown'}`;
        
        // Count data points and columns
        const columns = Object.keys(csvData).filter(key => Array.isArray(csvData[key]));
        const dataPoints = columns.length > 0 ? csvData[columns[0]].length : 0;
        
        document.getElementById('dataPoints').textContent = `Data Points: ${dataPoints}`;
        document.getElementById('plotColumns').textContent = `Columns: ${columns.join(', ')}`;
    }
}

function getColumnSubset(data, startIndex, endIndex) {
    const columns = Object.keys(data).filter(key => Array.isArray(data[key]));
    if (columns.length === 0) return {};
    
    // First column is typically time/x-axis
    const timeColumn = columns[0];
    const result = { [timeColumn]: data[timeColumn] };
    
    // Get subset of remaining columns
    const dataColumns = columns.slice(1);
    const start = Math.max(0, startIndex - 1); // Convert to 0-based index
    const end = Math.min(dataColumns.length, endIndex);
    
    for (let i = start; i < end; i++) {
        if (dataColumns[i]) {
            result[dataColumns[i]] = data[dataColumns[i]];
        }
    }
    
    return result;
}

function createPlot(data) {
    const startIndex = parseInt(document.getElementById('startIndex').value);
    const endIndex = parseInt(document.getElementById('endIndex').value);
    
    const plotData = getColumnSubset(data, startIndex, endIndex);
    const columns = Object.keys(plotData);
    
    if (columns.length < 2) {
        updateStatus('Not enough data columns to plot', true);
        return;
    }
    
    const timeColumn = columns[0];
    const dataColumns = columns.slice(1);
    
    const traces = dataColumns.map((col, index) => ({
        x: plotData[timeColumn],
        y: plotData[col],
        type: 'scatter',
        mode: 'lines+markers',
        name: col,
        line: { width: 2 },
        marker: { size: 4 }
    }));
    
    const layout = {
        title: {
            text: 'Real-time CSV Data Plot',
            font: { size: 18 }
        },
        xaxis: { 
            title: timeColumn,
            autorange: true,
            showgrid: true
        },
        yaxis: { 
            title: 'Values',
            autorange: true,
            showgrid: true
        },
        margin: { l: 60, r: 30, t: 60, b: 60 },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: 'white',
        showlegend: true,
        legend: {
            x: 1,
            y: 1,
            xanchor: 'auto',
            yanchor: 'auto'
        },
        uirevision: 'constant' // Prevents zoom reset on updates
    };
    
    if (plotInitialized) {
        Plotly.react('plot-container', traces, layout, config);
    } else {
        Plotly.newPlot('plot-container', traces, layout, config);
        plotInitialized = true;
    }
}

function fetchLatestData() {
    if (!isRunning) return;
    
    fetch('/data/latest')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            currentData = data;
            updateInfoPanel(data);
            
            if (data.latest && data.latest.data && !data.latest.data.error) {
                createPlot(data.latest.data);
                updateStatus('Connected - Real-time updates active');
            } else {
                const error = data.latest?.data?.error || 'No data available';
                updateStatus(error, true);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            updateStatus(`Connection error: ${error.message}`, true);
        })
        .finally(() => {
            if (isRunning) {
                setTimeout(fetchLatestData, updateInterval);
            }
        });
}

function togglePause() {
    isRunning = !isRunning;
    const btn = document.getElementById('pauseBtn');
    
    if (isRunning) {
        btn.textContent = 'Pause';
        updateStatus('Resuming real-time updates...');
        fetchLatestData();
    } else {
        btn.textContent = 'Resume';
        updateStatus('Updates paused');
    }
}

function forceRefresh() {
    if (currentData && currentData.latest && currentData.latest.data) {
        createPlot(currentData.latest.data);
        updateStatus('Plot refreshed');
    } else {
        fetchLatestData();
    }
}

// Event listeners
document.getElementById('updateInterval').addEventListener('change', (e) => {
    updateInterval = parseInt(e.target.value);
    updateStatus(`Update interval changed to ${updateInterval}ms`);
});

document.getElementById('startIndex').addEventListener('change', () => {
    if (currentData && currentData.latest && currentData.latest.data) {
        createPlot(currentData.latest.data);
    }
});

document.getElementById('endIndex').addEventListener('change', () => {
    if (currentData && currentData.latest && currentData.latest.data) {
        createPlot(currentData.latest.data);
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (plotInitialized) {
        Plotly.Plots.resize('plot-container');
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateStatus('Starting real-time data monitoring...');
    setTimeout(() => {
        fetchLatestData();
    }, 500); // Small delay to ensure server is ready
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause updates to save resources
        if (isRunning) {
            isRunning = false;
            updateStatus('Updates paused (tab hidden)');
        }
    } else {
        // Page is visible, resume updates
        if (!isRunning) {
            isRunning = true;
            updateStatus('Resuming updates (tab visible)...');
            fetchLatestData();
        }
    }
});