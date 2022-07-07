import os

from dash import Dash
from dash.dependencies import Output, Input
from dash_core_components import Graph, Interval
from dash_html_components import Div

from plotly.graph_objs import Layout, Scatter

from hardware_testing.gravimetric import GravimetricRecording


app = Dash(__name__)
GRAPH_ID = 'live-graph'
UPDATE_ID = 'graph-update'
UPDATE_INTERVAL_MS = 500

USER_PATH = 'C:/Users/andy/.opentrons/testing_data/example-test'


def _find_newest_file_in_directory(directory: str) -> str:
    file_paths = [
        os.path.join(directory, f)
        for f in os.listdir(directory)
        if f.endswith('.csv')
    ]
    assert len(file_paths) > 0, \
        f'No CSV files found in directory: \"{directory}\"'
    files_with_mod_time = [
        (f, os.path.getmtime(f))
        for f in file_paths
    ]
    files_with_mod_time.sort(key=lambda f: f[-1])
    latest_file = files_with_mod_time[-1][0]
    assert os.path.isfile(latest_file), \
        f'The latest file found is not a file: \"{latest_file}\"'
    return latest_file


@app.callback(
    Output(GRAPH_ID, 'figure'),
    [Input(UPDATE_ID, 'n_intervals')]
)
def update_graph_scatter(n):
    if os.path.isdir(USER_PATH):
        file_path = _find_newest_file_in_directory(USER_PATH)
    else:
        file_path = str(USER_PATH)
    recording = GravimetricRecording.load(file_path)
    x_min_max = [0, recording.duration]
    y_min_max = [min(recording.grams_as_list), max(recording.grams_as_list)]
    graph_x = [s.relative_time(recording.start_time) for s in recording]
    graph_y_stable = [s.grams if s.stable else None for s in recording]
    graph_y_unstable = [s.grams if not s.stable else None for s in recording]
    return {
        'data': [
            Scatter(x=graph_x, y=graph_y_stable, mode='lines+markers',
                    line={'color': 'blue'}, name='stable'),
            Scatter(x=graph_x, y=graph_y_unstable, mode='lines+markers',
                    line={'color': 'red'}, name='unstable'),
        ],
        'layout': Layout(width=1700, height=800, xaxis={'range': x_min_max}, yaxis={'range': y_min_max})
    }


if __name__ == '__main__':
    app.layout = Div(
        [
            Graph(id=GRAPH_ID),
            Interval(id=UPDATE_ID, interval=UPDATE_INTERVAL_MS, n_intervals=0),
        ]
    )
    app.run_server()
