"""JIRA Ticket Creator."""

import requests
from requests.auth import HTTPBasicAuth
import json
import webbrowser
import argparse
from typing import List, Tuple
from abr_testing.data_collection import read_robot_logs, abr_google_drive, get_run_logs


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


class JiraTicket:
    """Connects to JIRA ticket site."""

    def __init__(self, url: str, api_token: str, email: str) -> None:
        """Connect to jira."""
        self.url = url
        self.api_token = api_token
        self.email = email
        self.auth = HTTPBasicAuth(email, api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def issues_on_board(self, board_id: str) -> List[str]:
        """Print Issues on board."""
        response = requests.get(
            f"{self.url}/rest/agile/1.0/board/{board_id}/issue",
            headers=self.headers,
            auth=self.auth,
        )
        response.raise_for_status()
        try:
            board_data = response.json()
            all_issues = board_data["issues"]
        except json.JSONDecodeError as e:
            print("Error decoding json: ", e)
        issue_ids = []
        for i in all_issues:
            issue_id = i.get("id")
            issue_ids.append(issue_id)
        return issue_ids

    def open_issue(self, issue_key: str) -> None:
        """Open issue on web browser."""
        url = f"{self.url}/browse/{issue_key}"
        webbrowser.open(url)

    def create_ticket(
        self,
        summary: str,
        description: str,
        project_key: str,
        issue_type: str,
        priority: str,
        components: list,
        affects_versions: str,
        robot: str,
    ) -> Tuple[str, str]:
        """Create ticket."""
        data = {
            "fields": {
                "project": {"id": "10273", "key": project_key},
                "issuetype": {"name": issue_type},
                "summary": summary,
                "reporter": {
                    "accountId": "712020:f32d03f8-f91a-465d-871b-45135b7b955f"
                },
                "parent": {"key": robot},
                "priority": {"name": priority},
                "components": [{"name": component} for component in components],
                "versions": [{"name": affects_versions}],
                "description": {
                    "content": [
                        {
                            "content": [{"text": description, "type": "text"}],
                            "type": "paragraph",
                        }
                    ],
                    "type": "doc",
                    "version": 1,
                }
                # Include other required fields as needed
            }
        }
        try:
            response = requests.post(
                f"{self.url}/rest/api/3/issue/",
                headers=self.headers,
                auth=self.auth,
                json=data,
            )
            response.raise_for_status()
            response_str = str(response.content)
            issue_url = response.json().get("self")
            issue_key = response.json().get("key")
            if issue_key is None:
                print("Error: Could not create issue. No key returned.")
        except requests.exceptions.HTTPError:
            print(f"HTTP error occurred. Response content: {response_str}")
        except json.JSONDecodeError:
            print(f"JSON decoding error occurred. Response content: {response_str}")
        return issue_url, issue_key

    def post_attachment_to_ticket(self, issue_id: str, attachment_path: str) -> None:
        """Adds attachments to ticket."""
        # TODO: Ensure that file is actually uploaded.
        file = {"file": open(attachment_path, "rb")}
        JSON_headers = {"Accept": "application/json"}
        try:
            response = requests.post(
                f"{self.url}/rest/api/3/issue/{issue_id}/attachments",
                headers=JSON_headers,
                auth=self.auth,
                files=file,
            )
            print(response)
        except json.JSONDecodeError:
            error_message = str(response.content)
            print(f"JSON decoding error occurred. Response content: {error_message}.")


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

    ticket = JiraTicket(url, api_token, email)
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
    print(f"Making ticket for run: {one_run} on robot {robot}.")
    # TODO: make argument or see if I can get rid of with using board_id.
    project_key = "RABR"
    parent_key = project_key + "-" + robot[-1]
    issue_url, issue_key = ticket.create_ticket(
        summary,
        whole_description_str,
        project_key,
        "Bug",
        "Medium",
        components,
        affects_version,
        parent_key,
    )
    ticket.open_issue(issue_key)
    ticket.post_attachment_to_ticket(issue_key, saved_file_path)
