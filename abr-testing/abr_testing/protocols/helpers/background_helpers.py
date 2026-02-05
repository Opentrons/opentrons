"""Contains all helper functions that run as background processes to aid in ABR.

These functions do not affect protocol execution.
"""
from typing import List
import time
import os
import subprocess

from abr_testing.automation import slack
from abr_testing.tools import check_robot_status as robot_status
from abr_testing.protocols.helpers import run_helpers
from collections import deque


def detect_robot_status(ip: str) -> None:
    """Detects the status of a given robot.

    ip -> Robot's ip address
    slack_bot -> Slack bot used to ping robot status
    """
    slack_bot: slack.Slack = run_helpers.set_up_slack()

    past_run_statuses: deque = deque(maxlen=10)

    # Process will be constantly running
    while True:
        time.sleep(300)

        # Reset running_robot and completed_robot information to prevent possible data corruption
        running_robots: List[str] = []
        completed_robots: List[str] = []

        # Get robot run details
        # This will publish if the robot enters Error Recovery
        robot_status.get_current_run_details_from_robot(
            ip=ip,
            slack_bot=slack_bot,
            running_robots=running_robots,
            completed_robots=completed_robots,
            on_robot=True,
            past_run_status=past_run_statuses,
        )


def launch_background_tasks() -> None:
    """Launches background processes."""
    # gets this package's directory
    package_dir = os.path.dirname(os.path.abspath(__file__))

    # adds script name to the end
    script_full_path = os.path.join(package_dir, "run_background.sh")

    subprocess.Popen(["bash", script_full_path])
