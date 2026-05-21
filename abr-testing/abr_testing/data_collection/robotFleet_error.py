"""Create ticket for robot with error."""
from typing import List, Tuple, Any, Dict, Optional
from abr_testing.data_collection import read_robot_logs, abr_google_drive, get_run_logs
import requests
import argparse
from abr_testing.automation import jira_tool, google_sheets_tool, google_drive_tool
import shutil
import os
import subprocess
import platform
from datetime import datetime, timedelta
import sys
import json
import re
from pathlib import Path
import pandas as pd
from statistics import mean, StatisticsError
from abr_testing.tools import plate_reader


def open_folder(path: str) -> None:
    """Open file folder on mac or windows."""
    system = platform.system()
    if system == "Windows":
        subprocess.Popen(["explorer", path])
    elif system == "Darwin":
        subprocess.Popen(["open", path])
    else:
        raise OSError("Unsupported operating system")


def retrieve_version_file(
    robot_ip: str,
    storage: str,
) -> Path | str:
    """Retrieve Version file."""
    version_file_path = "/etc/VERSION.json"
    save_dir = Path(f"{storage}")
    print(save_dir)
    command = ["scp", "-r", f"root@{robot_ip}:{version_file_path}", save_dir]
    try:
        subprocess.run(command, check=True)  # type: ignore
        return os.path.join(save_dir, "VERSION.json")
    except subprocess.CalledProcessError as e:
        print(f"Error during file transfer: {e}")
        return ""


def retrieve_protocol_images(run_id: str, robot_ip: str, storage: str) -> str:
    """Save all capture images for a run."""
    save_dir = Path(f"{storage}")
    new_save_dir = Path(f"{storage}/{run_id}")
    command = ["scp", "-r", f"root@{robot_ip}:/data/images/{run_id}/", save_dir]
    zip_path = f"storage_directory/{run_id}_images.zip"
    try:
        subprocess.run(command, check=True)  # type: ignore
        shutil.make_archive(
            base_name=str(zip_path).replace(".zip", ""),
            format="zip",
            root_dir=save_dir,
        )
        subprocess.run(["rm", "-r", new_save_dir], check=True)
        print("Image folder transfered successful!")
        return str(zip_path)
    except subprocess.CalledProcessError as e:
        print(f"Error during file transfer: {e}")
    return ""


def retrieve_protocol_file(protocol_id: str, robot_ip: str, storage: str) -> Path | str:
    """Find and copy protocol file on robot with error handling."""
    # List folders in the robot's directory
    list_folder_command = [
        "ssh",
        f"root@{robot_ip}",
        "ls /var/lib/opentrons-robot-server",
    ]
    try:
        result = subprocess.run(
            list_folder_command, check=True, capture_output=True, text=True
        )
        folders = result.stdout.splitlines()

        def convert_to_floats(data: List) -> List:
            """Convert list to floats."""
            float_list = []
            for item in data:
                try:
                    float_value = float(item)
                    float_list.append(float_value)
                except ValueError:
                    pass  # Ignore items that cannot be converted to float
            return float_list

        folders_float = convert_to_floats(folders)
        if not folders_float:
            print("No folders found.")
            return ""
        folder_num = max(
            folders_float
        )  # Assuming the highest folder number is the latest
        if folder_num.is_integer():
            folder_num = int(folder_num)
    except subprocess.CalledProcessError:
        print("Could not find folder.")
        return ""
    protocol_dir = (
        f"/var/lib/opentrons-robot-server/{folder_num}/protocols/{protocol_id}"
    )

    # Copy protocol file found in robot onto host computer
    save_dir = Path(f"{storage}")
    command = ["scp", "-r", f"root@{robot_ip}:{protocol_dir}", save_dir]
    try:
        # If file found and copied return path to file
        subprocess.run(command, check=True)  # type: ignore
        print("File transfer successful!")
        return save_dir
    except subprocess.CalledProcessError as e:
        print(f"Error during file transfer: {e}")
        # Return empty string if file can't be copied
    return ""


