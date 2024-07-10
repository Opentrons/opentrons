"""Confluence Page Creator."""

import requests
from requests.auth import HTTPBasicAuth
import json
import webbrowser
import argparse
from typing import List, Dict, Any, Tuple
import os

class Confluence:
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
    # TODO: improve help comment on jira board id.
    parser.add_argument(
        "parent_page_id",
        metavar="PARENT_PAGE_ID",
        type=str,
        nargs=1,
        help="ABR PAGE ID is 4019486722",
        default = "4019486722"
    )
    args = parser.parse_args()
    url = "https://opentrons.atlassian.net"

    api_token = args.jira_api_token[0]
    email = args.email[0]
    board_id = args.board_id[0]
    reporter_id = args.reporter_id[0]
    ticket = JiraTicket(url, api_token, email)