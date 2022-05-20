import asyncio
import json
import random
import sys
from typing import Any, Dict, List

from httpx import Response
from tests.integration.robot_client import RobotClient


async def ainput(string: str) -> str:
    """async wait for input."""
    await asyncio.get_event_loop().run_in_executor(None, lambda s=string: print(s))
    return await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)


async def log_response(response: Response, print_timing: bool = False) -> None:
    """Log the response status, url, timing, and json response."""
    endpoint = f"\nstatus_code = {response.status_code}\n{response.request.method} {response.url}"  # noqa: E501
    formatted_response_body = json.dumps(response.json(), indent=4)
    elapsed = response.elapsed.total_seconds()
    elapsed_output = str(elapsed)
    if elapsed > 1:
        elapsed_output = f"{str(elapsed)} *LONG*"
    if print_timing:
        print(endpoint)
        print(elapsed_output)
    # print(formatted_response_body) # too big to do in console usefully
    with open("responses.log", "a") as log:
        log.write(endpoint)
        log.write(elapsed_output)
        log.write(formatted_response_body)


async def execute_command(
    robot_client: RobotClient, run_id: str, req_body: Dict[str, Any]
) -> None:
    """Post a command to a run waiting until complete then log the response."""
    params = {"waitUntilComplete": True}
    command = await robot_client.post_run_command(
        run_id=run_id, req_body=req_body, params=params, timeout_sec=60.0
    )
    await log_response(command)


async def get_module_id(robot_client: RobotClient, module_model: str) -> str:
    """Given a moduleModel get the id of that module."""
    modules = await robot_client.get_modules()
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


async def query_random_runs(robot_client: RobotClient) -> None:
    """Synchronously retrieve 4 random existing run details."""
    runs = await robot_client.get_runs()
    run_ids = [run["id"] for run in runs.json()["data"]]
    random_runs = random.choices(run_ids, k=4)
    tasks = [robot_client.get_run(run_id) for run_id in random_runs]
    responses = asyncio.gather(*tasks)
    for response in await responses:
        await log_response(response, True)
