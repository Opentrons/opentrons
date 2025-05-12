"""Slack Functions for Robot Communication."""
from slack_sdk import WebClient
from slack_sdk.web.slack_response import SlackResponse
import configparser
import os
from typing import Optional, List, cast
from opentrons.protocols.parameters.types import ParameterChoice


class Slack:
    """Slack Tool."""

    def __init__(
        self,
        configuration: configparser.ConfigParser,
        channel_name: str,
        user_name: str,
    ) -> None:
        """Connects to slack channel."""
        slack_token = configuration["DEFAULT"]["slack_token"]
        self.client = WebClient(token=slack_token)
        self.channel = channel_name
        self.user_name = user_name
        # If user is a robot, then the icon will be the opentron logo
        if user_name.startswith("DVT") or user_name.startswith("PVT"):
            self.icon_emoji = ":robot_face:"
        else:
            self.icon_emoji = ":gear:"
            print("Using computer icon for non-robot user.")

    def get_users_in_channel(self, channel_id: str) -> List[ParameterChoice]:
        """Get all active, human users in a specific Slack channel."""
        all_member_ids: List[str] = []
        channel_cursor: Optional[str] = None

        while True:
            response_members: SlackResponse = self.client.conversations_members(
                channel=channel_id, cursor=channel_cursor
            )
            if not cast(dict, response_members).get("ok", False):
                raise Exception("Failed to get channel members from Slack API.")

            all_member_ids.extend(
                cast(list, cast(dict, response_members).get("members", []))
            )
            channel_cursor = cast(
                Optional[str],
                cast(dict, response_members)
                .get("response_metadata", {})
                .get("next_cursor"),
            )
            if not channel_cursor:
                break

        user_list: List[ParameterChoice] = []
        user_cursor: Optional[str] = None

        while True:
            response: SlackResponse = self.client.users_list(cursor=user_cursor)
            if not cast(dict, response).get("ok", False):
                raise Exception("Failed to get users from Slack API.")

            users: List[dict] = cast(list, cast(dict, response).get("members", []))
            for user in users:
                user_id = user.get("id")
                profile = user.get("profile", {})
                if (
                    user_id in all_member_ids
                    and not user.get("deleted", False)
                    and not user.get("is_bot", False)
                ):
                    first_name = profile.get("first_name", "").strip()
                    last_name = profile.get("last_name", "").strip()
                    display_name = (
                        profile.get("real_name", "Unknown User")
                        if not first_name and not last_name
                        else f"{first_name} {last_name}".strip()
                    )
                    user_list.append(
                        ParameterChoice(display_name=display_name, value=user_id)
                    )
            user_cursor = cast(
                Optional[str],
                cast(dict, response).get("response_metadata", {}).get("next_cursor"),
            )
            if not user_cursor:
                break

        return user_list

    def send_slack_message(
        self,
        message: str,
        image_path: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """Send slack message with or without image."""
        tagged_user = f"<@{user_id}> " if user_id and user_id.lower() != "none" else ""
        message = tagged_user + " " + message
        if image_path:
            response = self.client.files_upload(
                channels=self.channel,
                file=image_path,
                title=os.path.basename(image_path).split(".")[0],
            )
            response.validate()
            file_permalink = response["file"]["permalink"]
            self.client.chat_postMessage(
                channel=self.channel,
                blocks=[
                    {
                        "type": "image",
                        "image_url": file_permalink,
                    }
                ],
                text=message,
                username=self.user_name,
                icon_emoji=self.icon_emoji,
            )
        else:
            self.client.chat_postMessage(
                channel=self.channel,
                text=message,
                username=self.user_name,
                icon_emoji=self.icon_emoji,
            )

    def send_run_completed_message(
        self, protocol_name: str, user_id: Optional[str] = None
    ) -> None:
        """Send run completed message."""
        tagged_user = f"<@{user_id}> " if user_id and user_id.lower() != "none" else ""
        message = f"{tagged_user} {protocol_name} has completed successfully."
        self.send_slack_message(message)

    def send_run_started_message(
        self, protocol_name: str, user_id: Optional[str] = None
    ) -> None:
        """Send run started message."""
        tagged_user = f"<@{user_id}> " if user_id and user_id.lower() != "none" else ""
        message = f"{tagged_user} Protocol: {protocol_name} has started."
        self.send_slack_message(message)

    def send_error_message(
        self,
        protocol_name: str,
        error_str: str,
        image_path: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """Send error message to Slack, optionally tagging a user."""
        tagged_user = f"<@{user_id}> " if user_id and user_id.lower() != "none" else ""
        message = f"{tagged_user} Protocol: {protocol_name} ended in error: {error_str}"

        self.icon_emoji = ":alert:"
        self.send_slack_message(message, image_path)
