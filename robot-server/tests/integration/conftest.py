import json
import time
from pathlib import Path
from typing import Any, Dict, Iterator

import pytest
import requests

from robot_server.versioning import API_VERSION_HEADER, LATEST_API_VERSION_HEADER_VALUE

from .dev_server import DevServer
from .dev_system_server import DevSystemServer


# Must match our Tavern config in common.yaml.
_SESSION_SERVER_HOST = "http://localhost"
_SESSION_SERVER_PORT = "31950"
_OT3_SESSION_SERVER_PORT = "31960"

_SESSION_SYSTEM_SERVER_PORT = "32950"


def get_auth_token() -> str:
    """Obtains an auth token from the system server on startup."""
    session = requests.Session()
    base_url = f"{_SESSION_SERVER_HOST}:{_SESSION_SYSTEM_SERVER_PORT}"

    registration: str = session.post(
        url=f"{base_url}/system/register",
        params={
            "subject": "ot_integration_tests",
            "agent": "pytest",
            "agentId": "pytest123",
        },
    ).json()["token"]

    token: str = session.post(
        url=f"{base_url}/system/authorize",
        headers={
            "authenticationBearer": registration,
        },
    ).json()["token"]

    return token


def pytest_tavern_beta_before_every_test_run(
    test_dict: Dict[str, Any],
    variables: Any,
) -> None:
    """Add Opentrons-Version header to requests that don't specify it."""
    token = get_auth_token()
    for stage in test_dict["stages"]:
        headers = stage["request"].get("headers", {})
        headers.setdefault("Opentrons-Version", "*")
        headers.setdefault("authenticationBearer", token)
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
def run_system_server(
    request_session: requests.Session,
) -> Iterator[None]:
    """Run the system server as a background process."""
    with DevSystemServer(port=_SESSION_SYSTEM_SERVER_PORT) as dev_server:
        dev_server.start()

        # Wait for a bit to get started by polling /hcpealth
        from requests.exceptions import ConnectionError

        while True:
            try:
                request_session.get(
                    f"{_SESSION_SERVER_HOST}:{_SESSION_SYSTEM_SERVER_PORT}/"
                )
            except ConnectionError:
                # The server isn't up yet to accept requests. Keep polling.
                pass
            else:
                # The server's replied with something other than a busy indicator. Stop polling.
                break

            time.sleep(0.1)

        # For all future uses of request_session, a token will be included automatically
        request_session.headers.update({"authenticationBearer": get_auth_token()})
        yield


@pytest.fixture(scope="session")
def run_server(
    request_session: requests.Session,
    server_temp_directory: str,
    run_system_server: None,
) -> Iterator[None]:
    """Run the robot server in a background process."""
    with DevServer(
        port=_SESSION_SERVER_PORT,
        ot_api_config_dir=Path(server_temp_directory),
        system_server_port=_SESSION_SYSTEM_SERVER_PORT,
    ) as dev_server:
        dev_server.start()

        # Wait for a bit to get started by polling /hcpealth
        from requests.exceptions import ConnectionError

        while True:
            try:
                health_response = request_session.get(
                    f"{_SESSION_SERVER_HOST}:{_SESSION_SERVER_PORT}/health"
                )
            except ConnectionError:
                # The server isn't up yet to accept requests. Keep polling.
                pass
            else:
                if health_response.status_code == 503:
                    # The server is accepting requests but reporting not ready. Keep polling.
                    pass
                else:
                    # The server's replied with something other than a busy indicator. Stop polling.
                    break

            time.sleep(0.1)

        yield


@pytest.fixture(scope="session")
def ot3_run_server(
    request_session: requests.Session,
    server_temp_directory: str,
    run_system_server: object,
) -> Iterator[None]:
    """Run the robot server in a background process."""
    with DevServer(
        port=_OT3_SESSION_SERVER_PORT,
        is_ot3=True,
        ot_api_config_dir=Path(server_temp_directory),
        system_server_port=_SESSION_SYSTEM_SERVER_PORT,
    ) as dev_server:
        dev_server.start()

        # Wait for a bit to get started by polling /hcpealth
        from requests.exceptions import ConnectionError

        while True:
            try:
                health_response = request_session.get(
                    f"{_SESSION_SERVER_HOST}:{_OT3_SESSION_SERVER_PORT}/health"
                )
            except ConnectionError:
                # The server isn't up yet to accept requests. Keep polling.
                pass
            else:
                if health_response.status_code == 503:
                    # The server is accepting requests but reporting not ready. Keep polling.
                    pass
                else:
                    # The server's replied with something other than a busy indicator. Stop polling.
                    break

            time.sleep(0.1)

        yield


@pytest.fixture(scope="session")
def session_server_host(run_server: object) -> str:
    """Return the host of the running session-scoped dev server."""
    return _SESSION_SERVER_HOST


@pytest.fixture(scope="session")
def session_server_port(run_server: object) -> str:
    """Return the port of the running session-scoped dev server."""
    return _SESSION_SERVER_PORT


@pytest.fixture(scope="session")
def session_system_server_port(run_system_server: object) -> str:
    """Return the port of the running session-scoped dev server."""
    return _SESSION_SYSTEM_SERVER_PORT


@pytest.fixture
def set_disable_fast_analysis(
    request_session: requests.Session,
) -> Iterator[None]:
    """For integration tests that need to set then clear the
    disableFastProtocolUpload feature flag"""
    url = "http://localhost:31950/settings"
    data = {"id": "disableFastProtocolUpload", "value": True}
    request_session.post(url, json=data)
    yield None
    data["value"] = None
    request_session.post(url, json=data)
