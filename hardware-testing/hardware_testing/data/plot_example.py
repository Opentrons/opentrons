import random

from dash import Dash
from dash.dependencies import Output, Input
from dash_core_components import Graph, Interval
from dash_html_components import Div

from plotly.graph_objs import Layout, Scatter


X = [0]
Y = [57]

app = Dash(__name__)


@app.callback(
    Output('live-graph', 'figure'),
    [Input('graph-update', 'n_intervals')]
)
def update_graph_scatter(n):
    # TODO: read in CSV file here
    X.append(X[-1] + 1)
    Y.append(random.uniform(57.00001, 57.00101))
    x_min_max = [min(X), max(X)]
    y_min_max = [min(Y), max(Y)]
    return {
        'data': [Scatter(x=list(X), y=list(Y), mode='lines+markers')],
        'layout': Layout(xaxis={'range': x_min_max}, yaxis={'range': y_min_max})
    }


if __name__ == '__main__':
    app.layout = Div(
        [
            Graph(id='live-graph'),
            Interval(id='graph-update', interval=100, n_intervals=0),
        ]
    )
    app.run_server()