def read_each_log(folder_path: str, issue_url: str) -> None:
    """Read log and comment error portion on JIRA ticket."""
    for file_name in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file_name)
        not_found_words = []
        if file_path.endswith(".log"):
            with open(file_path) as file:
                lines = file.readlines()
            words = [
                "error",
                "traceback",
                "error frame encountered",
                "did not receive",
                "collision_detected",
                "fail",
                "warning",
                "failure",
                "homingfail",
                "timed out",
                "exception",
            ]
            error_lines = ""
            for word in words:
                content_list = []
                for line_index, line in enumerate(lines):
                    if word in line.lower():
                        lines_before = max(0, line_index - 10)
                        lines_after = min(len(lines), line_index + 10)
                        error_lines = "".join(lines[lines_before:lines_after])
                        code_lines = {
                            "type": "codeBlock",
                            "content": [{"type": "text", "text": error_lines}],
                        }
                        content_list.append(code_lines)
                num_times = len(content_list)
                if num_times == 0:
                    not_found_words.append(word)
                else:
                    message = f"Key word '{word.upper()}' found in {file_name} {num_times} TIMES."
                    line_1 = {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": message}],
                    }
                    content_list.insert(0, line_1)
                    ticket.comment(content_list, issue_key)
            no_word_found_message = (
                f"Key words '{not_found_words} were not found in {file_name}."
            )
            no_word_found_dict = {
                "type": "paragraph",
                "content": [{"type": "text", "text": no_word_found_message}],
            }
            content_list.append(no_word_found_dict)
            ticket.comment(content_list, issue_key)


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


def get_error_runs_from_robot(ip: str) -> Tuple[List[str], List[str]]:
    """Get runs that have errors from robot."""
    error_run_ids = []
    protocol_ids = []
    response = requests.get(
        f"http://{ip}:31950/runs", headers={"opentrons-version": "3"}
    )
    print("STATUS:", response.status_code)
    run_data = response.json()
    run_list = run_data.get("data", [])
    for run in run_list:
        run_id = run["id"]
        protocol_id = run["protocolId"]
        num_of_errors = len(run["errors"])
        if not run["current"] and num_of_errors > 0:
            error_run_ids.append(run_id)
            # Protocol ID will identify the correct folder on the robot of the protocol file
            protocol_ids.append(protocol_id)
    return (error_run_ids, protocol_ids)


def get_robot_state(
    ip: str, reported_string: str, project_key: str
) -> Tuple[Any, Any, Any, List[str], List[str], str]:
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
    print(f"health data {health_data}")
    robot = health_data.get("name", "")
    # Create summary name
    description["robot_name"] = robot
    summary = robot + "_" + reported_string
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
    components = []
    #components = ["Flex-RABR"] THIS IS WHERE THE COMPONENT STUFF IS ADDED
    components = match_error_to_component(project_key, reported_string, components)
    if "9.0.0" in affects_version:
        affects_version = "9.0.0-alpha.0"
    # I NEED TO REMOVE THE ABOVE IT WILL BREAK STUFF
    if "alpha" in affects_version:
        components.append("flex internal release")
    if "flexStacker" in str(description):
        components.append("Flex Stacker")
    labels = [robot]
    if "8.2" in affects_version:
        labels.append("8_2_0")
    parent = affects_version + " Bugs"
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
        labels,
        whole_description_str,
    )


