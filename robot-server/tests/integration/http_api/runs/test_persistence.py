from typing import AsyncGenerator, NamedTuple

import pytest

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient


class ClientServerFixture(NamedTuple):
    client: RobotClient
    server: DevServer

    async def restart(self) -> None:
        self.server.stop()
        assert await self.client.wait_until_dead(), "Server did not stop."
        self.server.start()
        assert await self.client.wait_until_alive(), "Server never became available."


@pytest.fixture
def port() -> str:
    """Get a port to run the dev server on."""
    return "15555"


@pytest.fixture
async def client_and_server(port: str) -> AsyncGenerator[ClientServerFixture, None]:
    """Get a dev server and a client to that server."""
    async with RobotClient.make(
        host="http://localhost",
        port=port,
        version="*",
    ) as client:
        assert await client.wait_until_dead(), "Server is running and must not be."

        with DevServer(port=port) as server:
            server.start()
            assert await client.wait_until_alive(), "Server never became available."

            yield ClientServerFixture(client=client, server=server)


async def test_runs_persist(client_and_server: ClientServerFixture) -> None:
    """Test that runs are persisted through dev server restart."""
    client, server = client_and_server

    # create a run
    create_run_response = await client.post_run(req_body={"data": {}})
    expected_run = create_run_response.json()["data"]
    run_id = expected_run["id"]

    # fetch the same run and commands through various endpoints
    get_all_runs_response = await client.get_runs()
    get_run_response = await client.get_run(run_id=run_id)

    # ensure fetched resources match created resources
    assert get_all_runs_response.json()["data"] == [expected_run]
    assert get_run_response.json()["data"] == expected_run

    # persist the run by setting current: false
    archive_run_response = await client.patch_run(
        run_id=run_id, req_body={"data": {"current": False}}
    )
    expected_run = archive_run_response.json()["data"]

    # reboot the server
    await client_and_server.restart()

    # fetch those same resources again
    get_all_persisted_runs_response = await client.get_runs()
    get_persisted_run_response = await client.get_run(run_id)

    # ensure the fetched resources still match the originally runs
    assert get_all_persisted_runs_response.json()["data"] == [expected_run]
    assert get_persisted_run_response.json()["data"] == expected_run


async def test_runs_persist_via_actions_router(
    client_and_server: ClientServerFixture,
) -> None:
    """Test that runs commands and state
    are persisted when calling play action through dev server restart."""
    client, server = client_and_server

    # create a run
    create_run_response = await client.post_run(req_body={"data": {}})
    run_id = create_run_response.json()["data"]["id"]

    # persist the hitting actions router
    await client.post_run_action(
        run_id=run_id,
        req_body={"data": {"actionType": "play"}},
    )

    # fetch the same run and commands through various endpoints
    get_run_response = await client.get_run(run_id=run_id)
    expected_run = dict(get_run_response.json()["data"], current=False)
    # reboot the server
    await client_and_server.restart()

    # fetch those same resources again
    get_persisted_run_response = await client.get_run(run_id)

    # ensure the fetched resources still match the originally runs
    assert get_persisted_run_response.json()["data"] == expected_run


async def test_run_actions_labware_offsets_persist(
    client_and_server: ClientServerFixture,
) -> None:
    """Test that run sub-resources are persisted through dev server restart."""
    client, server = client_and_server

    # create a run with offsets
    create_run_response = await client.post_run(
        req_body={
            "data": {
                "labwareOffsets": [
                    {
                        "definitionUri": "opentrons/opentrons_96_tiprack_300ul/1",
                        "location": {"slotName": "1"},
                        "vector": {"x": 1, "y": 2, "z": 3},
                    }
                ]
            }
        }
    )
    run_id = create_run_response.json()["data"]["id"]

    # add another labware offset and an action
    await client.post_labware_offset(
        run_id=run_id,
        req_body={
            "data": {
                "definitionUri": "opentrons/opentrons_96_tiprack_300ul/1",
                "location": {"slotName": "2"},
                "vector": {"x": 4, "y": 5, "z": 6},
            }
        },
    )
    await client.post_run_action(
        run_id=run_id,
        req_body={"data": {"actionType": "stop"}},
    )

    # persist the run by setting current: false
    archive_run_response = await client.patch_run(
        run_id=run_id, req_body={"data": {"current": False}}
    )
    expected_run = archive_run_response.json()["data"]

    # reboot the server
    await client_and_server.restart()

    # fetch the run again
    get_all_persisted_runs_response = await client.get_runs()
    get_persisted_run_response = await client.get_run(run_id)

    # ensure the persisted run matches the original
    assert get_all_persisted_runs_response.json()["data"] == [expected_run]
    assert get_persisted_run_response.json()["data"] == expected_run


async def test_run_commands_persist(client_and_server: ClientServerFixture) -> None:
    """Test that run commands are persisted through restart."""
    client, server = client_and_server

    # create a run
    create_run_response = await client.post_run(req_body={"data": {}})
    run_id = create_run_response.json()["data"]["id"]

    # create a command in that run
    create_command_response = await client.post_run_command(
        run_id=run_id,
        req_body={"data": {"commandType": "home", "params": {}}},
        params={"waitUntilComplete": True},
    )
    expected_command = create_command_response.json()["data"]
    command_id = expected_command["id"]

    # fetch the same commands through various endpoints
    get_all_commands_response = await client.get_run_commands(run_id=run_id)
    get_command_response = await client.get_run_command(
        run_id=run_id,
        command_id=command_id,
    )

    # ensure fetched resources match created resources
    assert get_all_commands_response.json()["data"] == [
        # NOTE: GET /run/:id/commands returns command summaries,
        # which are commands without the `result` key
        {k: v for k, v in expected_command.items() if k != "result"}
    ]
    assert get_command_response.json()["data"] == expected_command

    # persist the run by setting current: false
    await client.patch_run(run_id=run_id, req_body={"data": {"current": False}})

    # reboot the server
    await client_and_server.restart()

    # fetch those same resources again
    get_all_persisted_commands_response = await client.get_run_commands(run_id=run_id)
    get_persisted_command_response = await client.get_run_command(
        run_id=run_id, command_id=command_id
    )

    # ensure the persisted resources still match the original ones
    assert get_all_persisted_commands_response.json()["data"] == [
        # NOTE: GET /run/:id/commands returns command summaries,
        # which are commands without the `result` key
        {k: v for k, v in expected_command.items() if k != "result"}
    ]
    assert get_persisted_command_response.json()["data"] == expected_command
