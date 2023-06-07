"""Script for updating a tool connected to a Flex."""
import argparse
import requests
import sys
from typing import List, Any, Dict, Set
from hardware_testing.opentrons_api.http_api import OpentronsHTTPAPI

HEADERS = {"opentrons-version": "4"}
DEBUG = False


def _mounts_from_arg(mount: str) -> List[str]:
    if mount == "all":
        return ["left", "right", "extension"]
    return [mount]


def _ok_json(response: requests.Response) -> Dict[str, Any]:
    response.raise_for_status()
    return response.json()


def _update_for_subsystem(session: requests.Session, url: str, subsystem: str) -> str:
    response = session.post(f"{url}/subsystems/update/{subsystem}")
    response_data = _ok_json(response)
    print(f"update started at {response.url}")
    return response_data["data"]["id"]


def _subsystem_from_mount_data(
    mount_data: Dict[str, Dict[str, str]], mount: str
) -> str:
    if DEBUG:
        print(f"checking {mount_data} for {mount}")
    assert mount in mount_data, f"No entry for {mount} in data"
    return mount_data[mount]["subsystem"]


def _do_update_tool(api: OpentronsHTTPAPI, mounts: List[str]) -> None:
    instrs = api.get_instruments()
    updates: List[str] = []
    for mount in mounts:
        try:
            instr = next(instr for instr in instrs if instr["mount"] == mount)
        except StopIteration:
            assert False, f"No instrument present on {mount}"

        if instr["ok"]:
            print(f"Instrument on {mount} does not need an update")
            continue
        updates.append(api.update_subsystem(instr["subsystem"]))

    done: Set[str] = set()
    updating = set(updates)

    for update in updates:
        if done - updating == set():
            break
        if update in done:
            continue
        status = api.get_update_status(update)
        print(
            f'{status["subsystem"]}: {status["updateStatus"]} {status["updateProgress"]}%'
        )
        if status["updateStatus"] in ("complete", "error"):
            done.add(update)
    print("All updates done")
    for update in done:
        status = api.get_update_status(update)
        result = (
            f'FAILED: {status["updateError"]}'
            if status["updateStatus"] == "error"
            else "done"
        )

        print(f'update for {status["subsystem"]} {result}')


def update_tool(host: str, mount: str) -> None:
    """Update a tool on the specified mount of the robot at the specified host."""
    api = OpentronsHTTPAPI(host)
    assert api.get_health(), f"Could not reach {host}"
    _do_update_tool(api, _mounts_from_arg(mount))


def __main__() -> None:
    parser = argparse.ArgumentParser(
        description="Script to update the firmware on attached tools via HTTP"
    )
    parser.add_argument("host", metavar="HOST", help="ip address of the robot")
    parser.add_argument(
        "mount",
        metavar="MOUNT",
        choices=["left", "right", "gripper", "all"],
        default="all",
        help="which mount",
    )
    args = parser.parse_args()

    try:
        update_tool(args.host, args.mount)
        sys.exit(0)
    except Exception as e:
        print(e)
        sys.exit(-1)
