"""Plot Server."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
from time import time
from typing import List, Any

from hardware_testing.data import create_folder_for_test_data


class PlotRequestHandler(BaseHTTPRequestHandler):
    """Plot Request Handler."""

    @property
    def plot_directory(self) -> Path:
        """Plot directory."""
        return self.server.plot_directory  # type: ignore[attr-defined]

    @property
    def path_elements(self) -> List[str]:
        """Path elements."""
        return [el for el in self.path.split("/") if el]

    def _set_plot_directory(self, directory: Path) -> None:
        self.server.plot_directory = directory  # type: ignore[attr-defined]

    def _send_response_bytes(
        self, response: bytes, code: int = 200, content_type: str = "application/json"
    ) -> None:
        self.send_response(code)
        self.send_header("Content-type", content_type)
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
        print(file_path)
        with open(file_path, "rb") as f:
            file = f.read(-1)
        if ".html" in _file_name:
            c_type = "text/html"
        elif ".js" in _file_name:
            c_type = "text/javascript"
        elif ".png" in _file_name:
            c_type = "image/png"
        else:
            raise ValueError(f'Unexpected file type for file "{_file_name}"')
        self._send_response_bytes(file, content_type=c_type)

    def _list_file_paths_in_directory(
        self, directory: Path, includes: str = ""
    ) -> List[Path]:
        _ret: List[Path] = []
        for p in [Path(f) for f in directory.iterdir()]:
            if p.is_file() and includes in p.stem:
                _ret.append(p.absolute())  # found a file, get absolute path
            elif p.is_dir():
                # recursively look for files
                sub_dir_paths = self._list_file_paths_in_directory(p, includes)
                for sub_p in sub_dir_paths:
                    _ret.append(sub_p)
        # sort newest to oldest
        # NOTE: system time on machines in SZ will randomly switch to the wrong time
        #       so here we can sort relative to whatever the current system time is
        _ret.sort(key=lambda f: abs(time() - f.stat().st_mtime))
        return _ret

    def _respond_to_data_request(self) -> None:
        req_cmd = self.path_elements[1]
        if req_cmd != "latest":
            raise NotImplementedError(f"unable to process command: {req_cmd}")
        path_list_grav = self._list_file_paths_in_directory(
            self.plot_directory, "GravimetricRecorder"
        )
        path_list_pip = self._list_file_paths_in_directory(
            self.plot_directory, "CSVReport"
        )
        response_data = {
            "directory": str(self.plot_directory.resolve()),
            "files": [],
            "name": "",
            "csv": "",
            "csvPipette": "",
        }
        if path_list_grav:
            file_name_grav = path_list_grav[0]
            response_data["name"] = str(file_name_grav.stem)
            with open(file_name_grav, "r") as f:
                response_data["csv"] = f.read()
        if path_list_pip:
            file_name_pip = path_list_pip[0]
            with open(file_name_pip, "r") as f:
                response_data["csvPipette"] = f.read()
        response_str = json.dumps({req_cmd: response_data})
        self._send_response_bytes(response_str.encode("utf-8"))

    def _respond_to_new_name_request(self) -> None:
        if len(self.path_elements) == 1:
            response_str = json.dumps({"name": str(self.plot_directory.stem)})
        else:
            new_name = self.path_elements[1]
            dir_path = create_folder_for_test_data(new_name)
            self._set_plot_directory(dir_path)
            response_str = json.dumps({"name": new_name})
        self._send_response_bytes(response_str.encode("utf-8"))

    def do_GET(self) -> None:
        """Do GET."""
        try:
            if len(self.path_elements) > 1 and self.path_elements[0] == "data":
                self._respond_to_data_request()
            elif len(self.path_elements) > 0 and self.path_elements[0] == "name":
                self._respond_to_new_name_request()
            else:
                self._respond_to_frontend_file_request()
        except Exception as e:
            self._response_with_exception(e)


class PlotServer(HTTPServer):
    """Plot Server."""

    def __init__(self, directory: Path, *args: Any, **kwargs: Any) -> None:
        """Plot Server."""
        self.plot_directory = directory
        super().__init__(*args, **kwargs)


def run(test_name: str, http_port: int) -> None:
    """Run a Plot Server Instance."""
    dir_path = create_folder_for_test_data(test_name)
    server = PlotServer(dir_path, ("0.0.0.0", http_port), PlotRequestHandler)
    print(f"Plot server running on port: {http_port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
