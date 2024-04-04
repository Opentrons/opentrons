"""Create ticket for robot with error."""
from typing import List, Tuple
from abr_testing.data_collection import read_robot_logs, abr_google_drive, get_run_logs
import requests
import argparse
from abr_testing.automation import jira_tool


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


def get_error_info_from_robot(
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
    components = ["Flex-RABR"]
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
        "robot_ip",
        metavar="ROBOT_IP",
        type=str,
        nargs=1,
        help="IP address of robot as string.",
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
    ip = args.robot_ip[0]
    url = "https://opentrons.atlassian.net"
    api_token = args.jira_api_token[0]
    email = args.email[0]
    board_id = args.board_id[0]
    reporter_id = args.reporter_id[0]
    ticket = jira_tool.JiraTicket(url, api_token, email)
    error_runs = get_error_runs_from_robot(ip)
    one_run = error_runs[-1]  # Most recent run with error.
    (
        summary,
        robot,
        affects_version,
        components,
        whole_description_str,
        saved_file_path,
    ) = get_error_info_from_robot(ip, one_run, storage_directory)
    # get calibration data
    saved_file_path_calibration, calibration = read_robot_logs.get_calibration_offsets(
        ip, storage_directory
    )
    print(f"Making ticket for run: {one_run} on robot {robot}.")
    # TODO: make argument or see if I can get rid of with using board_id.
    project_key = "RABR"
    parent_key = project_key + "-" + robot[-1]
    issues_ids = ticket.issues_on_board(board_id)
    issue_url, issue_key = ticket.create_ticket(
        summary,
        whole_description_str,
        project_key,
        reporter_id,
        "Bug",
        "Medium",
        components,
        affects_version,
        parent_key,
    )
    ticket.open_issue(issue_key)
    ticket.post_attachment_to_ticket(issue_key, saved_file_path)
    ticket.post_attachment_to_ticket(issue_key, saved_file_path_calibration)
