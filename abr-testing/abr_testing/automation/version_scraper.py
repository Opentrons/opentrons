"""Export bugs from a Jira Initiative using JiraTicket class."""

import csv
import sys
import requests
from typing import List, Dict, Any, Optional
from jira_tool import JiraTicket


class JiraBugExporter(JiraTicket):
    """Extends JiraTicket with initiative bug export capabilities."""

    def search_jql(
        self,
        jql: str,
        fields: str = "*all",
        max_results: int = 100,
        start_at: int = 0,
    ) -> Dict[str, Any]:
        """Generic JQL search with customizable query, fields, and pagination."""
        url = f"{self.url}/rest/api/3/search/jql"
        query = {
            "jql": jql,
            "maxResults": str(max_results),
            "startAt": str(start_at),
            "fields": fields,
        }
        response = requests.get(url, headers=self.headers, auth=self.auth, params=query)
        response.raise_for_status()
        return response.json()

    def get_child_issues(
        self,
        parent_key: str,
        issue_type: Optional[str] = None,
        fields: str = "*all",
    ) -> List[Dict[str, Any]]:
        """Get all child issues under a parent key with optional type filter.
        Handles pagination automatically."""
        jql = f"parent = {parent_key}"
        if issue_type:
            jql += f" AND issuetype = {issue_type}"

        all_issues: List[Dict[str, Any]] = []
        start = 0
        while True:
            result = self.search_jql(
                jql=jql,
                fields=fields,
                max_results=100,
                start_at=start,
            )
            all_issues.extend(result["issues"])
            if start + 100 >= result["total"]:
                break
            start += 100
        return all_issues

    def get_issue_details(self, issue_key: str, fields: str = "*all") -> Dict[str, Any]:
        """Get full details for a single issue by key."""
        url = f"{self.url}/rest/api/3/issue/{issue_key}"
        query = {"fields": fields}
        response = requests.get(url, headers=self.headers, auth=self.auth, params=query)
        response.raise_for_status()
        return response.json()

    @staticmethod
    def extract_description(fields: Dict[str, Any]) -> str:
        """Extract plain text from ADF (Atlassian Document Format) description."""
        desc = fields.get("description")
        if not desc:
            return ""
        if isinstance(desc, str):
            return desc

        def walk(node: Any) -> str:
            text = ""
            if isinstance(node, dict):
                if node.get("type") == "text":
                    text += node.get("text", "")
                for child in node.get("content", []):
                    text += walk(child)
            return text

        return walk(desc).strip()

    @staticmethod
    def extract_comments(fields: Dict[str, Any]) -> str:
        """Extract all comment bodies with authors as a single string."""
        comments = fields.get("comment", {}).get("comments", [])
        texts = []
        for c in comments:
            author = c.get("author", {}).get("displayName", "Unknown")
            body = c.get("body", "")
            if isinstance(body, dict):

                def walk(node: Any) -> str:
                    t = ""
                    if isinstance(node, dict):
                        if node.get("type") == "text":
                            t += node.get("text", "")
                        for child in node.get("content", []):
                            t += walk(child)
                    return t

                body = walk(body)
            texts.append(f"[{author}]: {body.strip()}")
        return " | ".join(texts)

    @staticmethod
    def extract_linked_issues(fields: Dict[str, Any]) -> str:
        """Extract linked issue keys and relationship types."""
        links = fields.get("issuelinks", [])
        result = []
        for link in links:
            link_type = link.get("type", {}).get("name", "")
            if "inwardIssue" in link:
                result.append(f"{link_type} <- {link['inwardIssue']['key']}")
            if "outwardIssue" in link:
                result.append(f"{link_type} -> {link['outwardIssue']['key']}")
        return "; ".join(result)

    @staticmethod
    def extract_attachments(fields: Dict[str, Any]) -> str:
        """Extract attachment filenames and MIME types."""
        attachments = fields.get("attachment", [])
        return "; ".join(
            f"{a['filename']} ({a.get('mimeType', 'unknown')})" for a in attachments
        )

    def export_initiative_bugs(self, initiative_key: str) -> str:
        """Main export: finds all epics under an initiative,
        then all bugs under those epics, and writes to CSV."""

        bug_fields = (
            "key,summary,description,status,priority,assignee,"
            "components,fixVersions,labels,issuetype,parent,"
            "issuelinks,comment,attachment"
        )

        # Step 1: Get all child epics under the initiative
        epics = self.get_child_issues(initiative_key, fields="key,summary")
        epic_keys = [e["key"] for e in epics]
        epic_summaries = {e["key"]: e["fields"]["summary"] for e in epics}
        print(f"Found {len(epic_keys)} epics under {initiative_key}")

        # Step 2: Get all bugs under those epics (paginated)
        epic_keys_str = ", ".join(epic_keys)
        jql = f"parent in ({epic_keys_str}) AND issuetype = Bug"

        bugs: List[Dict[str, Any]] = []
        start = 0
        while True:
            result = self.search_jql(
                jql=jql,
                fields=bug_fields,
                max_results=100,
                start_at=start,
            )
            bugs.extend(result["issues"])
            if start + 100 >= result["total"]:
                break
            start += 100
        print(f"Found {len(bugs)} bugs")

        # Step 3: Write to CSV
        output_file = f"{initiative_key}_bugs.csv"
        with open(output_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    # Tier 1
                    "Key",
                    "Summary",
                    "Description",
                    "Issue Type",
                    "Components",
                    "Fix Version",
                    # Tier 2
                    "Parent Epic Key",
                    "Parent Epic Summary",
                    "Linked Issues",
                    "Comments",
                    "Labels",
                    "Attachments",
                    # Context
                    "Status",
                    "Priority",
                    "Assignee",
                    "Created",
                ]
            )
            for bug in bugs:
                fields = bug["fields"]
                parent_key = fields.get("parent", {}).get("key", "")
                writer.writerow(
                    [
                        # Tier 1
                        bug["key"],
                        fields["summary"],
                        self.extract_description(fields),
                        fields.get("issuetype", {}).get("name", ""),
                        ", ".join(c["name"] for c in (fields.get("components") or [])),
                        ", ".join(v["name"] for v in (fields.get("fixVersions") or [])),
                        # Tier 2
                        parent_key,
                        epic_summaries.get(parent_key, ""),
                        self.extract_linked_issues(fields),
                        self.extract_comments(fields),
                        ", ".join(fields.get("labels") or []),
                        self.extract_attachments(fields),
                        # Context
                        fields["status"]["name"],
                        fields["priority"]["name"],
                        (fields.get("assignee") or {}).get("displayName", "Unassigned"),
                        fields["created"][:10],
                    ]
                )

        print(f"Done! Wrote {len(bugs)} bugs to {output_file}")
        return output_file


if __name__ == "__main__":
    parser = __import__("argparse").ArgumentParser(
        description="Export all bugs under a Jira Initiative to CSV."
    )
    parser.add_argument(
        "initiative_key",
        metavar="INITIATIVE_KEY",
        type=str,
        help="Jira initiative key (e.g., RQA-4770)",
    )
    parser.add_argument(
        "jira_api_token",
        metavar="JIRA_API_TOKEN",
        type=str,
        help="JIRA API Token.",
    )
    parser.add_argument(
        "email",
        metavar="EMAIL",
        type=str,
        help="Email connected to JIRA account.",
    )
    args = parser.parse_args()

    url = "https://opentrons.atlassian.net"
    exporter = JiraBugExporter(url, args.jira_api_token, args.email)
    exporter.export_initiative_bugs(args.initiative_key)
