from pathlib import Path
import secrets
from typing import Callable, IO

import pytest

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_json_protocol


@pytest.mark.parametrize("protocol", [(get_py_protocol), (get_json_protocol)])
async def test_protocols_and_analyses_persist(
    protocol: Callable[[str], IO[bytes]]
) -> None:
    """Test protocol and analysis persistence.

    Uploaded protocols and their completed analyses should remain constant across
    server restarts.
    """
    port = "15555"
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_dead()
        ), "Dev Robot is running and must not be."
        with DevServer(port=port) as server:
            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            protocols_to_create = 13
            for _ in range(protocols_to_create):
                with protocol(secrets.token_urlsafe(16)) as file:
                    await robot_client.post_protocol([Path(file.name)])

            await robot_client.wait_for_all_analyses_to_complete()

            # The protocols response will include analysis statuses. Fetch it
            # *after* all analyses complete to make sure it's deterministic.
            protocols_before_restart = (await robot_client.get_protocols()).json()[
                "data"
            ]
            analyses_before_restart = await robot_client.get_all_analyses()

            server.stop()
            assert await robot_client.wait_until_dead(), "Dev Robot did not stop."

            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            protocols_after_restart = (await robot_client.get_protocols()).json()[
                "data"
            ]
            analyses_after_restart = await robot_client.get_all_analyses()

            # The number of uploaded protocols prior to restart equals the number
            # of protocols in the get protocols response after restart.
            assert len(protocols_after_restart) == protocols_to_create

            # The protocols after restart are the same as prior to restart,
            # except we don't care about order.
            protocols_before_restart.sort(key=lambda p: p["id"])
            protocols_after_restart.sort(key=lambda p: p["id"])
            assert protocols_after_restart == protocols_before_restart

            # Each protocol's analysis is the same as prior to restart.
            assert analyses_after_restart == analyses_before_restart

            server.stop()


async def test_protocol_labware_files_persist() -> None:
    """Upload a python protocol and 2 custom labware files.

    Test that labware files are persisted on server restart.
    """
    port = "15556"
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_dead()
        ), "Dev Robot is running and must not be."
        with DevServer(port=port) as server:
            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            protocol = await robot_client.post_protocol(
                [
                    Path("./tests/integration/protocols/cpx_4_6_tuberack_100ul.py"),
                    Path("./tests/integration/protocols/cpx_4_tuberack_100ul.json"),
                    Path("./tests/integration/protocols/cpx_6_tuberack_100ul.json"),
                ]
            )
            protocol_upload_json = protocol.json()
            protocol_id = protocol_upload_json["data"]["id"]

            result = await robot_client.get_protocol(protocol_id)
            protocol_detail = result.json()["data"]
            # The analysisSummaries field is nondeterministic because the observed
            # analysis statuses depend on request timing.
            # Since we already cover analysis persistence elsewhere in this file,
            # we can ignore the whole field in this test to avoid the nondeterminism.
            del protocol_detail["analysisSummaries"]

            server.stop()
            assert await robot_client.wait_until_dead(), "Dev Robot did not stop."
            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            result = await robot_client.get_protocol(protocol_id)
            restarted_protocol_detail = result.json()["data"]
            del restarted_protocol_detail["analysisSummaries"]

            protocol_detail["files"].sort(key=lambda n: n["name"])
            restarted_protocol_detail["files"].sort(key=lambda n: n["name"])
            assert restarted_protocol_detail == protocol_detail

            four_tuberack = Path(
                f"{server.persistence_directory}/protocols/{protocol_id}/cpx_4_tuberack_100ul.json"  # noqa: E501
            )
            six_tuberack = Path(
                f"{server.persistence_directory}/protocols/{protocol_id}/cpx_6_tuberack_100ul.json"  # noqa: E501
            )
            assert four_tuberack.is_file()
            assert six_tuberack.is_file()
            server.stop()
