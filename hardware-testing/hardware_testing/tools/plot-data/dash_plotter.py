import dash
from dash import dcc, html, Input, Output, callback
import plotly.graph_objects as go
import pandas as pd
import argparse
import os
import time
import threading
from pathlib import Path
from typing import List, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class CSVFileHandler(FileSystemEventHandler):
    """Monitor CSV file changes"""
    def __init__(self):
        self.last_modified = {}
        self.data_updated = False
    
    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.csv'):
            current_time = time.time()
            # Debounce - only update if file hasn't been modified in last 0.5 seconds
            if (event.src_path not in self.last_modified or 
                current_time - self.last_modified[event.src_path] > 0.5):
                self.last_modified[event.src_path] = current_time
                self.data_updated = True
                print(f"CSV file updated: {Path(event.src_path).name}")

class RealTimePlotter:
    def __init__(self, data_path: str = None):
        self.data_path = Path(data_path) if data_path else Path.cwd()
        self.file_handler = CSVFileHandler()
        self.observer = Observer()
        self.observer.schedule(self.file_handler, str(self.data_path), recursive=False)
        
        # Start file monitoring
        self.observer.start()
        print(f"Monitoring directory: {self.data_path.resolve()}")
        
        # Initialize Dash app
        self.app = dash.Dash(__name__)
        self.setup_layout()
        self.setup_callbacks()
    
    def find_column_name(self, dataframe) -> List:
        """Get column names from dataframe"""
        return list(dataframe.columns)
    
    def read_latest_csv(self) -> Optional[pd.DataFrame]:
        """Read the most recently modified CSV file"""
        csv_files = list(self.data_path.glob('*.csv'))
        if not csv_files:
            return None
        
        # Sort by modification time, most recent first
        csv_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        latest_file = csv_files[0]
        
        try:
            return pd.read_csv(latest_file)
        except Exception as e:
            print(f"Error reading {latest_file}: {e}")
            return None
    
    def setup_layout(self):
        """Setup the Dash app layout"""
        self.app.layout = html.Div([
            html.H1("Real-time CSV Data Plotter", 
                   style={'textAlign': 'center', 'marginBottom': 30}),
            
            # Control Panel
            html.Div([
                html.H3("Controls", style={'marginBottom': 20}),
                
                html.Div([
                    html.Div([
                        html.Label("Start Column Index:", style={'fontWeight': 'bold'}),
                        dcc.Input(
                            id='start-index',
                            type='number',
                            value=1,
                            min=1,
                            style={'width': '100px', 'marginLeft': 10}
                        )
                    ], style={'display': 'inline-block', 'marginRight': 30}),
                    
                    html.Div([
                        html.Label("End Column Index:", style={'fontWeight': 'bold'}),
                        dcc.Input(
                            id='end-index',
                            type='number',
                            value=5,
                            min=1,
                            style={'width': '100px', 'marginLeft': 10}
                        )
                    ], style={'display': 'inline-block', 'marginRight': 30}),
                    
                    html.Div([
                        html.Label("Update Interval (ms):", style={'fontWeight': 'bold'}),
                        dcc.Dropdown(
                            id='update-interval',
                            options=[
                                {'label': 'Fast (100ms)', 'value': 100},
                                {'label': 'Normal (500ms)', 'value': 500},
                                {'label': 'Slow (1s)', 'value': 1000},
                                {'label': 'Very Slow (2s)', 'value': 2000}
                            ],
                            value=500,
                            style={'width': '150px', 'marginLeft': 10}
                        )
                    ], style={'display': 'inline-block'})
                ], style={'marginBottom': 20})
            ], style={
                'backgroundColor': '#f8f9fa', 
                'padding': 20, 
                'borderRadius': 5,
                'marginBottom': 20
            }),
            
            # Status Panel  
            html.Div([
                html.H4("Status", style={'marginBottom': 15}),
                html.Div(id='status-info', style={'marginBottom': 10}),
                html.Div(id='file-info', style={'marginBottom': 10}),
                html.Div(id='data-info')
            ], style={
                'backgroundColor': '#e8f5e8',
                'padding': 20,
                'borderRadius': 5,
                'marginBottom': 20
            }),
            
            # Plot
            dcc.Graph(id='live-plot', style={'height': '600px'}),
            
            # Auto-refresh component
            dcc.Interval(
                id='interval-component',
                interval=500,  # in milliseconds
                n_intervals=0
            )
        ], style={'margin': '20px'})
    
    def setup_callbacks(self):
        """Setup Dash callbacks"""
        
        @self.app.callback(
            Output('interval-component', 'interval'),
            Input('update-interval', 'value')
        )
        def update_interval(selected_interval):
            return selected_interval or 500
        
        @self.app.callback(
            [Output('live-plot', 'figure'),
             Output('status-info', 'children'),
             Output('file-info', 'children'), 
             Output('data-info', 'children')],
            [Input('interval-component', 'n_intervals'),
             Input('start-index', 'value'),
             Input('end-index', 'value')]
        )
        def update_plot(n, start_idx, end_idx):
            # Read latest data
            df = self.read_latest_csv()
            
            if df is None or df.empty:
                empty_fig = go.Figure()
                empty_fig.update_layout(
                    title="No Data Available",
                    xaxis_title="Time",
                    yaxis_title="Values"
                )
                return (
                    empty_fig,
                    f"Status: No CSV files found in {self.data_path.name}",
                    "Current File: None",
                    "Data Points: 0 | Columns: 0"
                )
            
            # Get column information
            columns = self.find_column_name(df)
            time_column = columns[0]  # Assume first column is time/x-axis
            
            # Get subset of columns based on indices
            start_idx = max(1, start_idx or 1)
            end_idx = min(len(columns) - 1, end_idx or len(columns) - 1)
            
            data_columns = columns[start_idx:end_idx + 1]
            
            # Create plot
            fig = go.Figure()
            
            colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
                     '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
            
            for i, col in enumerate(data_columns):
                if col in df.columns:
                    fig.add_trace(go.Scatter(
                        x=df[time_column],
                        y=df[col],
                        mode='lines+markers',
                        name=col,
                        line=dict(color=colors[i % len(colors)], width=2),
                        marker=dict(size=4)
                    ))
            
            # Update layout
            fig.update_layout(
                title=f"Real-time CSV Data Plot - Columns {start_idx} to {end_idx}",
                xaxis_title=time_column,
                yaxis_title="Values",
                hovermode='x unified',
                showlegend=True,
                height=600,
                margin=dict(l=60, r=30, t=80, b=60)
            )
            
            # Status information
            current_time = time.strftime("%H:%M:%S")
            csv_files = list(self.data_path.glob('*.csv'))
            latest_file = max(csv_files, key=lambda f: f.stat().st_mtime) if csv_files else None
            
            status_info = f"Status: Connected | Last Update: {current_time} | Update #{n}"
            file_info = f"Current File: {latest_file.name if latest_file else 'None'}"
            data_info = f"Data Points: {len(df)} | Columns: {', '.join(columns)}"
            
            return fig, status_info, file_info, data_info
    
    def run(self, debug=False, port=8050):
        """Run the Dash server"""
        try:
            print(f"Starting Dash server on http://localhost:{port}")
            self.app.run(debug=debug, host='0.0.0.0', port=port)
        except KeyboardInterrupt:
            print("\nShutting down...")
        finally:
            self.observer.stop()
            self.observer.join()

def main():
    parser = argparse.ArgumentParser(description="Real-time CSV plotter using Dash")
    parser.add_argument("--path", type=str, default=os.getcwd(), 
                       help="Directory to monitor for CSV files")
    parser.add_argument("--port", type=int, default=8050, 
                       help="Port for the web server")
    parser.add_argument("--debug", action="store_true", 
                       help="Run in debug mode")
    
    args = parser.parse_args()
    
    plotter = RealTimePlotter(args.path)
    plotter.run(debug=args.debug, port=args.port)

if __name__ == "__main__":
    main()