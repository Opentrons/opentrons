"""Connect Jira and Slack User emails to allow for channel tagging."""
import argparse
import json
import logging as log
import sys
from urllib import parse
import time
import requests
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_sdk.web.slack_response import SlackResponse
from typing import Dict, Any, Tuple, Optional, Union, List, Callable

##############################################################################
# Configuration
##############################################################################

# Set base log level
log.basicConfig(level=log.INFO)

# Pagination limit for Slack 'list_users'
SLACK_PAGINATION_LIMIT = 30

# Delay in between API calls
API_DELAY_MS = 100

# Timeout for API calls in seconds
API_TIMEOUT = 60


##############################################################################


def delayed_api(func: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to add a delay in between API calls."""

    def wrapper(*args: Any, **kwargs: Any) -> Any:
        """Delays API."""
        log.debug("Delaying API call by {}ms".format(API_DELAY_MS))
        if API_DELAY_MS:
            time.sleep(API_DELAY_MS / 1000.0)
        return func(*args, **kwargs)

    return wrapper


def gather_slack_details(client: WebClient) -> Dict[str, Tuple[str, str]]:
    """Returns a dict of all users (not bots, with email IDs) for a given workspace.

    Args:
        client: slack.web.client.WebClient
            Slack WebClient module which is already authenticated
    Returns:
        dict
            Returns a dict, wheres keys are 'emails' and values are tuples of Slack usernames
            (which can be tagged with `@`) and Slack IDs.
    """
    # Helper method to call a page of users
    @delayed_api
    def _get_active_users(
        client: WebClient, next_cursor: Optional[str] = None
    ) -> Tuple[Dict[str, Tuple[str, str]], Optional[str]]:
        """Get all active users of slack."""
        log.debug("Getting next {} members...".format(SLACK_PAGINATION_LIMIT))
        try:
            response: SlackResponse = client.users_list(
                limit=SLACK_PAGINATION_LIMIT, cursor=next_cursor
            )
        except SlackApiError as e:
            log.error(f"Error fetching users: {e.response['error']}")
            return {}, None

        users: List[Dict[str, Any]] = response.get("members", [])
        response_metadata: Dict[str, Any] = response.get("response_metadata", {})

        # Format email:slack_id object if user is active and email ends with opentrons.com
        return (
            {
                u["profile"]["email"]: (u["name"], u["id"])
                for u in users
                if not u["is_bot"]
                and not u["deleted"]
                and "email" in u["profile"]
                and u["profile"]["email"].split("@")[1] == "opentrons.com"
            },
            response_metadata.get("next_cursor"),
        )

    active_users, next_cursor = _get_active_users(client)
    # Check if next page available, and update users
    while next_cursor:
        next_active_users, next_cursor = _get_active_users(client, next_cursor)
        active_users.update(next_active_users)
    return active_users


class JIRA(object):
    """Creates JIRA Class."""

    _SEARCH_PATH: str = "rest/api/3/user/search"
    _PROPERTY_PATH: str = "rest/api/3/user/properties/"
    _HEADERS: Dict[str, str] = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    def _wrap_error(
        self, error_message: str, response: requests.models.Response
    ) -> None:
        """Helper to log HTTPResponse errors."""
        log.error(
            "{} [{}] {}".format(error_message, response.status_code, response.json())
        )

    def __init__(self, server_url: str, username: str, api_token: str) -> None:
        """Create a new JIRA Webclient.

        Args:
            server_url: str
                JIRA server side URL
            username: str
                Atlassian account email (`@atlassian.com`) associated with JIRA server
            api_token: str
                User API token generated from `https://id.atlassian.com/manage/api-tokens`.
        """
        self.server_url = server_url
        self.username = username
        self.api_token = api_token
        self.search_url: str = parse.urljoin(self.server_url, self._SEARCH_PATH)
        self.property_url = parse.urljoin(self.server_url, self._PROPERTY_PATH)

    @delayed_api
    def get_user(self, email: str) -> Optional[str]:
        """Search for a user by e-mail and return the account ID if found.

        Args:
            email: str
                Email ID pattern to search user with

        Returns:
            str/None
                Return the account ID of the user if found in JIRA server, else return None.
        """
        params: Dict[str, Union[str, int]] = {"query": email, "maxResults": 1}
        response = requests.get(
            self.search_url,
            auth=(self.username, self.api_token),
            headers=self._HEADERS,
            params=params,
            timeout=API_TIMEOUT,
        )
        if response:
            json_response = response.json()
            if len(json_response) > 0:
                return json_response[0]["accountId"]
            log.warning("No user found for email: {}".format(email))
        else:
            self._wrap_error("Failed to call search API.", response)
        return None

    @delayed_api
    def set_user_property(
        self, account_id: str, slack_username: str, slack_id: str, key: str = "metadata"
    ) -> bool:
        """Set user property (slack_id) for a given account ID in the JIRA server."""
        response = requests.put(
            parse.urljoin(self.property_url, key),
            auth=(self.username, self.api_token),
            headers=self._HEADERS,
            params={"accountId": account_id},
            data=json.dumps({"slack_username": slack_username, "slack_id": slack_id}),
            timeout=API_TIMEOUT,
        )
        if not response:
            self._wrap_error(
                "Could not add property for account: {}".format(account_id), response
            )
            return False
        else:
            log.info(
                "User `metadata.value.slack_id:{}, metadata.value.slack_username:{}` set {}".format(
                    slack_id, slack_username, account_id
                )
            )
            return True

    def get_slack_info(self, account_id: str) -> Optional[Tuple[str, str]]:
        """Get slack username, slack ID property values ({account_id}/properties/metadata)."""
        response = requests.get(
            parse.urljoin(self.property_url, "metadata"),
            auth=(self.username, self.api_token),
            headers=self._HEADERS,
            params={"accountId": account_id},
            timeout=API_TIMEOUT,
        )
        if response:
            json_response = response.json()
            metadata_value = json_response.get("value", {})
            if "slack_id" in metadata_value and "slack_username" in metadata_value:
                return metadata_value["slack_id"], metadata_value["slack_username"]
        self._wrap_error(
            "Could not find a slack_id/slack_username property for account: {}".format(
                account_id
            ),
            response,
        )
        return None


if __name__ == "__main__":
    # Parse CLI arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("--jira_url", type=str, required=True, help="JIRA Server URL")
    parser.add_argument(
        "--slack_token", type=str, required=True, help="Slack App Authentication Token"
    )
    parser.add_argument(
        "--username", type=str, required=True, help="Atlassian e-mail ID"
    )
    parser.add_argument("--apikey", type=str, required=True, help="Atlassian API key")
    args, _ = parser.parse_known_args()

    # Gather list of slack users associated with slack token's workspace
    slack_client = WebClient(token=args.slack_token)
    slack_users = gather_slack_details(slack_client)
    total_users = len(slack_users)
    if not slack_users:
        log.warning(
            "No user found for the given Slack workspace associated with token. Exiting!"
        )
        sys.exit(0)

    # Create a new JIRA Web Client
    jira = JIRA(args.jira_url, args.username, args.apikey)

    # Iterate over each slack user, find JIRA account ID and set slack property
    accounts_found = 0
    properties_updated = 0
    for email, (slack_username, slack_id) in slack_users.items():
        log.debug(
            "Trying to find account ID and update Slack details for {}".format(email)
        )
        account_id = jira.get_user(email)
        if account_id:
            accounts_found += 1
            log.info("Found account ID: {} for user: {}".format(account_id, email))
            # Update user property
            if jira.set_user_property(account_id, slack_username, slack_id):
                properties_updated += 1

    log.info(
        "Updated {} propertie(s) in {} account(s) found in Jira (Total {} Slack member(s))".format(
            properties_updated, accounts_found, total_users
        )
    )
