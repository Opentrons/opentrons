import plotly.graph_objects as go
import pandas as pd
import argparse
import os
import json
import time
from pathlib import Path
from typing import List, Optional
from http.server import BaseHTTPRequestHandler, HTTPServer

def create_html(figure, f_name):
    dir = Path.cwd()
    # Remove leading slash if present and ensure proper path construction
    f_name = f_name.lstrip('/')
    html_path = dir / (f_name + '.html')
    figure.write_html(html_path)
    print(f'Saved html as {f_name}.html')

class PlotRequestHandler(BaseHTTPRequestHandler):
    """Plot Request Handler for real-time updates."""

    @property
    def plot_directory(self) -> Path:
        """Plot directory."""
        return self.server.plot_directory  # type: ignore[attr-defined]

    @property 
    def path_elements(self) -> List[str]:
        """Path elements."""
        return [el for el in self.path.split("/") if el]

    def _send_response_bytes(
        self, response: bytes, code: int = 200, content_type: str = "application/json"
    ) -> None:
        self.send_response(code)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")  # Enable CORS
        self.end_headers()
        self.wfile.write(response)

    def _response_with_exception(self, exception: Exception) -> None:
        res_str = json.dumps({"error": str(exception)})
        self._send_response_bytes(res_str.encode("utf-8"), code=404)

    def _respond_to_frontend_file_request(self) -> None:
        if not self.path_elements:
            _file_name = "index.html"
        else:
            _file_name = self.path_elements[-1]
        file_path = Path(__file__).parent / _file_name
        
        try:
            with open(file_path, "rb") as f:
                file = f.read(-1)
            if ".html" in _file_name:
                c_type = "text/html"
            elif ".js" in _file_name:
                c_type = "text/javascript"
            elif ".css" in _file_name:
                c_type = "text/css"
            else:
                c_type = "application/octet-stream"
            self._send_response_bytes(file, content_type=c_type)
        except FileNotFoundError:
            self._response_with_exception(FileNotFoundError(f"File {_file_name} not found"))

    def _list_file_paths_in_directory(self, directory: Path, extension: str = ".csv") -> List[Path]:
        """List CSV files in directory, sorted by modification time (newest first)."""
        files = list(directory.glob(f"*{extension}"))
        files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        return files

    def _parse_csv_file(self, file_path: Path) -> dict:
        """Parse a CSV file and return a dict with column arrays."""
        result = {"name": str(file_path.stem)}
        try:
            df = pd.read_csv(file_path)
            for col in df.columns:
                result[col] = df[col].tolist()
        except Exception as e:
            result["error"] = str(e)
        return result

    def _respond_to_data_request(self) -> None:
        """Respond with latest CSV data for plotting."""
        req_cmd = self.path_elements[1] if len(self.path_elements) > 1 else "latest"
        
        if req_cmd != "latest":
            raise NotImplementedError(f"unable to process command: {req_cmd}")

        response_data = {
            "directory": str(self.plot_directory.resolve()),
            "timestamp": time.time()
        }

        # Find the most recent CSV file
        csv_files = self._list_file_paths_in_directory(self.plot_directory)
        if csv_files:
            latest_file = csv_files[0]  # Most recent file
            response_data["data"] = self._parse_csv_file(latest_file)
        else:
            response_data["data"] = {"name": "", "error": "No CSV files found"}

        response_str = json.dumps({req_cmd: response_data})
        self._send_response_bytes(response_str.encode("utf-8"))

    def do_GET(self) -> None:
        """Handle GET requests."""
        try:
            if len(self.path_elements) > 0 and self.path_elements[0] == "data":
                self._respond_to_data_request()
            else:
                self._respond_to_frontend_file_request()
        except Exception as e:
            print(f"Error handling request: {e}")
            self._response_with_exception(e)

class PlotServer(HTTPServer):
    """Plot Server."""

    def __init__(self, directory: Path, *args, **kwargs) -> None:
        """Initialize Plot Server."""
        self.plot_directory = directory
        super().__init__(*args, **kwargs)

def run_server(data_path: str, port: int = 8080) -> None:
    """Run the real-time plot server."""
    directory = Path(data_path)
    if not directory.exists():
        directory.mkdir(parents=True, exist_ok=True)
    
    server = PlotServer(directory, ("", port), PlotRequestHandler)
    print(f"Plot server running on http://localhost:{port}")
    print(f"Monitoring directory: {directory.resolve()}")
    print("Press Ctrl+C to stop the server")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        server.server_close()

def find_column_name(dataframe)->List:
    header = dataframe.head(0)
    data_names = []
    for name in header:
        data_names.append(name)
    return data_names

def read_csv_files(path:str)-> List:
    files = Path(path).glob('*.csv')
    df_list = [pd.read_csv(f) for f in files]
    return df_list

def graph_curves(dataframes: list[pd.DataFrame])-> None:
    fig = go.Figure()
    for df in dataframes:
        header = find_column_name(df)
        for x in header[args.s_index:args.e_index+1]:
            fig.add_trace(go.Scatter(x=df[header[0]], y=df[x],
                        mode='lines+markers',
                        name=x))
            
        
    title_name = header[2] + ' ' + 'vs' + ' ' + 'Time'
    fig.update_layout(title=title_name,
                   xaxis_title=args.x_title,
                   yaxis_title=args.y_title)

    fig.show()
    return fig

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Real-time CSV data plotting server")
    parser.add_argument("--mode", type=str, choices=["static", "server"], default="static", 
                       help="Mode: 'static' for one-time plot, 'server' for real-time updates")
    parser.add_argument("--x_title", type=str, default="Time(s)", help="Names the X axis title")
    parser.add_argument("--y_title", type=str, default="Pressure(mbar)", help="Names the Y axis title")
    parser.add_argument("--s_index", type=int, default=1, help="starting index")
    parser.add_argument("--e_index", type=int, default=5, help="ending index")
    parser.add_argument("--path", type=str, default=os.getcwd(), help="Add csv folder path")
    parser.add_argument("--port", type=int, default=8080, help="Server port (server mode only)")
    args = parser.parse_args()
    
    if args.mode == "server":
        # Run real-time server mode
        run_server(args.path, args.port)
    else:
        # Run static plotting mode (original behavior)
        dfs = read_csv_files(args.path)
        if dfs:
            figure = graph_curves(dfs)
            create_html(figure, 'example')
        else:
            print("No CSV files found in the specified path.")