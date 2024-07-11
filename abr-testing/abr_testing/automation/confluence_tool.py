"""Confluence Page Creator."""

import requests
from requests.auth import HTTPBasicAuth
import json
import webbrowser
import argparse
from typing import List, Dict, Any, Tuple
import os
class Confluence:
    """Connects to Confluence site."""

    def __init__(self, url: str, api_token: str, email: str) -> None:
        """Connect to confluence."""
        self.url = url
        self.api_token = api_token
        self.email = email
        self.auth = HTTPBasicAuth(email, api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
    
    def get_pages_in_space(self, page_id: str) -> List[str]:
        """Get list of child pages under parent page."""
        url = f"{self.url}/wiki/api/v2/pages/{page_id}/children"
        response = requests.request(
            "GET",
            url,
            headers = self.headers,
            auth = self.auth
        )
        results = response.json()
        list_of_pages = []
        for page in results["results"]:
            list_of_pages.append(page["title"])
        return list_of_pages
        
    def create_child_page(self, parent_page_id: str, space_id: str, title_of_page: str, body: str)-> str:
        """Create child page. If title already exists, title is adjusted."""
        list_of_pages = self.get_pages_in_space(parent_page_id)
        while title_of_page in list_of_pages:
            title_of_page = input("Page title already exists. Rename page: ")
            list_of_pages = self.get_pages_in_space(parent_page_id)
        url = f"{self.url}/wiki/api/v2/pages"
        
        payload = json.dumps( {
            "spaceId": space_id,
            "status": "current",
            "title": title_of_page,
            "parentId": parent_page_id,
            "body": {
                "representation": "storage",
                "value": body
            }
            } )

        response = requests.request(
        "POST",
        url,
        data=payload,
        headers=self.headers,
        auth=self.auth
        )
        results = response.json()
        new_page_id = results["id"]
        return new_page_id
    
    def get_page_content(self, page_id: str):
        """Get page content."""
        url = f"{self.url}/wiki/rest/api/content/{page_id}?expand=body.storage,version"
        response = requests.get(url, auth = self.auth)
        page_content = response.json()
        return page_content
        
if __name__ == "__main__":
    """Create confluence page for serialized device."""
    
    parser = argparse.ArgumentParser(description="Creates confluence page for serialized device.")
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
    parser.add_argument(
        "parent_page_id",
        metavar="PARENT_PAGE_ID",
        type=str,
        nargs=1,
        help="ABR PAGE ID is 4019486722. Get Page ID from page information and then c/p from url.",
        default = "4019486722"
    )
    args = parser.parse_args()
    url = "https://opentrons.atlassian.net"

    api_token = args.jira_api_token[0]
    email = args.email[0]
    page_id = args.parent_page_id[0]
    space_id = "175702023"
    reporter_id = args.reporter_id[0]
    confluence_page = Confluence(url, api_token, email)
    body = f"Fast Facts \n Device Type: {device_type}"
    new_page_id = confluence_page.create_child_page(page_id, space_id, body)