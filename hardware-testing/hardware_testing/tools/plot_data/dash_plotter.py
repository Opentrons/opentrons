import dash
from dash import dcc, html, Input, Output, callback
import plotly.graph_objects as go
import pandas as pd
import argparse
import os
import signal
import time
from pathlib import Path
from typing import List, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from dash import ctx


def create_html(figure, f_name):
    dir = Path.cwd()
    # Remove leading slash if present and ensure proper path construction
    f_name = f_name.lstrip("/")
    html_path = dir / (f_name + ".html")
    figure.write_html(html_path)
    print(f"Saved html as {f_name}.html")


class CSVFileHandler(FileSystemEventHandler):
    """Monitor CSV file changes"""

    def __init__(self):
        self.last_modified = {}
        self.data_updated = False

    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(".csv"):
            current_time = time.time()
            # Debounce - only update if file hasn't been modified in last 0.5 seconds
            if (
                event.src_path not in self.last_modified
                or current_time - self.last_modified[event.src_path] > 0.5
            ):
                self.last_modified[event.src_path] = current_time
                self.data_updated = True
                print(f"CSV file updated: {Path(event.src_path).name}")


class RealTimePlotter:
    def __init__(self, data_path: str = None):
        self.data_path = Path(data_path).resolve() if data_path else Path.cwd()
        self.file_handler = CSVFileHandler()
        self.observer = Observer()
        self.observer.schedule(self.file_handler, str(self.data_path), recursive=False)

        # Start file monitoring
        self.observer.start()
        print(f"Monitoring directory: {self.data_path.resolve()}")
        found = list(self.data_path.glob("*.csv"))
        print(f"Found {len(found)} CSV file(s): {[f.name for f in found]}")

        # Initialize Dash app
        self.app = dash.Dash(__name__)
        self.setup_layout()
        self.setup_callbacks()
        self.figure = None

    def find_column_name(self, dataframe) -> List:
        """Get column names from dataframe"""
        return list(dataframe.columns)

    def get_csv_files(self) -> List[Path]:
        """Return all CSV files in data_path sorted by modification time (newest first)"""
        csv_files = list(self.data_path.glob("*.csv"))
        csv_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        return csv_files

    def read_csv_files(self, filenames: List[str]) -> dict:
        """Read multiple CSV files, return dict of filename -> DataFrame"""
        results = {}
        for filename in filenames:
            target = self.data_path / filename
            try:
                results[filename] = pd.read_csv(
                    target, header=0
                )  # Ensure the first row is treated as headers
            except Exception as e:
                print(f"Error reading {filename}: {e}")
        return results

    def setup_layout(self):
        """Setup the Dash app layout"""
        self.app.layout = html.Div(
            [
                html.H1(
                    "Real-time CSV Data Plotter",
                    style={"textAlign": "center", "marginBottom": 30},
                ),
                # File Selector
                html.Div(
                    [
                        html.Div(
                            [
                                html.H3(
                                    "Files",
                                    style={
                                        "marginBottom": 10,
                                        "display": "inline-block",
                                    },
                                ),
                                html.Button(
                                    "Select All",
                                    id="select-all-btn",
                                    n_clicks=0,
                                    style={
                                        "marginLeft": 20,
                                        "padding": "4px 12px",
                                        "cursor": "pointer",
                                    },
                                ),
                                html.Button(
                                    "Clear",
                                    id="clear-btn",
                                    n_clicks=0,
                                    style={
                                        "marginLeft": 10,
                                        "padding": "4px 12px",
                                        "cursor": "pointer",
                                    },
                                ),
                                html.Button(
                                    "Plot",
                                    id="plot-btn",
                                    n_clicks=0,
                                    style={
                                        "marginLeft": 20,
                                        "padding": "4px 14px",
                                        "cursor": "pointer",
                                        "backgroundColor": "#4CAF50",
                                        "color": "white",
                                        "border": "none",
                                        "borderRadius": "4px",
                                        "fontWeight": "bold",
                                    },
                                ),
                            ]
                        ),
                        dcc.Dropdown(
                            id="file-selector",
                            placeholder="Select one or more CSV files...",
                            multi=True,
                            style={"width": "100%"},
                        ),
                    ],
                    style={
                        "backgroundColor": "#f0f4ff",
                        "padding": 20,
                        "borderRadius": 5,
                        "marginBottom": 20,
                    },
                ),
                # Control Panel
                html.Div(
                    [
                        html.H3("Controls", style={"marginBottom": 20}),
                        html.Div(
                            [
                                html.Div(
                                    [
                                        html.Label(
                                            "Start Column Index:",
                                            style={"fontWeight": "bold"},
                                        ),
                                        dcc.Input(
                                            id="start-index",
                                            type="number",
                                            value=1,
                                            min=1,
                                            style={"width": "100px", "marginLeft": 10},
                                        ),
                                    ],
                                    style={
                                        "display": "inline-block",
                                        "marginRight": 30,
                                    },
                                ),
                                html.Div(
                                    [
                                        html.Label(
                                            "End Column Index:",
                                            style={"fontWeight": "bold"},
                                        ),
                                        dcc.Input(
                                            id="end-index",
                                            type="number",
                                            value=5,
                                            min=1,
                                            style={"width": "100px", "marginLeft": 10},
                                        ),
                                    ],
                                    style={
                                        "display": "inline-block",
                                        "marginRight": 30,
                                    },
                                ),
                                html.Div(
                                    [
                                        html.Label(
                                            "Update Interval (ms):",
                                            style={"fontWeight": "bold"},
                                        ),
                                        dcc.Dropdown(
                                            id="update-interval",
                                            options=[
                                                {"label": "Fast (100ms)", "value": 100},
                                                {
                                                    "label": "Normal (500ms)",
                                                    "value": 500,
                                                },
                                                {"label": "Slow (1s)", "value": 1000},
                                                {
                                                    "label": "Very Slow (2s)",
                                                    "value": 2000,
                                                },
                                            ],
                                            value=500,
                                            style={"width": "150px", "marginLeft": 10},
                                        ),
                                    ],
                                    style={"display": "inline-block"},
                                ),
                            ],
                            style={"marginBottom": 20},
                        ),
                    ],
                    style={
                        "backgroundColor": "#f8f9fa",
                        "padding": 20,
                        "borderRadius": 5,
                        "marginBottom": 20,
                    },
                ),
                # Status Panel
                html.Div(
                    [
                        html.H4("Status", style={"marginBottom": 15}),
                        html.Div(id="status-info", style={"marginBottom": 10}),
                        html.Div(id="file-info", style={"marginBottom": 10}),
                        html.Div(id="data-info"),
                    ],
                    style={
                        "backgroundColor": "#e8f5e8",
                        "padding": 20,
                        "borderRadius": 5,
                        "marginBottom": 20,
                    },
                ),
                # Plot
                dcc.Graph(id="live-plot", style={"height": "600px"}),
                # Auto-refresh component
                dcc.Interval(
                    id="interval-component",
                    interval=500,  # in milliseconds
                    n_intervals=0,
                ),
            ],
            style={"margin": "20px"},
        )

    def setup_callbacks(self):
        """Setup Dash callbacks"""

        @self.app.callback(
            Output("file-selector", "options"),
            Output("file-selector", "value"),
            Input("interval-component", "n_intervals"),
            Input("select-all-btn", "n_clicks"),
            Input("clear-btn", "n_clicks"),
        )
        def refresh_file_list(n, select_all, clear):
            files = self.get_csv_files()
            options = [{"label": f.name, "value": f.name} for f in files]
            trigger = ctx.triggered_id
            if trigger == "select-all-btn":
                return options, [f.name for f in files]
            if trigger == "clear-btn":
                return options, []
            return options, dash.no_update

        @self.app.callback(
            Output("interval-component", "interval"), Input("update-interval", "value")
        )
        def update_interval(selected_interval):
            return selected_interval or 500

        @self.app.callback(
            [
                Output("live-plot", "figure"),
                Output("status-info", "children"),
                Output("file-info", "children"),
                Output("data-info", "children"),
            ],
            [Input("plot-btn", "n_clicks"), Input("file-selector", "value")],
            [
                dash.dependencies.State("start-index", "value"),
                dash.dependencies.State("end-index", "value"),
            ],
        )
        def update_plot(n_clicks, selected_files, start_idx, end_idx):
            csv_files = self.get_csv_files()

            # Default to most recent file if nothing selected
            if not selected_files:
                if not csv_files:
                    empty_fig = go.Figure()
                    empty_fig.update_layout(
                        title="No Data Available",
                        xaxis_title="Time(s)",
                        yaxis_title="Values",
                    )
                    return (
                        empty_fig,
                        f"Status: No CSV files found in {self.data_path}",
                        "Current File: None",
                        "Data Points: 0",
                    )
                selected_files = [csv_files[0].name]
            dataframes = self.read_csv_files(selected_files)

            if not dataframes:
                empty_fig = go.Figure()
                empty_fig.update_layout(
                    title="No Data Available",
                    xaxis_title="Time(s)",
                    yaxis_title="Values",
                )
                return (
                    empty_fig,
                    "Status: No readable files",
                    "Current File: None",
                    "Data Points: 0",
                )

            colors = [
                "#1f77b4",
                "#ff7f0e",
                "#2ca02c",
                "#d62728",
                "#9467bd",
                "#8c564b",
                "#e377c2",
                "#7f7f7f",
                "#bcbd22",
                "#17becf",
            ]

            fig = go.Figure()
            total_points = 0
            color_idx = 0

            for filename, df in dataframes.items():
                if df is None or df.empty:
                    continue
                columns = list(df.columns)
                time_column = columns[0]
                s_idx = max(1, start_idx or 1)
                e_idx = min(len(columns) - 1, end_idx or len(columns) - 1)
                data_columns = columns[s_idx : e_idx + 1]
                label_prefix = Path(filename).stem if len(dataframes) > 1 else ""
                is_flowrate = filename.startswith("FlowrateData")

                for col in data_columns:
                    if col in df.columns:
                        label = f"{label_prefix} - {col}" if label_prefix else col
                        fig.add_trace(
                            go.Scatter(
                                x=df[time_column],
                                y=df[col],
                                mode="lines",
                                name=label,
                                line=dict(
                                    color=colors[color_idx % len(colors)], width=1.5
                                ),
                                yaxis="y2" if is_flowrate else "y1",
                            )
                        )
                        color_idx += 1
                total_points += len(df)

            fig.update_layout(
                title=f"CSV Data Plot — {len(dataframes)} file(s), Columns {start_idx} to {end_idx}",
                xaxis_title="Time(s)",
                yaxis=dict(title="Pressure", side="left"),
                yaxis2=dict(
                    title="Flow Rate", side="right", overlaying="y", showgrid=False
                ),
                hovermode="x unified",
                showlegend=True,
                height=600,
                margin=dict(l=60, r=80, t=80, b=60),
            )

            current_time = time.strftime("%H:%M:%S")
            status_info = f"Status: Connected | Last Update: {current_time} | Dir: {self.data_path}"
            file_info = (
                f"Plotting {len(dataframes)} file(s): {', '.join(selected_files)}"
            )
            data_info = f"Total Data Points: {total_points}"
            self.figure = fig
            return fig, status_info, file_info, data_info

    def run(self, debug=False, port=8050):
        """Run the Dash server"""
        try:
            print(f"Starting Dash server on http://localhost:{port}")
            self.app.run(debug=debug, host="0.0.0.0", port=port, use_reloader=False)
        except KeyboardInterrupt:
            print("\nShutting down...")
            create_html(self.figure, "DataPlot")
        finally:
            self.observer.stop()
            self.observer.join()
            os.kill(os.getpid(), signal.SIGTERM)
            create_html(self.figure, "DataPlot")
