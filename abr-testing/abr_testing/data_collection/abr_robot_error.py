"""Create ticket for robot with error."""
from typing import List, Tuple, Any
from abr_testing.data_collection import read_robot_logs, abr_google_drive, get_run_logs
import requests
import argparse
from abr_testing.automation import jira_tool, google_sheets_tool, google_drive_tool
import shutil
import os
import subprocess
import sys
import json
import re


def match_error_to_component(
    project_id: str, error_message: str, components: List[str]
) -> List[str]:
    """Match error to component based on error message."""
    project_components = ticket.get_project_components(project_id)
    component_names = [proj_comp["name"] for proj_comp in project_components]
    for component in component_names:
        pattern = re.compile(component, re.IGNORECASE)
        matches = pattern.findall(error_message)
        if matches:
            components.append(component)
    return components


def get_user_id(user_file_path: str, assignee_name: str) -> str:
    """Get assignee account id."""
    users = json.load(open(user_file_path))
    assignee_id = "-1"  # Code to leave issue unassigned.
    for item in users:
        user = users[item]
        if user["displayName"] == assignee_name:
            assignee_id = user["accountId"]
    return assignee_id


def get_error_runs_from_robot(ip: str) -> List[str]:
    """Get runs that have errors from robot."""
    error_run_ids = []
    response = requests.get(
        f"http://{ip}:31950/runs", headers={"opentrons-version": "3"}
    )
    run_data = response.json()
    run_list = run_data["data"]
    for run in run_list:
        run_id = run["id"]
        num_of_errors = len(run["errors"])
        if not run["current"] and num_of_errors > 0:
            error_run_ids.append(run_id)
    return error_run_ids


def get_robot_state(
    ip: str, reported_string: str
) -> Tuple[Any, Any, Any, List[str], str]:
    """Get robot status in case of non run error."""
    description = dict()
    # Get instruments attached to robot
    try:
        response = requests.get(
            f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
        )
        print(f"Connected to {ip}")
    except Exception:
        print(f"ERROR: Failed to read IP address: {ip}")
        sys.exit()
    response = requests.get(
        f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
    )
    health_data = response.json()
    parent = health_data.get("name", "")
    # Create summary name
    description["robot_name"] = parent
    summary = parent + "_" + reported_string
    affects_version = health_data.get("api_version", "")
    description["affects_version"] = affects_version
    # Instruments Attached
    response = requests.get(
        f"http://{ip}:31950/instruments", headers={"opentrons-version": "3"}
    )

    instrument_data = response.json()
    for instrument in instrument_data["data"]:
        description[instrument["mount"]] = instrument
    # Get modules attached to robot
    response = requests.get(
        f"http://{ip}:31950/modules", headers={"opentrons-version": "3"}
    )
    module_data = response.json()
    for module in module_data["data"]:
        description[module["moduleType"]] = module
    components = ["Flex-RABR"]
    components = match_error_to_component("RABR", reported_string, components)
    print(components)
    whole_description_str = (
        "{"
        + "\n".join("{!r}: {!r},".format(k, v) for k, v in description.items())
        + "}"
    )
    return (
        summary,
        parent,
        affects_version,
        components,
        whole_description_str,
    )


def get_run_error_info_from_robot(
    ip: str, one_run: str, storage_directory: str
) -> Tuple[str, str, str, List[str], str, str]:
    """Get error information from robot to fill out ticket."""
    description = dict()
    # get run information
    results = get_run_logs.get_run_data(one_run, ip)
    # save run information to local directory as .json file
    saved_file_path = read_robot_logs.save_run_log_to_json(
        ip, results, storage_directory
    )
    # Error Printout
    (
        num_of_errors,
        error_type,
        error_code,
        error_instrument,
        error_level,
    ) = read_robot_logs.get_error_info(results)
    # JIRA Ticket Fields
    failure_level = "Level " + str(error_level) + " Failure"

    components = [failure_level, "Flex-RABR"]
    components = match_error_to_component("RABR", error_type, components)
    print(components)
    affects_version = results["API_Version"]
    parent = results.get("robot_name", "")
    print(parent)
    summary = parent + "_" + str(one_run) + "_" + str(error_code) + "_" + error_type
    # Description of error
    description["protocol_name"] = results["protocol"]["metadata"].get(
        "protocolName", ""
    )
    description["error"] = " ".join([error_code, error_type, error_instrument])
    description["protocol_step"] = list(results["commands"])[-1]
    description["right_mount"] = results.get("right", "No attachment")
    description["left_mount"] = results.get("left", "No attachment")
    description["gripper"] = results.get("extension", "No attachment")
    all_modules = abr_google_drive.get_modules(results)
    whole_description = {**description, **all_modules}
    whole_description_str = (
        "{"
        + "\n".join("{!r}: {!r},".format(k, v) for k, v in whole_description.items())
        + "}"
    )

    return (
        summary,
        parent,
        affects_version,
        components,
        whole_description_str,
        saved_file_path,
    )


