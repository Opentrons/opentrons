import json
import time
from pathlib import Path
from typing import Any, Dict, Iterator

import pytest
import requests

from robot_server.versioning import API_VERSION_HEADER, LATEST_API_VERSION_HEADER_VALUE

from .dev_server import DevServer


# Must match our Tavern config in common.yaml.
_SESSION_SERVER_HOST = "http://localhost"
_SESSION_SERVER_PORT = "31950"


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
    request_session: requests.Session,
    server_temp_directory: str,
) -> Iterator[None]:
    """Run the robot server in a background process."""
    with DevServer(
        port=_SESSION_SERVER_PORT,
        ot_api_config_dir=Path(server_temp_directory),
    ) as dev_server:
        dev_server.start()

        # Wait for a bit to get started by polling /hcpealth
        from requests.exceptions import ConnectionError

        while True:
            try:
                request_session.get(
                    f"{_SESSION_SERVER_HOST}:{_SESSION_SERVER_PORT}/health"
                )
            except ConnectionError:
                pass
            else:
                break
            time.sleep(0.5)
        request_session.post(
            f"{_SESSION_SERVER_HOST}:{_SESSION_SERVER_PORT}/home",
            json={"target": "robot"},
        )

        yield


@pytest.fixture(scope="session")
def session_server_host(run_server: object) -> str:
    """Return the host of the running session-scoped dev server."""
    return _SESSION_SERVER_HOST


@pytest.fixture(scope="session")
def session_server_port(run_server: object) -> str:
    """Return the port of the running session-scoped dev server."""
    return _SESSION_SERVER_PORT


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
