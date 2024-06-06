"""JIRA Ticket Creator."""

import requests
from requests.auth import HTTPBasicAuth
import json
import webbrowser
import argparse
from typing import List, Dict, Any
import os


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

    def open_issue(self, issue_key: str) -> str:
        """Open issue on web browser."""
        url = f"{self.url}/browse/{issue_key}"
        print(f"Opening at {url}.")
        webbrowser.open(url)
        return url

    def create_ticket(
        self,
        summary: str,
        description: str,
        project_key: str,
        reporter_id: str,
        assignee_id: str,
        issue_type: str,
        priority: str,
        components: list,
        affects_versions: str,
        robot: str,
    ) -> str:
        """Create ticket."""
        data = {
            "fields": {
                "project": {"id": "10273", "key": project_key},
                "issuetype": {"name": issue_type},
                "summary": summary,
                "reporter": {"id": reporter_id},
                "assignee": {"id": assignee_id},
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
                f"{self.url}/rest/api/3/issue",
                headers=self.headers,
                auth=self.auth,
                json=data,
            )
            response.raise_for_status()
            response_str = str(response.content)
            issue_url = response.json().get("self")
            issue_key = response.json().get("key")
            print(f"issue key {issue_key}")
            print(f"issue url{issue_url}")
            if issue_key is None:
                print("Error: Could not create issue. No key returned.")
        except requests.exceptions.HTTPError:
            print(f"HTTP error occurred. Response content: {response_str}")
        except json.JSONDecodeError:
            print(f"JSON decoding error occurred. Response content: {response_str}")
        return issue_key

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

    def get_project_issues(self, project_key: str) -> Dict[str, Any]:
        """Retrieve all issues for the given project key."""
        headers = {"Accept": "application/json"}
        query = {"jql": f"project={project_key}"}
        response = requests.request(
            "GET",
            f"{self.url}/rest/api/3/search",
            headers=headers,
            params=query,
            auth=self.auth,
        )
        response.raise_for_status()
        return response.json()

    def extract_users_from_issues(self, issues: dict) -> Dict[str, Any]:
        """Extract users from issues."""
        users = dict()
        for issue in issues["issues"]:
            assignee = issue["fields"].get("assignee")
            if assignee is not None:
                account_id = assignee["accountId"]
                users[account_id] = {
                    "displayName": assignee["displayName"],
                    "accountId": account_id,
                }
            reporter = issue["fields"].get("reporter")
            if reporter is not None:
                account_id = reporter["accountId"]
                users[account_id] = {
                    "displayName": reporter["displayName"],
                    "accountId": account_id,
                }
        return users

    def save_users_to_file(self, users: Dict[str, Any], storage_directory: str) -> str:
        """Save users to a JSON file."""
        file_path = os.path.join(storage_directory, "RABR_Users.json")
        with open(file_path, mode="w") as file:
            json.dump(users, file, indent=4)
        return file_path

    def get_jira_users(self, storage_directory: str) -> str:
        """Get all Jira users associated with the project key."""
        try:
            issues = self.get_project_issues("RABR")
            users = self.extract_users_from_issues(issues)
            file_path = self.save_users_to_file(users, storage_directory)
        except requests.RequestException as e:
            print(f"Request error occurred: {e}")
        except json.JSONDecodeError:
            print("JSON decoding error occurred.")
        return file_path


if __name__ == "__main__":
    """Create ticket for specified robot."""
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
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
    url = "https://opentrons.atlassian.net"

    api_token = args.jira_api_token[0]
    email = args.email[0]
    board_id = args.board_id[0]
    reporter_id = args.reporter_id[0]
    ticket = JiraTicket(url, api_token, email)
