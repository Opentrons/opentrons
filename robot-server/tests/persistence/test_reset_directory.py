"""Test reset DB option."""
import asyncio
import os

import pytest
from pathlib import Path
import secrets
from typing import Callable, IO

from robot_server.persistence import (
    ResetManager,
    _TO_BE_DELETED_ON_REBOOT,
    _reset_persistence_directory,
)

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_json_protocol


@pytest.fixture
def reset_manager() -> ResetManager:
    """Get a ResetManager test subject."""
    return ResetManager()


async def test_test_reset_db(reset_manager: ResetManager, tmp_path: Path) -> None:
    """Should delete persistance directory if a file makred to delete exists."""
    assert Path(tmp_path, _TO_BE_DELETED_ON_REBOOT).exists() is False

    await reset_manager.mark_directory_reset(tmp_path)

    assert Path(tmp_path, _TO_BE_DELETED_ON_REBOOT).exists() is True


async def test_delete_persistence_directory(
    reset_manager: ResetManager, tmp_path: Path
) -> None:
    """Should make sure directory is empty."""
    await reset_manager.mark_directory_reset(tmp_path)

    result = await _reset_persistence_directory(tmp_path)

    assert result is True

    assert Path(tmp_path).exists() is False


async def test_delete_persistence_directory_not_found(
    reset_manager: ResetManager,
) -> None:
    """Should make sure a directory that is not found is caught in OSError."""
    result = await _reset_persistence_directory(Path("/dir-not-found"))

    assert result is False


@pytest.mark.parametrize("protocol", [(get_py_protocol), (get_json_protocol)])
async def test_upload_protocols_and_reset_persistence_dir(
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

            # Must not be so high that the server runs out of room and starts
            # auto-deleting old protocols.
            protocols_to_create = 15

            for _ in range(protocols_to_create):
                with protocol(secrets.token_urlsafe(16)) as file:
                    await robot_client.post_protocol([Path(file.name)])

            await robot_client.post_setting_reset_options({"runsHistory": True})

            result = await robot_client.get_protocols()

            assert result.json()["data"]

            assert os.listdir(f"{server.persistence_directory}/protocols/")

            server.stop()
            assert await robot_client.wait_until_dead(), "Dev Robot did not stop."

            server.start()

            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            result = await robot_client.get_protocols()

            assert result.json()["data"] == []

            await asyncio.sleep(5)

            assert os.listdir(f"{server.persistence_directory}/protocols/") == []

            server.stop()


# async def test_protocol_labware_files_persist() -> None:
#     """Upload a python protocol and 2 custom labware files.
#
#     Test reset dir after restart.
#     """
#     port = "15556"
#     async with RobotClient.make(
#             host="http://localhost", port=port, version="*"
#     ) as robot_client:
#         assert (
#             await robot_client.wait_until_dead()
#         ), "Dev Robot is running and must not be."
#         with DevServer(port=port) as server:
#             server.start()
#             assert (
#                 await robot_client.wait_until_alive()
#             ), "Dev Robot never became available."
#
#             protocol = await robot_client.post_protocol(
#                 [
#                     Path("./tests/integration/protocols/cpx_4_6_tuberack_100ul.py"),
#                     Path("./tests/integration/protocols/cpx_4_tuberack_100ul.json"),
#                     Path("./tests/integration/protocols/cpx_6_tuberack_100ul.json"),
#                 ]
#             )
#             await robot_client.post_setting_reset_options({"dbHistory": True})
#
#             result = await robot_client.get_protocols()
#
#             assert result.json()["data"]
#
#             assert os.listdir(f"{server.persistence_directory}/protocols/")
#
#             server.stop()
#             assert await robot_client.wait_until_dead(), "Dev Robot did not stop."
#
#             server.start()
#
#             assert (
#                 await robot_client.wait_until_alive()
#             ), "Dev Robot never became available."
#
#             result = await robot_client.get_protocols()
#
#             assert result.json()["data"] == []
#
#             await asyncio.sleep(5)
#
#             assert os.listdir(f"{server.persistence_directory}/protocols/") == []
#
#             print(os.listdir(
#                 f"{server.persistence_directory}/protocols/{result.json()['data'][0].id}/cpx_4_tuberack_100ul.json"  # noqa: E501
#             ))
#             print(os.listdir(Path(
#                 f"{server.persistence_directory}/protocols/{result.json()['data'][0].id}/cpx_6_tuberack_100ul.json"  # noqa: E501
#             )))
#
#             server.stop()
