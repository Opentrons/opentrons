"""Plot Server."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
from time import time
from typing import List, Any, Union
import os
import sys

# from hardware_testing.data import create_folder_for_test_data

IS_WIN = sys.platform.startswith("win")
IS_OSX = sys.platform == "darwin"
IS_LINUX = sys.platform.startswith("linux")

_CONFIG_FILENAME = "config.json"
IS_ROBOT = bool(
    IS_LINUX
    and (os.environ.get("RUNNING_ON_PI") or os.environ.get("RUNNING_ON_VERDIN"))
)


def infer_config_base_dir() -> Path:
    """Return the directory to store data in.

    Defaults are ~/.opentrons if not on a pi; OT_API_CONFIG_DIR is
    respected here.

    When this module is imported, this function is called automatically
    and the result stored in :py:attr:`APP_DATA_DIR`.

    This directory may not exist when the module is imported. Even if it
    does exist, it may not contain data, or may require data to be moved
    to it.

    :return pathlib.Path: The path to the desired root settings dir.
    """
    if "OT_API_CONFIG_DIR" in os.environ:
        return Path(os.environ["OT_API_CONFIG_DIR"])
    elif IS_ROBOT:
        return Path("/data")
    else:
        search = (Path.cwd(), Path.home() / ".opentrons")
        # print(search)
        for path in search:
            if (path / _CONFIG_FILENAME).exists():
                return path
        else:
            return search[-1]


def get_testing_data_directory() -> Path:
    """Get testing_data directory."""
    if "TESTING_DATA_DIR" in os.environ:
        return Path(os.environ["TESTING_DATA_DIR"])
    print(infer_config_base_dir())
    return infer_config_base_dir() 


def _initialize_testing_data_base_dir() -> Path:
    base = get_testing_data_directory()
    base.mkdir(parents=True, exist_ok=True)
    return base


def create_test_name_from_file(f: str) -> str:
    """Create test name from file name."""
    return os.path.basename(f).replace("_", "-").replace(".py", "")


def create_folder_for_test_data(test_name: Union[str, Path]) -> Path:
    """Create a folder for test data."""
    base = _initialize_testing_data_base_dir()
    test_path = base / test_name
    test_path.mkdir(parents=False, exist_ok=True)
    return test_path


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
        # print(f'file_path: {file_path}')
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

    def _parse_csv_file(self, file_path: Path) -> dict:
        """Parse a CSV file and return a dict with column arrays."""
        result: dict = {"name": str(file_path.stem)}
        with open(file_path, "r") as f:
            csv_data = f.readlines()
        if not csv_data:
            return result
        header = csv_data[0].strip().split(",")
        for col in header:
            result[col] = []
        for line in csv_data[1:]:
            if line.strip():
                values = line.strip().split(",")
                for i, col in enumerate(header):
                    if i < len(values):
                        try:
                            result[col].append(float(values[i]))
                        except ValueError:
                            result[col].append(values[i])
        return result

    def _respond_to_data_request(self) -> None:
        req_cmd = self.path_elements[1]
        if req_cmd != "latest":
            raise NotImplementedError(f"unable to process command: {req_cmd}")

        # File patterns to search for - each becomes a key in the response
        # ---------------------Add file names that needs to be search----------------------------------
        file_patterns = ["PressureData", "FlowrateData"]

        response_data: dict = {
            "directory": str(self.plot_directory.resolve()),
        }
        for pattern in file_patterns:
            path_list = self._list_file_paths_in_directory(self.plot_directory, pattern)
            if path_list:
                response_data[pattern] = self._parse_csv_file(path_list[0])
            else:
                response_data[pattern] = {
                    "name": "",
                    "error": f"No {pattern} file found",
                }

        response_str = json.dumps({req_cmd: response_data})
        self._send_response_bytes(response_str.encode("utf-8"))

    def _respond_to_new_name_request(self) -> None:
        if len(self.path_elements) == 1:
            response_str = json.dumps({"name": str(self.plot_directory.stem)})
        else:
            new_name = self.path_elements[1]
            create_folder_for_test_data(new_name)
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
    print(f"dir: {dir_path}")
    server = PlotServer(dir_path, ("0.0.0.0", http_port), PlotRequestHandler)
    print(f"Plot server running on port: {http_port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
