import asyncio
import json
import time
from pathlib import Path
from typing import Any, Dict, Generator, Iterator

import pytest
import requests

from robot_server.versioning import API_VERSION_HEADER, LATEST_API_VERSION_HEADER_VALUE

from .dev_server import DevServer
from .robot_client import RobotClient


# Must match our Tavern config in common.yaml.
_SESSION_SERVER_HOST = "http://localhost"
_SESSION_SERVER_PORT = "31950"
_OT3_SESSION_SERVER_PORT = "31960"


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
def _run_server(
    request_session: requests.Session,
    server_temp_directory: str,
) -> Iterator[None]:
    """Run the robot server in a background process."""
    with DevServer(
        port=_SESSION_SERVER_PORT,
        ot_api_config_dir=Path(server_temp_directory),
    ) as dev_server:
        dev_server.start()

        # Wait for a bit to get started by polling /health
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
def _ot3_run_server(
    request_session: requests.Session,
    server_temp_directory: str,
) -> Iterator[None]:
    """Run the robot server in a background process."""
    with DevServer(
        port=_OT3_SESSION_SERVER_PORT,
        is_ot3=True,
        ot_api_config_dir=Path(server_temp_directory),
    ) as dev_server:
        dev_server.start()

        # Wait for a bit to get started by polling /health
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


def _clean_server_state() -> None:
    async def _clean_server_state_async() -> None:
        port = "31950"
        async with RobotClient.make(
            base_url=f"http://localhost:{port}", version="*"
        ) as robot_client:
            await _delete_all_runs(robot_client)
            await _delete_all_protocols(robot_client)

    asyncio.run(_clean_server_state_async())


# TODO(jbl 2023-05-01) merge this with ot3_run_server, along with clean_server_state and run_server
def _ot3_clean_server_state() -> None:
    # async fn that does the things below
    # make a robot client
    # delete protocols
    async def _clean_server_state_async() -> None:
        port = "31960"
        async with RobotClient.make(
            base_url=f"http://localhost:{port}", version="*"
        ) as robot_client:
            await _delete_all_runs(robot_client)
            await _delete_all_protocols(robot_client)

    asyncio.run(_clean_server_state_async())


async def _delete_all_runs(robot_client: RobotClient) -> None:
    """Delete all runs on the robot server."""
    response = await robot_client.get_runs()
    run_ids = [r["id"] for r in response.json()["data"]]
    for run_id in run_ids:
        await robot_client.delete_run(run_id)


async def _delete_all_protocols(robot_client: RobotClient) -> None:
    """Delete all protocols on the robot server"""
    response = await robot_client.get_protocols()
    protocol_ids = [p["id"] for p in response.json()["data"]]
    for protocol_id in protocol_ids:
        await robot_client.delete_protocol(protocol_id)


@pytest.fixture
def ot2_server_base_url(_run_server: None) -> Generator[str, None, None]:
    yield f"{_SESSION_SERVER_HOST}:{_SESSION_SERVER_PORT}"
    _clean_server_state()


@pytest.fixture
def ot3_server_base_url(_ot3_run_server: None) -> Generator[str, None, None]:
    yield f"{_SESSION_SERVER_HOST}:{_OT3_SESSION_SERVER_PORT}"
    _ot3_clean_server_state()
