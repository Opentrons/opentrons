from pathlib import Path
from typing import AsyncGenerator, Generator

import pytest

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient


# FIXME(mm, 2022-09-09): This assumes the current working directory is
# the root project directory. See Jira RSS-104.
_OLDER_PERSISTENCE_DIR = Path(
    "tests/integration/persistence_directory_snapshots/v6.0.1"
)

_EXPECTED_PROTOCOL_COUNT = 4
_EXPECTED_RUN_COUNT = 5


# Module-scope to avoid the overhead of restarting the server between test functions.
# This relies on the test functions only reading, never writing.
@pytest.fixture(scope="module")
def dev_server() -> Generator[DevServer, None, None]:
    port = "15555"
    with DevServer(
        port=port,
        persistence_directory=_OLDER_PERSISTENCE_DIR,
    ) as server:
        server.start()
        yield server


@pytest.fixture
async def robot_client(dev_server: DevServer) -> AsyncGenerator[RobotClient, None]:
    """Return a client to talk to a server that's using an old persistence dir."""
    async with RobotClient.make(
        host="http://localhost", port=dev_server.port, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_alive()
        ), "Dev Robot never became available."
        yield robot_client


async def test_protocols_and_analyses_available_from_older_persistence_dir(
    robot_client: RobotClient,
) -> None:
    all_protocols = (await robot_client.get_protocols()).json()
    all_protocol_ids = [p["id"] for p in all_protocols["data"]]

    assert len(all_protocol_ids) == _EXPECTED_PROTOCOL_COUNT

    for protocol_id in all_protocol_ids:
        protocol = (await robot_client.get_protocol(protocol_id=protocol_id)).json()
        analysis_id = protocol["data"]["analysisSummaries"][-1]["id"]

        await robot_client.get_analysis(
            protocol_id=protocol_id, analysis_id=analysis_id
        )


async def test_runs_available_from_older_persistence_dir(
    robot_client: RobotClient,
) -> None:
    all_runs = (await robot_client.get_runs()).json()
    all_run_ids = [r["id"] for r in all_runs["data"]]

    assert len(all_run_ids) == _EXPECTED_RUN_COUNT

    for run_id in all_run_ids:
        await robot_client.get_run(run_id=run_id)

        all_command_summaries = (
            await robot_client.get_run_commands(
                run_id=run_id,
                page_length=999999,  # Big enough to include all commands.
            )
        ).json()
        assert len(all_command_summaries["data"]) > 0

        # Ideally, we would also fetch full commands via
        # `GET /runs/{run_id}/commands/{command_id}`.
        # We skip it for performance. On my machine, it would take ~7 seconds.
