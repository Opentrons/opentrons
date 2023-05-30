"""Test uploading Python protocols that use custom labware definitions.

The server should correctly identify the extra files as labware definitions,
and describe them as such over the HTTP API.

In the protocol's analysis, the Python Protocol API should successfully load the custom
labware.
"""


# TODO(mm, 2023-01-11): Port this to a Tavern test once
# https://github.com/taverntesting/tavern/issues/833 is resolved. We need to upload
# multiple files into the `files` field of the `POST /protocols` endpoint.


import asyncio
import textwrap
from pathlib import Path
from typing import Any, AsyncGenerator

import anyio
import pytest

from tests.integration.robot_client import RobotClient


INTEGRATION_TEST_PROTOCOLS_DIR = Path(__file__).parent / "../../protocols"
LABWARE_PATH = INTEGRATION_TEST_PROTOCOLS_DIR / "test_1_reservoir_5ul.json"
EXPECTED_LABWARE_LOAD_NAME = "test_1_reservoir_5ul"

ANALYSIS_POLL_INTERVAL = 0.1
ANALYSIS_POLL_TIMEOUT = 10


@pytest.fixture
async def robot_client(
    ot2_server_base_url: str,
) -> AsyncGenerator[RobotClient, None]:
    """Return a client for a running dev server."""
    async with RobotClient.make(
        base_url=ot2_server_base_url, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_alive()
        ), "Dev Robot never became available."
        yield robot_client


async def poll_until_analysis_returns_ok(
    robot_client: RobotClient, protocol_id: str, analysis_id: str
) -> Any:
    """Wait until an analysis completes, and then assert that it returned "ok".

    Return the completed analysis response.
    """
    while True:
        response = (
            await robot_client.get_analysis(
                protocol_id=protocol_id, analysis_id=analysis_id
            )
        ).json()
        if response["data"]["status"] == "completed":
            assert response["data"]["result"] == "ok"
            return response
        else:
            # Analysis is still ongoing. Wait a beat, then poll again.
            await asyncio.sleep(ANALYSIS_POLL_INTERVAL)


def make_test_protocol(api_level: str, labware_load_name: str) -> bytes:
    """Return a Python protocol that loads a labware."""
    return textwrap.dedent(
        f"""
        metadata = {{"apiLevel": "{api_level}"}}
        def run(protocol) -> None:
            protocol.load_labware(
                load_name="{labware_load_name}",
                location=1,
            )
        """
    ).encode("utf-8")


@pytest.mark.parametrize(
    "api_level",
    [
        "2.0",  # Not executed by Protocol Engine.
        "2.14",  # Executed by Protocol Engine.
    ],
)
async def test_python_custom_labware_upload(
    robot_client: RobotClient, api_level: str
) -> None:
    protocol = make_test_protocol(
        api_level=api_level, labware_load_name=EXPECTED_LABWARE_LOAD_NAME
    )

    response = (
        await robot_client.post_protocol(
            files=[("protocol.py", protocol), LABWARE_PATH]
        )
    ).json()

    # Check that all files are present in the protocol resource.
    response_files = response["data"]["files"]
    assert len(response_files) == 2
    assert {"name": "protocol.py", "role": "main"} in response_files
    assert {"name": LABWARE_PATH.name, "role": "labware"} in response_files

    protocol_id = response["data"]["id"]
    [analysis_summary] = response["data"]["analysisSummaries"]
    analysis_id = analysis_summary["id"]

    # Check that the analysis completes successfully,
    # and that it includes the load of the custom labware.
    with anyio.fail_after(ANALYSIS_POLL_TIMEOUT):
        ok_analysis_response = await poll_until_analysis_returns_ok(
            robot_client=robot_client, protocol_id=protocol_id, analysis_id=analysis_id
        )
    [analysis_command] = ok_analysis_response["data"]["commands"]
    assert analysis_command["commandType"] == "loadLabware"
    assert analysis_command["params"]["loadName"] == EXPECTED_LABWARE_LOAD_NAME
    assert (
        analysis_command["result"]["definition"]["parameters"]["loadName"]
        == EXPECTED_LABWARE_LOAD_NAME
    )
