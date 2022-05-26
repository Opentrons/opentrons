import random
from typing import Any, Dict, List

from anyio import create_task_group
from tests.integration.http_api.live.util import log_response
from tests.integration.robot_client import RobotClient


class RobotInteractions:
    """Reusable amalgamations of API calls to the robot."""

    def __init__(self, robot_client: RobotClient) -> None:
        self.robot_client = robot_client

    async def execute_command(
        self, run_id: str, req_body: Dict[str, Any], timeout_sec: float = 60.0
    ) -> None:
        """Post a command to a run waiting until complete then log the response."""
        params = {"waitUntilComplete": True}
        command = await self.robot_client.post_run_command(
            run_id=run_id, req_body=req_body, params=params, timeout_sec=timeout_sec
        )
        await log_response(command)

    async def get_module_id(self, module_model: str) -> str:
        """Given a moduleModel get the id of that module."""
        modules = await self.robot_client.get_modules()
        await log_response(modules)
        ids: List[str] = [
            module["id"]
            for module in modules.json()["data"]
            if module["moduleModel"] == module_model
        ]
        if len(ids) > 1:
            raise ValueError(
                f"You have multiples of a module {module_model} attached and that is not supported."  # noqa: E501
            )
        elif len(ids) == 0:
            raise ValueError(
                f"No module attached to the robot has moduleModel of {module_model}"
            )
        return ids[0]

    async def query_random_runs(self) -> None:
        runs = await self.robot_client.get_runs()
        run_ids = [run["id"] for run in runs.json()["data"]]
        random_runs = random.choices(run_ids, k=4)

        async def _get_and_log_run(run_id: str) -> None:
            response = await self.robot_client.get_run(run_id)
            log_response(response, True)

        async with create_task_group() as tg:
            for run_id in random_runs:
                tg.start_soon(_get_and_log_run, run_id)

    async def get_module_data_by_id(self, module_id: str) -> Any:
        """Given a moduleModel get the id of that module."""
        modules = await self.robot_client.get_modules()
        await log_response(modules)
        data = [
            module for module in modules.json()["data"] if module["id"] == module_id
        ]
        if len(data) == 0:
            raise ValueError(f"No module attached to the robot has id of {module_id}")
        return data[0]
