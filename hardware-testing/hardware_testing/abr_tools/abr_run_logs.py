"""ABR Run Log Pull."""
from typing import Set, Dict, Any
import argparse
import os
import json
import traceback
import requests
from . import read_robot_logs


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
    run["robot_name"] = health_data.get("name", "")
    run["API_Version"] = health_data.get("api_version", "")
    run["robot_serial"] = health_data.get("robot_serial", "")
    run["run_id"] = one_run

    # Instruments Attached
    response = requests.get(
        f"http://{ip}:31950/instruments", headers={"opentrons-version": "3"}
    )
    instrument_data = response.json()
    for instrument in instrument_data["data"]:
        run[instrument["mount"]] = instrument["serialNumber"]
    return run


def save_runs(runs_to_save: Set[str], ip: str, storage_directory: str) -> None:
    """Saves runs to user given storage directory."""
    for a_run in runs_to_save:
        data = get_run_data(a_run, ip)
        data_file_name = ip + "_" + data["run_id"] + ".json"
        json.dump(data, open(os.path.join(storage_directory, data_file_name), mode="w"))
    print(f"Saved {len(runs_to_save)} run(s) from robot with IP address {ip}.")


def get_all_run_logs(storage_directory: str) -> None:
    """GET ALL RUN LOGS.

    Connect to each ABR robot to read run log data.
    Read each robot's list of unique run log IDs and compare them to all IDs in storage.
    Any ID that is not in storage, download the run log and put it in storage.
    """
    ip_json_file = os.path.join(storage_directory, "IPs.json")
    ip_file = json.load(open(ip_json_file))
    ip_address_list = ip_file["ip_address_list"]
    print(ip_address_list)

    runs_from_storage = read_robot_logs.get_run_ids_from_storage(storage_directory)
    for ip in ip_address_list:
        try:
            runs = get_run_ids_from_robot(ip)
            runs_to_save = read_robot_logs.get_unseen_run_ids(runs, runs_from_storage)
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
