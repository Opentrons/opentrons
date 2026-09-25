"""Slack Functions for Robot Communication."""
from slack_sdk import WebClient
import configparser
import os
from typing import Optional, cast
from pathlib import Path


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
        self.channel_id = self._get_channel_id_from_name(channel_name)
        # If user is a robot, then the icon will be the opentron logo
        if user_name.startswith("DVT") or user_name.startswith("PVT"):
            self.icon_emoji = ":robot_face:"
        else:
            self.icon_emoji = ":gear:"
            print("Using computer icon for non-robot user.")

    def _get_channel_id_from_name(self, channel_name: str) -> str:
        """Return the Slack channel ID given a channel name."""
        cursor = None
        try:
            response = self.client.conversations_list(
                exclude_archived=True,
                limit=1000,
                cursor=cursor,
            )
            response_dict = cast(dict, response)
        except Exception as e:
            raise RuntimeError(f"Slack API error: {e}")
        for channel in response_dict.get("channels", []):
            if channel.get("name") == channel_name:
                return channel["id"]
        cursor = response_dict.get("response_metadata", {}).get("next_cursor")
        if not cursor:
            raise ValueError(f"Channel {channel_name} not found")
        return ""

    def send_slack_message(
        self,
        message: str,
        file_paths: list[str] | None = None,
        user_id: Optional[str] = None,
    ) -> Optional[str]:
        """Send Slack message with optional multiple files in a single-threaded group."""
        try:
            parent = self.client.chat_postMessage(
                channel=self.channel,
                text=message,
                username=self.user_name,
                icon_emoji=self.icon_emoji,
            )
            parent.validate()
            thread_ts = parent["ts"]
        except Exception as e:
            print(f"Failed to send primary Slack message: {e}")
            return None

        if not file_paths:
            return thread_ts

        for file_path in file_paths:
            cleaned = file_path.strip()
            try:
                if not Path(cleaned).exists():
                    print(f"File not found: {cleaned}")
                    continue

                with open(cleaned, "rb") as file_content:
                    response = self.client.files_upload_v2(
                        file=file_content,
                        filename=os.path.basename(cleaned),
                        title=os.path.basename(cleaned).split(".")[0],
                        channel=self.channel_id,
                        thread_ts=thread_ts,
                    )
                    response.validate()

            except Exception as e:
                print(f"Failed to upload {cleaned} to Slack: {e}")
                continue

        return thread_ts

    def send_run_completed_message(
        self, protocol_name: str, file_paths: list[str] | None = None
    ) -> None:
        """Send run completed message."""
        message = f"{protocol_name} has completed successfully."
        if file_paths:
            self.send_slack_message(message, file_paths)
        else:
            self.send_slack_message(message)

    def send_run_started_message(
        self,
        protocol_name: str,
    ) -> None:
        """Send run started message."""
        message = f"Protocol: {protocol_name} has started."
        self.send_slack_message(message)

    def send_error_message(
        self,
        protocol_name: str,
        error_str: str,
        ip: str,
        file_paths: list[str] | None = None,
    ) -> None:
        """Send error message to Slack with the logs and error video attached."""
        message = f"Protocol {protocol_name} on IP: {ip} ended in error: {error_str}"
        self.icon_emoji = ":alert:"
        self.send_slack_message(message, file_paths)