def get_run_error_info_from_robot(
    ip: str, one_run: str, storage_directory: Path, protocol_found: bool, project_key: str
) -> Tuple[str, str, str, List[str], List[str], str, str]:
    """Get error information from robot to fill out ticket."""
    description = dict()
    # get run information
    results = get_run_logs.get_run_data(one_run, ip)
    # Get version file

    # save run information to local directory as .json file
    saved_file_path = read_robot_logs.save_run_log_to_json(
        ip, results, storage_directory
    )
    # Error Printout
    error_dict = read_robot_logs.get_error_info(results)
    error_level = error_dict["Error_Level"]
    error_type = error_dict["Error_Type"]
    error_code = error_dict["Error_Code"]
    error_instrument = error_dict["Error_Instrument"]
    # JIRA Ticket Fields
    robot = results.get("robot_name", "")
    failure_level = "Level " + str(error_level) + " Failure"

    #components = [failure_level, "Flex-RABR"]
    components = match_error_to_component(project_key, str(error_type), components)
    affects_version = results["API_Version"]
    if "alpha" in affects_version:
        components.append("flex internal releases")
    labels = [robot]
    if "8.2" in affects_version:
        labels.append("8_2_0")
    parent = affects_version + " Bugs"
    summary = robot + "_" + str(one_run) + "_" + str(error_code) + "_" + error_type
    # Description of error
    description["protocol_name"] = results["protocol"]["metadata"].get(
        "protocolName", ""
    )

    # If Protocol was successfully retrieved from the robot
    description["protocol_found_on_robot"] = protocol_found
    # Get start and end time of run
    start_time = datetime.strptime(
        results.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
    )
    adjusted_start_time = start_time - timedelta(hours=4)
    complete_time = datetime.strptime(
        results.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
    )
    adjusted_complete_time = complete_time - timedelta(hours=4)

    # Build ticket description: error summary, last protocol step, mount/gripper attachments, and module info
    description["error"] = " ".join([error_code, error_type, error_instrument])
    protocol_step = list(results["commands"])[-1]
    errored_labware_id = protocol_step["params"].get("labwareId", "")
    errored_labware_dict = {}
    description["protocol_step"] = protocol_step
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
        labels,
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
    
    args = parser.parse_args()
    while True:
        board = str(input("Enter ABR or RQA: ")).upper()
        if board == "ABR":
            board_id = str(217)
            project_key = "RABR"
            break
        elif board == "RQA":
            board_id = str(826)
            project_key = "RQA"
            break
        else:
            print("Invalid input, try again.")

    storage_directory = args.storage_directory[0]
    ip = str(input("Enter Robot IP: "))
    assignee = str(input("Enter Assignee Full Name: "))
    run_or_other = str(
        input(
            "Press ENTER to report run error. If not a run error, type short summary of error: "
        )
    )
    url = "https://opentrons.atlassian.net"
    api_token = args.jira_api_token[0]
    email = args.email[0]
    log_zip_path = read_robot_logs.get_logs(storage_directory, ip)
    ticket = jira_tool.JiraTicket(url, api_token, email)
    users_file_path = ticket.get_jira_users(storage_directory, project_key)
    assignee_id = get_user_id(users_file_path, assignee)
    run_log_file_path = ""
    protocol_found = False
    try:
        error_runs, protocol_ids = get_error_runs_from_robot(ip)
    except requests.exceptions.InvalidURL:
        print("Invalid IP address.")
        sys.exit()
    #TODO: automatically populate this from robotFleet info
    version_file_dir = retrieve_version_file(robot_ip=ip, storage=storage_directory)
    version_file_path = os.path.join(storage_directory, version_file_dir)
    protocol_file_path = ""
    if len(run_or_other) < 1:
        # Retrieve the most recently run protocol file
        protocol_folder = retrieve_protocol_file(
            protocol_ids[-1], ip, storage_directory
        )
        protocol_folder_path = os.path.join(protocol_folder, protocol_ids[-1])
        # Path to protocol folder
        try:
            protocol_file_path = next(
                os.path.join(protocol_folder_path, f)
                for f in os.listdir(protocol_folder_path)
                if f.endswith(".py")
            )
        except (FileNotFoundError, StopIteration):
            print(f"No .py file found or folder not found: {protocol_folder_path}")

        # Set protocol_found to true if python protocol was successfully copied over
        if protocol_file_path:
            protocol_found = True

        one_run = error_runs[-1]  # Most recent run with error.
        (
            summary,
            parent,
            affects_version,
            components,
            labels,
            whole_description_str,
            run_log_file_path,
        ) = get_run_error_info_from_robot(
            ip, one_run, storage_directory, protocol_found, project_key
        )
    else:
        (
            summary,
            parent,
            affects_version,
            components,
            labels,
            whole_description_str,
        ) = get_robot_state(ip, run_or_other, project_key)
    # Get Calibration Data
    saved_file_path_calibration, calibration = read_robot_logs.get_calibration_offsets(
        ip, storage_directory
    )
    image_files = ""
    if len(run_or_other) < 1:
        image_files = retrieve_protocol_images(one_run, ip, storage_directory)

    print(f"Making ticket for {summary}.")
    all_issues = ticket.issues_on_board(project_key)
    # CREATE TICKET
    #TODO: for pyro, add pyro filter as HIGH priority
    issue_key, raw_issue_url = ticket.create_ticket(
        summary,
        whole_description_str,
        project_key,
        assignee_id,
        "Bug",
        "Medium",
        components,
        affects_version,
        labels,
    )
    # Link Tickets - TODO: FIX THIS TO WORK
    to_link = ticket.match_issues(all_issues, summary)
    ticket.link_issues(to_link, issue_key)
    # OPEN TICKET
    issue_url = ticket.open_issue(issue_key)
    # MOVE FILES TO ERROR FOLDER.
    error_files = [
        saved_file_path_calibration,
        run_log_file_path,
        protocol_file_path,
        version_file_path,
        log_zip_path,
        image_files,
    ]
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
    # POST ALL FILES TO TICKET
    list_of_files = os.listdir(error_folder_path)
    for file in list_of_files:
        file_to_attach = os.path.join(error_folder_path, file)
        ticket.post_attachment_to_ticket(issue_key, file_to_attach)
    # ADD ERROR COMMENTS TO TICKET
    read_each_log(error_folder_path, raw_issue_url)