"""Query a robot for the failed protocol step and error details."""
import re
import sys

import requests

HEADERS = {"opentrons-version": "*"}


def get_failed_step(robot_ip: str) -> None:
    """Print the failed command and protocol line (if any) from the latest run."""
    try:
        runs = requests.get(
            f"http://{robot_ip}:31950/runs", headers=HEADERS, timeout=10
        ).json()
    except requests.exceptions.RequestException as e:
        print(f"Could not connect to robot {robot_ip}: {e}")
        return

    run_list = runs.get("data", [])
    if not run_list:
        print("No runs found.")
        return

    latest_run = run_list[-1]
    run_id = latest_run["id"]
    print(f"run_id : {run_id}")
    print(f"status : {latest_run.get('status')}")

    # 1. Check links.currentlyRecoveringFrom (best during error recovery)
    commands_meta = requests.get(
        f"http://{robot_ip}:31950/runs/{run_id}/commands",
        headers=HEADERS,
        params={"pageLength": 0},
        timeout=10,
    ).json()
    recovering_link = commands_meta.get("links", {}).get("currentlyRecoveringFrom")

    if recovering_link:
        cmd_id = recovering_link["meta"]["commandId"]
        cmd = (
            requests.get(
                f"http://{robot_ip}:31950/runs/{run_id}/commands/{cmd_id}",
                headers=HEADERS,
                timeout=10,
            )
            .json()
            .get("data", {})
        )
        _print_command(cmd, source="currentlyRecoveringFrom")
        return

    # 2. Fallback: scan commands list for any with status "failed" or an error set.
    #    commandErrors only returns error metadata (no commandType/params), so we
    #    need the full command objects to know which step was running.
    total = (
        requests.get(
            f"http://{robot_ip}:31950/runs/{run_id}/commands",
            headers=HEADERS,
            params={"pageLength": 0},
            timeout=10,
        )
        .json()
        .get("meta", {})
        .get("totalLength", 0)
    )

    page_size = 100
    failed_cmd = None
    for cursor in range(0, total, page_size):
        page = (
            requests.get(
                f"http://{robot_ip}:31950/runs/{run_id}/commands",
                headers=HEADERS,
                params={"cursor": cursor, "pageLength": page_size},
                timeout=10,
            )
            .json()
            .get("data", [])
        )
        for cmd in page:
            if cmd.get("status") == "failed" or cmd.get("error"):
                failed_cmd = cmd  # keep last one found

    if failed_cmd:
        _print_command(failed_cmd, source="commands scan")
        return

    print("No failed command or command errors found.")


def _print_command(cmd: dict, source: str) -> None:
    detail = cmd.get("detail") or (cmd.get("error") or {}).get("detail") or ""
    line_match = re.search(r"\[line (\d+)\]", detail)
    print(f"\nFailed command ({source}):")
    print(f"  commandType : {cmd.get('commandType')}")
    print(f"  status      : {cmd.get('status')}")
    print(f"  detail      : {detail[:300]}")
    print(
        f"  line        : {line_match.group(1) if line_match else 'N/A (hardware error)'}"
    )
    params = cmd.get("params", {})
    if params:
        print(
            f"  params      : volume={params.get('volume')} "
            f"source={params.get('sourceWellName')} "
            f"dest={params.get('destWellName')}"
        )


if __name__ == "__main__":
    robot_ip = input("Robot IP: ").strip()
    if not robot_ip:
        print("Robot IP is required.")
        sys.exit(1)
    get_failed_step(robot_ip)
