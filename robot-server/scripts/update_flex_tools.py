#!/usr/bin/env python3
"""
Update tools attached to a flex via the HTTP interface.
"""
import argparse
import sys
from typing import List
from dataclasses import dataclass
from urllib.parse import urljoin
import time

import requests


@dataclass
class Robot:
    url: str
    session: requests.Session

    def url_for(self, path: str) -> str:
        return urljoin(self.url, path)


def robot_from_address(addr: str) -> Robot:
    session = requests.Session()
    session.headers.update({"opentrons-version": "*"})
    robot = Robot(f"http://{addr}:31950", session)
    resp = session.get(robot.url_for("/health"))
    assert resp.status_code == 200, f"Could not reach robot at {addr}"
    assert "OT-2" not in resp.json().get(
        "robot_model", "OT-2 Standard"
    ), f"{addr} is an OT-2"
    return robot


def find_tools_to_update(robot: Robot) -> List[str]:
    instr_resp = robot.session.get(robot.url_for("/instruments"))
    assert instr_resp.status_code == 200, "Could not fetch instruments"
    instr_dict = instr_resp.json()
    return [
        instr["mount"]
        for instr in instr_dict["data"]
        if instr["firmwareUpdateRequired"] == True
    ]


def update_tool(robot: Robot, tool: str):
    start_resp = robot.session.post(
        robot.url_for("/instruments/updates"), json={"data": {"mount": tool}}
    )
    assert (
        start_resp.status_code == 201
    ), f"Could not start update: {start_resp.status_code}, {start_resp.content}"
    process_details = start_resp.json()
    update_id = process_details["data"]["id"]
    print(f"Began update for {tool} as {update_id}")
    while True:
        time.sleep(1)
        status_resp = robot.session.get(
            robot.url_for(f"/instruments/updates/{update_id}")
        )
        status_body = status_resp.json()
        assert (
            status_resp.status_code == 200
        ), f"Update failed: {status_resp.status_code} {status_body}"
        print(
            f'{status_body["data"]["updateStatus"]}, {status_body["data"]["updateProgress"]}% done'
        )
        if status_body["data"]["updateStatus"] == "done":
            break


def argparser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Update any tools attached to a flex that require updates"
    )
    parser.add_argument(
        "addr", metavar="ADDR", help="The address of the robot to update"
    )
    parser.add_argument(
        "-o",
        "--only",
        nargs="*",
        metavar="ONLY",
        choices=["left", "right", "extension"],
        help="Only update the specified mounts (if they need it)",
    )
    return parser


def limit_tools(require_updates: List[str], limit: List[str]) -> List[str]:
    if limit:
        limited = [tool for tool in require_updates if tool in limit]
        not_updated = [tool for tool in require_updates if tool not in limit]
        print(f'Not updating {", ".join(not_updated)} (not in --only)')
        return limited
    else:
        return require_updates


def run_update(addr: str, only: List[str]) -> None:
    robot = robot_from_address(addr)
    tools = find_tools_to_update(robot)
    print(
        ", ".join([t for t in ["left", "right", "extension"] if t not in tools])
        + " up to date"
    )
    to_update = limit_tools(tools, only)
    for tool in to_update:
        update_tool(robot, tool)


def main() -> int:
    parser = argparser()
    args = parser.parse_args()
    try:
        run_update(args.addr, args.only)
        return 0
    except Exception as e:
        print(f"Failed to update robot: {e}")
        return -1


if __name__ == "__main__":
    sys.exit(main())
