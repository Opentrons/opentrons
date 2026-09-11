"""JIRA Ticket Creator."""

import requests
from requests.auth import HTTPBasicAuth
import json
import webbrowser
from pathlib import Path
import argparse
from typing import List, Dict, Any, Tuple
import os
from dataclasses import dataclass


@dataclass
class JiraCredentials:
    """A class containing Jira token and associated email."""

    email: str
    api_token: str


def get_credentials(storage_directory: str) -> JiraCredentials:
    """Opens and parses local Jira credentials file."""
    credentials_path = os.path.join(storage_directory, "jiraCredentials.json")
    with open(credentials_path) as f:
        jiraCreds = json.load(f)
    email = jiraCreds["Jira API"]["email"]
    api_token = jiraCreds["Jira API"]["key"]
    return JiraCredentials(email, api_token)


class JiraTicket:
    """Connects to JIRA ticket site."""

    def __init__(self, api_token: str, email: str) -> None:
        """Connect to jira."""
        self.url = "https://opentrons.atlassian.net"
        self.api_token = api_token
        self.email = email
        self.auth = HTTPBasicAuth(email, api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def issues_on_board(self, project_key: str) -> List[List[Any]]:
        """Return all Issues on specified Jira board."""
        all_issues = self.get_project_issues(project_key)
        issues_dict = all_issues["issues"]
        issue_ids = []
        for i in issues_dict:
            issue_id = i.get("id")
            issue_summary = i["fields"].get("summary")
            issue_ids.append([issue_id, issue_summary])
        return issue_ids

    def match_issues(self, issue_ids: List[List[str]], ticket_summary: str) -> List:
        """Matches related ticket ID's."""
        to_link = []
        try:
            error = ticket_summary.split("_")[3]
            robot = ticket_summary.split("_")[0]
        except IndexError:
            error = ""
            robot = ""
        # for every issue see if both match, if yes then grab issue ID and add it to a list
        for issue in issue_ids:
            summary = issue[1]
            try:
                issue_error = summary.split("_")[3]
                issue_robot = summary.split("_")[0]
            except IndexError:
                continue
            issue_id = issue[0]
            if robot == issue_robot and error == issue_error:
                to_link.append(issue_id)
        return to_link

    def link_issues(self, to_link: list, ticket_key: str) -> None:
        """Links relevant issues in Jira."""
        for issue in to_link:
            link_data = json.dumps(
                {
                    "inwardIssue": {"key": ticket_key},
                    "outwardIssue": {"id": issue},
                    "type": {"name": "Relates"},
                }
            )
            try:
                response = requests.post(
                    f"{self.url}/rest/api/3/issueLink",
                    headers=self.headers,
                    auth=self.auth,
                    data=link_data,
                )
                response.raise_for_status()
            except requests.exceptions.HTTPError:
                print(
                    f"HTTP error occurred. Ticket ID {issue} was not linked. \
                        Check user permissions and authentication credentials"
                )
            except requests.exceptions.ConnectionError:
                print(f"Connection error occurred. Ticket ID {issue} was not linked.")
            except json.JSONDecodeError:
                print(
                    f"JSON decoding error occurred. Ticket ID {issue} was not linked."
                )

    def open_issue(self, issue_key: str) -> str:
        """Open issue on web browser."""
        url = f"{self.url}/browse/{issue_key}"
        print(f"Opening at {url}.")
        webbrowser.open(url)
        return url

    def get_labels(self) -> List[str]:
        """Get list of available labels."""
        url = f"{self.url}/rest/api/3/label"
        response = requests.request("GET", url, headers=self.headers, auth=self.auth)
        return response.json()

    def create_ticket(
        self,
        summary: str,
        description: str,
        project_key: str,
        assignee_id: str,
        issue_type: str,
        priority: str,
        components: list,
        affects_versions: str,
        labels: list,
        parent: str,
    ) -> Tuple[str, str]:
        """Create ticket."""
        # Check if software version is a field on JIRA, if not replaces with existing version
        data = {
            "fields": {
                "project": {"key": project_key},
                "issuetype": {"name": issue_type},
                "summary": summary,
                "assignee": {"id": assignee_id},
                "labels": labels,
                "priority": {"name": priority},
                "components": [{"name": component} for component in components],
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": description}],
                        }
                    ],
                },
            }
        }

        available_versions = self.get_project_versions(project_key)

        if affects_versions in available_versions:
            data["fields"]["versions"] = [{"name": affects_versions}]
            print(f"Software version {affects_versions} added.")
        else:
            print("Software version of robot not in jira releases.")
        issue_key = ""
        issue_url = ""
        if parent:
            data["fields"]["parent"] = {"key": parent}
        try:
            response = requests.post(
                f"{self.url}/rest/api/3/issue",
                headers=self.headers,
                auth=self.auth,
                json=data,
            )
            response_str = str(response.content)
            response.raise_for_status()
            issue_url = response.json().get("self")
            issue_key = response.json().get("key")
            print(f"issue key: {issue_key}")
            print(f"issue url: {issue_url}")
            if issue_key is None:
                issue_key = ""
                issue_url = ""
                print("Error: Could not create issue. No key returned.")
        except requests.exceptions.HTTPError:
            print(f"HTTP error occurred. Response content: {response_str}")
        except json.JSONDecodeError:
            print(f"JSON decoding error occurred. Response content: {response_str}")
        return issue_key, issue_url

    def post_attachment_to_ticket(self, issue_id: str, attachment_path: str) -> None:
        """Adds attachments to ticket."""
        file = {
            "file": (
                os.path.basename(attachment_path),
                open(attachment_path, "rb"),
                "application-type",
            )
        }
        JSON_headers = {"Accept": "application/json", "X-Atlassian-Token": "no-check"}
        attachment_url = f"{self.url}/rest/api/3/issue/{issue_id}/attachments"
        try:
            response = requests.request(
                "POST",
                attachment_url,
                headers=JSON_headers,
                auth=self.auth,
                files=file,
            )
            print(f"File: {attachment_path} posted to ticket {issue_id}.")
        except json.JSONDecodeError:
            error_message = str(response.content)
            print(f"JSON decoding error occurred. Response content: {error_message}.")

    def get_project_issues(self, project_key: str) -> Dict[str, Any]:
        """Get all issues for a project."""
        url = f"{self.url}/rest/api/3/search/jql"
        query = {
            "jql": 'project = "Robotics ABR"',
            "maxResults": "273",
            "reconcileIssues": "2154",
            "fields": "assignee, summary, id",
        }
        response = requests.request(
            "GET",
            url,
            headers=self.headers,
            auth=self.auth,
            params=query,
        )

        return response.json()

    def get_project_versions(self, project_key: str) -> List[str]:
        """Get all project software versions."""
        url = f"{self.url}/rest/api/3/project/{project_key}/versions"
        headers = {"Accept": "application/json"}
        version_list = []
        response = requests.request("GET", url, headers=headers, auth=self.auth)
        versions = response.json()
        for version in versions:
            version_list.append(version["name"])
        return version_list

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

    def save_users_to_file(self, users: Dict[str, Any], storage_directory: Path) -> str:
        """Save users to a JSON file."""
        file_path = os.path.join(storage_directory, "RABR_Users.json")
        with open(file_path, mode="w") as file:
            json.dump(users, file, indent=4)
        return file_path

    def get_jira_users(self, storage_directory: Path, project_key: str) -> str:
        """Get all Jira users associated with the project key."""
        try:
            issues = self.get_project_issues(project_key)
            users = self.extract_users_from_issues(issues)
            file_path = self.save_users_to_file(users, storage_directory)
        except requests.RequestException as e:
            print(f"Request error occurred: {e}")
        except json.JSONDecodeError:
            print("JSON decoding error occurred.")
        return file_path

    def get_project_components(self, project_id: str) -> List[Dict[str, str]]:
        """Get list of components on JIRA board."""
        component_url = f"{self.url}/rest/api/3/project/{project_id}/components"
        response = requests.get(component_url, headers=self.headers, auth=self.auth)
        components_list = response.json()
        if not isinstance(components_list, list):
            print(
                f"Failed to get components for project '{project_id}': {components_list}"
            )
            return []
        return components_list

    def comment(self, content_list: List[Dict[str, Any]], issue_key: str) -> None:
        """Leave comment on JIRA Ticket."""
        comment_url = f"{self.url}/rest/api/3/issue/{issue_key}/comment"
        payload = json.dumps(
            {
                "body": {
                    "type": "doc",
                    "version": 1,
                    "content": content_list,
                }
            }
        )
        requests.request(
            "POST", comment_url, data=payload, headers=self.headers, auth=self.auth
        )

    def format_jira_comment(self, comment_info: Any) -> List[Dict[str, Any]]:
        """Formats a string input to work with the "comment" function."""
        content_list: List = []
        line_1 = {
            "type": "paragraph",
            "content": [{"type": "text", "text": comment_info}],
        }
        content_list.insert(0, line_1)
        return content_list

    def get_ticket(self) -> str:
        """Gets and confirms jira ticket number."""
        while True:
            issue_key = input("Ticket Key: ")
            url = f"{self.url}/rest/api/3/issue/{issue_key}"
            headers = {"Accept": "application/json"}
            response = requests.request("GET", url, headers=headers, auth=self.auth)
            if str(response) == "<Response [200]>":
                break
            else:
                print("Please input a valid JIRA Key")
        return issue_key


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

    api_token = args.jira_api_token[0]
    email = args.email[0]
    board_id = args.board_id[0]
    reporter_id = args.reporter_id[0]
    ticket = JiraTicket(api_token, email)