if __name__ == "__main__":
    """Create ticket for specified robot."""
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "jira_api_token",
        metavar="JIRA_API_TOKEN",
        type=str,
        nargs=1,
        help="JIRA API Token. Get from https://id.atlassian.com/manage-profile/security.",
    )
    parser.add_argument(
        "email",
        metavar="EMAIL",
        type=str,
        nargs=1,
        help="Email connected to JIRA account.",
    )
    # TODO: write function to get reporter_id from email.
    parser.add_argument(
        "reporter_id",
        metavar="REPORTER_ID",
        type=str,
        nargs=1,
        help="JIRA Reporter ID.",
    )
    # TODO: improve help comment on jira board id.
    parser.add_argument(
        "board_id",
        metavar="BOARD_ID",
        type=str,
        nargs=1,
        help="JIRA Board ID. RABR is 217",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    ip = str(input("Enter Robot IP: "))
    assignee = str(input("Enter Assignee Full Name:"))
    run_or_other = str(
        input(
            "Press ENTER to report run error. If not a run error, type short summary of error: "
        )
    )
    url = "https://opentrons.atlassian.net"
    api_token = args.jira_api_token[0]
    email = args.email[0]
    board_id = args.board_id[0]
    reporter_id = args.reporter_id[0]
    ticket = jira_tool.JiraTicket(url, api_token, email)
    ticket.issues_on_board(board_id)
    users_file_path = ticket.get_jira_users(storage_directory)
    assignee_id = get_user_id(users_file_path, assignee)
    run_log_file_path = ""
    try:
        error_runs = get_error_runs_from_robot(ip)
    except requests.exceptions.InvalidURL:
        print("Invalid IP address.")
        sys.exit()
    if len(run_or_other) < 1:
        one_run = error_runs[-1]  # Most recent run with error.
        (
            summary,
            robot,
            affects_version,
            components,
            whole_description_str,
            run_log_file_path,
        ) = get_run_error_info_from_robot(ip, one_run, storage_directory)
    else:
        (
            summary,
            robot,
            affects_version,
            components,
            whole_description_str,
        ) = get_robot_state(ip, run_or_other)
    # Get Calibration Data
    saved_file_path_calibration, calibration = read_robot_logs.get_calibration_offsets(
        ip, storage_directory
    )
    file_paths = read_robot_logs.get_logs(storage_directory, ip)
    print(f"Making ticket for {summary}.")
    # TODO: make argument or see if I can get rid of with using board_id.
    project_key = "RABR"
    parent_key = project_key + "-" + robot[-1]
    # TODO: read board to see if ticket for run id already exists.
    # CREATE TICKET
    issue_key = ticket.create_ticket(
        summary,
        whole_description_str,
        project_key,
        reporter_id,
        assignee_id,
        "Bug",
        "Medium",
        components,
        affects_version,
        parent_key,
    )
    # OPEN TICKET
    issue_url = ticket.open_issue(issue_key)
    # MOVE FILES TO ERROR FOLDER.

    error_files = [saved_file_path_calibration, run_log_file_path] + file_paths
    error_folder_path = os.path.join(storage_directory, issue_key)
    os.makedirs(error_folder_path, exist_ok=True)
    for source_file in error_files:
        try:
            destination_file = os.path.join(
                error_folder_path, os.path.basename(source_file)
            )
            shutil.move(source_file, destination_file)
        except shutil.Error:
            continue
    # OPEN FOLDER DIRECTORY
    subprocess.Popen(["explorer", error_folder_path])

    # WRITE ERRORED RUN TO GOOGLE SHEET
    if len(run_or_other) < 1:
        # CONNECT TO GOOGLE DRIVE
        credentials_path = os.path.join(storage_directory, "credentials.json")
        google_sheet_name = "ABR-run-data"
        google_drive = google_drive_tool.google_drive(
            credentials_path,
            "1Cvej0eadFOTZr9ILRXJ0Wg65ymOtxL4m",
            "rhyann.clarke@opentrons.ocm",
        )
        # CONNECT TO GOOGLE SHEET
        google_sheet = google_sheets_tool.google_sheet(
            credentials_path, google_sheet_name, 0
        )
        error_run_log = os.path.join(
            error_folder_path, os.path.basename(run_log_file_path)
        )
        try:
            google_drive.upload_file(error_run_log, "1Cvej0eadFOTZr9ILRXJ0Wg65ymOtxL4m")
        except FileNotFoundError:
            print("Run file not uploaded.")
        run_id = os.path.basename(error_run_log).split("_")[1].split(".")[0]
        (
            runs_and_robots,
            headers,
            runs_and_lpc,
            headers_lpc,
        ) = abr_google_drive.create_data_dictionary(
            run_id, error_folder_path, issue_url, "", ""
        )

        start_row = google_sheet.get_index_row() + 1
        google_sheet.batch_update_cells(runs_and_robots, "A", start_row, "0")
        print("Wrote run to ABR-run-data")
        # Add LPC to google sheet
        google_sheet_lpc = google_sheets_tool.google_sheet(
            credentials_path, "ABR-LPC", 0
        )
        start_row_lpc = google_sheet_lpc.get_index_row() + 1
        google_sheet_lpc.batch_update_cells(runs_and_lpc, "A", start_row_lpc, "0")
    else:
        print("Ticket created.")
