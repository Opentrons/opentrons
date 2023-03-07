import json
import subprocess
import sys
import time
import signal
from typing import Any, Dict, Iterator

import pytest
import requests

from robot_server.versioning import API_VERSION_HEADER, LATEST_API_VERSION_HEADER_VALUE


def pytest_tavern_beta_before_every_test_run(
    test_dict: Dict[str, Any],
    variables: Any,
) -> None:
    """Add Opentrons-Version header to requests that don't specify it."""
    for stage in test_dict["stages"]:
        headers = stage["request"].get("headers", {})
        headers.setdefault("Opentrons-Version", "*")
        stage["request"].update({"headers": headers})


def pytest_tavern_beta_after_every_response(
    expected: Any, response: requests.Response
) -> None:
    print(response.url)
    print(json.dumps(response.json(), indent=4))


@pytest.fixture(scope="session")
def request_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({API_VERSION_HEADER: LATEST_API_VERSION_HEADER_VALUE})
    return session


@pytest.fixture(scope="session")
def run_server(
    request_session: requests.Session, server_temp_directory: str
) -> Iterator["subprocess.Popen[Any]"]:
    """Run the robot server in a background process."""
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
            "robot_server",
            "-m",
            "uvicorn",
            "robot_server:app",
            "--host",
            "localhost",
            "--port",
            "31950",
        ],
        env={
            "OT_ROBOT_SERVER_DOT_ENV_PATH": "dev.env",
            "OT_API_CONFIG_DIR": server_temp_directory,
        },
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
                request_session.get("http://localhost:31950/health")
            except ConnectionError:
                pass
            else:
                break
            time.sleep(0.5)
        request_session.post(
            "http://localhost:31950/robot/home", json={"target": "robot"}
        )
        yield proc
        proc.send_signal(signal.SIGTERM)
        proc.wait()


@pytest.fixture
def set_disable_fast_analysis(
    request_session: requests.Session,
) -> Iterator[None]:
    """For integration tests that need to set then clear the
    enableHttpProtocolSessions feature flag"""
    url = "http://localhost:31950/settings"
    data = {"id": "disableFastProtocolUpload", "value": True}
    request_session.post(url, json=data)
    yield None
    data["value"] = None
    request_session.post(url, json=data)
