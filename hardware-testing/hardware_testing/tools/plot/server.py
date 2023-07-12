"""Plot Server."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
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

    def _list_files_in_directory(self, includes: str = "") -> List[Path]:
        _file_list = [
            Path(f).resolve() for f in self.plot_directory.iterdir() if f.is_file()
        ]
        if includes:
            _file_list = [f for f in _file_list if includes in f.stem]
        _file_list.sort(key=lambda f: f.stat().st_mtime)
        _file_list.reverse()
        return _file_list

    def _get_file_name_list(self, substring: str = "") -> List[str]:
        return [f.stem for f in self._list_files_in_directory(substring)]

    def _get_file_contents(self, file_name: str) -> str:
        req_file_name = f"{file_name}.csv"
        req_file_path = self.plot_directory / req_file_name
        with open(req_file_path.resolve(), "r") as f:
            return f.read()

    def _respond_to_data_request(self) -> None:
        req_cmd = self.path_elements[1]
        response_data = {
            "directory": str(self.plot_directory.resolve()),
            "files": [],
            "name": None,
            "csv": None,
            "csvPipette": None,
        }
        _grav_name = "GravimetricRecorder"
        _pip_name = "PipetteLiquidClass"
        if req_cmd == "list":
            f = self._get_file_name_list(_grav_name)  # type: ignore[assignment]
            response_data["files"] = f
        else:
            file_name_grav = ""
            file_name_pip = ""
            if req_cmd == "latest":
                file_list_grav = self._get_file_name_list(_grav_name)
                file_list_pip = self._get_file_name_list(_pip_name)
                if file_list_grav:
                    file_name_grav = file_list_grav[0]
                if file_list_pip:
                    file_name_pip = file_list_pip[0]
            else:
                raise ValueError(f"Unable to find response for request: {self.path}")
            response_data["name"] = file_name_grav
            response_data["csv"] = (
                self._get_file_contents(file_name_grav) if file_name_grav else ""
            )
            response_data["csvPipette"] = ""
            if file_name_pip:
                response_data["csvPipette"] = (
                    self._get_file_contents(file_name_pip) if file_name_pip else ""
                )
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
