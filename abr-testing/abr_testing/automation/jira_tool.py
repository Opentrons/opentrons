"""JIRA Ticket Creator."""

import requests
from requests.auth import HTTPBasicAuth
import json
import webbrowser
import argparse
from typing import List, Tuple


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
        print(f"Opening at {url}.")
        webbrowser.open(url)

    def create_ticket(
        self,
        summary: str,
        description: str,
        project_key: str,
        reporter_id: str,
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
                "reporter": {"id": reporter_id},
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
