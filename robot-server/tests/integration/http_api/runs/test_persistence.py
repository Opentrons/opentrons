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
    """Test that protocols are persisted through dev server restart."""
    client, server = client_and_server

    # create a run
    create_run_response = await client.post_run(req_body={"data": {}})
    expected_run = create_run_response.json()["data"]
    run_id = expected_run["id"]

    # create a command in that run
    create_command_response = await client.post_run_command(
        run_id=expected_run["id"],
        req_body={"data": {"commandType": "home", "params": {}}},
        params={"waitUntilComplete": True},
    )
    expected_command = create_command_response.json()["data"]
    command_id = expected_command["id"]

    # fetch the same run and commands through various endpoints
    get_all_runs_response = await client.get_runs()
    get_all_commands_response = await client.get_run_commands(run_id=run_id)
    get_run_response = await client.get_run(run_id=run_id)
    get_command_response = await client.get_run_command(
        run_id=run_id,
        command_id=command_id,
    )

    # ensure fetched resources match created resources
    assert get_all_runs_response.json()["data"] == [expected_run]
    assert get_all_commands_response.json()["data"] == [
        # NOTE: GET /run/:id/commands returns command summaries,
        # which are commands without the `result` key
        {k: v for k, v in expected_command.items() if k != "result"}
    ]
    assert get_run_response.json()["data"] == expected_run
    assert get_command_response.json()["data"] == expected_command

    # reboot the server
    await client_and_server.restart()

    # fetch those same resources again
    get_all_persisted_runs_response = await client.get_runs()
    get_all_persisted_commands_response = await client.get_run_commands(run_id=run_id)
    get_persisted_run_response = await client.get_run(expected_run["id"])
    get_persisted_command_response = await client.get_run_command(
        expected_run["id"], expected_command["id"]
    )

    # ensure the fetched resources still match the originally created ones
    # even through the server reboot
    assert get_all_persisted_runs_response.json()["data"] == [expected_run]
    assert get_all_persisted_commands_response.json()["data"] == [
        # NOTE: GET /run/:id/commands returns command summaries,
        # which are commands without the `result` key
        {k: v for k, v in expected_command.items() if k != "result"}
    ]
    assert get_persisted_run_response.json()["data"] == expected_run
    assert get_persisted_command_response.json()["data"] == expected_command
