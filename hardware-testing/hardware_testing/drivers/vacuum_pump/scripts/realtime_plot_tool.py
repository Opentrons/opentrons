import pandas as pd
from dash import Dash, dcc, html
from dash.dependencies import Input, Output
import plotly.graph_objs as go
import os
import webbrowser
from threading import Timer

CSV_PATH = "pump_test.csv"  # Path to your log file

app = Dash(__name__)
app.title = "Live Pressure Monitor"
refresh_interval = 500 # ms
app.layout = html.Div([
    html.H2("Real-time Pressure Data", style={"textAlign": "center"}),

    dcc.Graph(id="live-graph", style={"height": "80vh"}),

    dcc.Interval(
        id="update-interval",
        interval=refresh_interval,  # update every 0.5 seconds
        n_intervals=0
    ),

    html.Div(id="status", style={"textAlign": "center", "marginTop": "10px"})
])

@app.callback(Output('graphid', 'figure'),
              [Input(f'{refresh_interval}ms_intervals', 'n_intervals')])
def update_layout(n):
    # Probes
    # data= pd.read_csv(folder + HS_fname, skiprows=detail_rows)
    df = pd.read_csv(CSV_PATH)
    try:
        figure={
                'data': [
                    go.Scattergl(x=df['timestamp'], y=df['PA_FILTERED'], mode = 'lines+markers', name = 'PA FILTERED'),
                    go.Scattergl(x=df['timestamp'], y=df['PA_RAW'], mode = 'lines+markers', name = 'RAW'),
                ],
                'layout': {
                    'title': 'Vacuum Pressure RT',
                    'xaxis':{'title': 'Time(mins)','scaleanchor': 'x','autorange': True},
                    'yaxis': {'title': 'Pressure(mbar)', 'scaleanchor': 'y','autorange': True},
                    'uirevision': True
                }
            }   
    except Exception as e:
        figure = go.Figure()
        figure.update_layout(
            title="Waiting for data...",
            template="plotly_dark"
        )
        return figure, f"No data yet: {e}"
    return figure

if __name__ == "__main__":
    df = pd.read_csv(CSV_PATH)
    print(df)
    app.layout = html.Div([
        dcc.Graph(
            id='graphid',
            figure={
                    'data': [
                        go.Scattergl(x=df['timestamp'], y=df['PA_FILTERED'], mode = 'lines+markers', name = 'PA FILTERED'),
                        go.Scattergl(x=df['timestamp'], y=df['PA_RAW'], mode = 'lines+markers', name = 'RAW'),
                        go.Scattergl(x=df['timestamp'], y=df['PB_FILTERED'], mode = 'lines+markers', name = 'PB FILTERED'),
                        go.Scattergl(x=df['timestamp'], y=df['PB_RAW'], mode = 'lines+markers', name = 'PB RAW'),
                    ],
                    'layout': {
                        'title': 'Vacuum Pressure RT',
                        'xaxis':{'title': 'Time(mins)','scaleanchor': 'x','autorange': True},
                        'yaxis': {'title': 'Pressure(mbar)', 'scaleanchor': 'y','autorange': True},
                        'uirevision': True
                    }
        }
    ),
    dcc.Interval(
            id=f'{refresh_interval}ms_intervals',
            interval=refresh_interval,
            n_intervals=0
        ),

    ])

    # Auto-open default web browser to the Dash app once the server is up.
    host = "127.0.0.1"
    port = 8050

    def _open_browser() -> None:
        webbrowser.open_new(f"http://{host}:{port}")

    # Open browser shortly after server start. Disable reloader to avoid duplicate opens.
    Timer(1.0, _open_browser).start()

    app.run_server(debug=True, host=host, port=port, use_reloader=False)

