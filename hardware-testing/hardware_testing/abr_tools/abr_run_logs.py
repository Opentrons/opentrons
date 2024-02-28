"""ABR Run Log Pull."""
from .abr_robots import ABR_IPS
from typing import Set, Dict, Any

import argparse
import os
import json
import traceback
import requests


def get_run_ids_from_storage(storage_directory: str) -> Set[str]:
    """Read all files in storage directory, extracts run id, adds to set."""
    os.makedirs(storage_directory, exist_ok=True)
    list_of_files = os.listdir(storage_directory)
    run_ids = set()
    for this_file in list_of_files:
        read_file = os.path.join(storage_directory, this_file)
        try:
            file_results = json.load(open(read_file))
        except json.JSONDecodeError:
            print(f"Ignoring unparsable file {read_file}.")
            continue
        run_id = file_results["run_id"]
        run_ids.add(run_id)
    return run_ids


def get_unseen_run_ids(runs: Set[str], runs_from_storage: Set[str]) -> Set[str]:
    """Subtracts runs from storage from current runs being read."""
    runs_to_save = runs - runs_from_storage
    return runs_to_save


def get_run_ids_from_robot(ip: str) -> Set[str]:
    """Get all completed runs from each robot."""
    run_ids = set()
    response = requests.get(
        f"http://{ip}:31950/runs", headers={"opentrons-version": "3"}
    )
    run_data = response.json()
    run_list = run_data["data"]
    for run in run_list:
        run_id = run["id"]
        if not run["current"]:
            run_ids.add(run_id)
    return run_ids


def get_run_data(one_run: Any, ip: str) -> Dict[str, Any]:
    """Use http requests to get command, health, and protocol data from robot."""
    response = requests.get(
        f"http://{ip}:31950/runs/{one_run}/commands",
        headers={"opentrons-version": "3"},
        params={"cursor": 0, "pageLength": 0},
    )
    data = response.json()
    command_count = data["meta"]["totalLength"]
    page_length = 100
    commands = list()
    run = dict()
    for cursor in range(0, command_count, page_length):
        response = requests.get(
            f"http://{ip}:31950/runs/{one_run}/commands",
            headers={"opentrons-version": "3"},
            params={"cursor": cursor, "pageLength": page_length},
        )
        command_data = response.json()
        commands.extend(command_data["data"])
    run["commands"] = commands
    response = requests.get(
        f"http://{ip}:31950/runs/{one_run}", headers={"opentrons-version": "3"}
    )
    run_meta_data = response.json()
    protocol_id = run_meta_data["data"]["protocolId"]
    run.update(run_meta_data["data"])
    response = requests.get(
        f"http://{ip}:31950/protocols/{protocol_id}", headers={"opentrons-version": "3"}
    )
    protocol_data = response.json()
    run["protocol"] = protocol_data["data"]
    response = requests.get(
        f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
    )
    health_data = response.json()
    robot_name = health_data["name"]
    try:
        robot_serial = health_data["robot_serial"]
    except KeyError:
        robot_serial = "unknown"
    try:
        run["robot_name"] = robot_name
    except UnboundLocalError:
        robot_name = "unknown"
    run["run_id"] = one_run
    run["robot_serial"] = robot_serial
    return run


def save_runs(runs_to_save: Set[str], ip: str, storage_directory: str) -> None:
    """Saves runs to user given storage directory."""
    for a_run in runs_to_save:
        data = get_run_data(a_run, ip)
        #robot_name = data["robot_name"]
        data_file_name = ip + "_" + data["run_id"] + ".json"
        json.dump(data, open(os.path.join(storage_directory, data_file_name), mode="w"))
    print(
        f"Saved {len(runs_to_save)} run(s) from robot with IP address {ip}."
    )


def get_all_run_logs(storage_directory: str) -> None:
    """GET ALL RUN LOGS.

    Connect to each ABR robot to read run log data.
    Read each robot's list of unique run log IDs and compare them to all IDs in storage.
    Any ID that is not in storage, download the run log and put it in storage.
    """
    runs_from_storage = get_run_ids_from_storage(storage_directory)
    for ip in ABR_IPS:
        try:
            runs = get_run_ids_from_robot(ip)
            runs_to_save = get_unseen_run_ids(runs, runs_from_storage)
            save_runs(runs_to_save, ip, storage_directory)
        except Exception:
            print(f"Failed to read IP address: {ip}.")
            traceback.print_exc()


if __name__ == "__main__":
    """Get run logs."""
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    args = parser.parse_args()
    get_all_run_logs(args.storage_directory[0])
