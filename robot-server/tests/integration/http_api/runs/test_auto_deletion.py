from typing import List

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient


_NUM_RUNS_TO_UPLOAD = 25
_NUM_RUNS_TO_EXPECT = 20


async def test_runs_auto_delete(free_port: str) -> None:
    port = free_port
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

            created_run_ids = await _create_runs(
                robot_client=robot_client, num_runs=_NUM_RUNS_TO_UPLOAD
            )

            fetched_run_ids = await _get_run_ids(robot_client=robot_client)

            # Last n elements of created_run_ids.
            run_ids_to_expect = created_run_ids[-1 * _NUM_RUNS_TO_EXPECT :]

            assert fetched_run_ids == run_ids_to_expect


async def _create_runs(robot_client: RobotClient, num_runs: int) -> List[str]:
    """Upload several runs and return their IDs."""
    created_run_ids: List[str] = []
    for _ in range(num_runs):
        response = await robot_client.post_run(req_body={"data": {}})
        created_run_ids.append(response.json()["data"]["id"])
    return created_run_ids


async def _get_run_ids(robot_client: RobotClient) -> List[str]:
    """Return the IDs of all runs on the server."""
    response = await robot_client.get_runs()
    return [p["id"] for p in response.json()["data"]]
