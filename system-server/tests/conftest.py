import pytest
import subprocess
from typing import NoReturn, Iterator, Any
import tempfile
import requests
import os
import time
import sys
import signal

from opentrons import config

from fastapi import routing
from starlette.testclient import TestClient


from system_server import app
from robot_server.versioning import API_VERSION_HEADER, LATEST_API_VERSION_HEADER_VALUE  # type: ignore[import]

test_router = routing.APIRouter()


@test_router.get("/alwaysRaise")
async def always_raise() -> NoReturn:
    raise RuntimeError


app.include_router(test_router)


@pytest.fixture
def api_client() -> TestClient:
    client = TestClient(app)
    client.headers.update({API_VERSION_HEADER: LATEST_API_VERSION_HEADER_VALUE})
    return client


@pytest.fixture
def api_client_no_errors() -> TestClient:
    """An API client that won't raise server exceptions.
    Use only to test 500 pages; never use this for other tests."""
    client = TestClient(app, raise_server_exceptions=False)
    client.headers.update({API_VERSION_HEADER: LATEST_API_VERSION_HEADER_VALUE})
    return client


@pytest.fixture(scope="session")
def request_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({API_VERSION_HEADER: LATEST_API_VERSION_HEADER_VALUE})
    return session


@pytest.fixture(scope="session")
def server_temp_directory() -> Iterator[str]:
    new_dir = tempfile.mkdtemp()
    os.environ["OT_API_CONFIG_DIR"] = new_dir
    config.reload()
    yield new_dir


@pytest.fixture(scope="session")
def run_server(
    request_session: requests.Session, server_temp_directory: str
) -> Iterator["subprocess.Popen[Any]"]:
    """Run the system server in a background process."""
    # In order to collect coverage we run using `coverage`.
    # `-a` is to append to existing `.coverage` file.
    # `--source` is the source code folder to collect coverage stats on.
    with subprocess.Popen(
        [
            sys.executable,
            "-m",
            "coverage",
            "run",
            "-a",
            "--source",
            "system_server",
            "-m",
            "uvicorn",
            "system_server:app",
        ],
        stdin=subprocess.DEVNULL,
        # The server will log to its stdout or stderr.
        # Let it inherit our stdout and stderr so pytest captures its logs.
        stdout=None,
        stderr=None,
    ) as proc:
        # Wait for a bit to get started by polling /hcpealth
        from requests.exceptions import ConnectionError

        while True:
            try:
                request_session.get("http://localhost:32950")
            except ConnectionError:
                pass
            else:
                break
            time.sleep(0.5)
        yield proc
        proc.send_signal(signal.SIGTERM)
        proc.wait()
