from pathlib import Path

import pytest

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient


# TODO: Will cwd be correct here? This seems wrong if this test file was run
# from non-root.
_OLDER_PERSISTENCE_DIR = Path(
    "tests/integration/persistence_directory_snapshots/v6.0.1"
)

_EXPECTED_PROTOCOL_COUNT = 4
_EXPECTED_RUN_COUNT = 5


# Module scope for performance. We rely on these tests being read-only.
@pytest.fixture(scope="module")
async def robot_client() -> RobotClient:
    port = "15555"
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_dead()
        ), "Dev Robot is running and must not be."

        with DevServer(
            port=port,
            persistence_directory=_OLDER_PERSISTENCE_DIR,
        ) as server:
            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            yield robot_client

        assert await robot_client.wait_until_dead(), "Dev Robot did not stop."


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
