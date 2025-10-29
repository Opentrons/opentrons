import pandas as pd
from dash import Dash, dcc, html
from dash.dependencies import Input, Output
import plotly.graph_objs as go
import os
import webbrowser
from threading import Timer
import argparse

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
    try:
        df = pd.read_csv(options.file_name)
        value_cols = [c for c in df.columns if c.endswith("_FILTERED") or c.endswith("_RAW")]
        figure={
                'data': [
                        go.Scattergl(
                            x=df["timestamp"],
                            y=df[c],
                            mode="lines+markers",
                            name=c.replace("_", " "),

                                    )
                        for c in value_cols
                        if c in df.columns
                ],
                'layout': {
                    'title': {'text': 'Vacuum Pressure RT'},
                    'xaxis': {'title': {'text': 'Time (mins)'}, 'autorange': True},
                    'yaxis': {'title': {'text': 'Pressure (mbar)'}, 'autorange': True},
                    'uirevision': 'static'
                }
            }   
    except Exception as e:
        figure = go.Figure()
        figure.update_layout(
            title="Waiting for data...",
            template="plotly_dark"
        )
        return figure
    return figure


def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Realtime Test Script")
    arg_parser.add_argument("-file_name", "--file_name", default = "test.csv", type = str, help = "File name to stream")
    return arg_parser

if __name__ == "__main__":
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    df = pd.read_csv(options.file_name)
    headers = pd.read_csv(options.file_name).columns.tolist()
    print(df)
    value_cols = [c for c in df.columns if c.endswith("_FILTERED") or c.endswith("_RAW")]
    app.layout = html.Div([
        dcc.Graph(
            id='graphid',
            figure={
                    'data': [
                        go.Scattergl(
                            x=df["timestamp"],
                            y=df[c],
                            mode="lines+markers",
                            name=c.replace("_", " "),

                                     )
                        for c in value_cols
                        if c in df.columns
                    ],
                    'layout': {
                        'title': {'text': 'Vacuum Pressure RT'},
                        'xaxis': {'title': {'text': 'Time (mins)'}, 'autorange': True},
                        'yaxis': {'title': {'text': 'Pressure (mbar)'}, 'autorange': True},
                        'uirevision': 'static'
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

