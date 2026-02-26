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
        time.sleep(30)

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


def change_robot_video_length(time: str, ip: str) -> None:
    """Changes the length of the robot video to the given time."""
    key = "hls_playlist_length"
    ssh_command = f"""
    mount -o remount,rw / &&
    sed -i "s/{key} *[0-9][0-9]*s;/{key} {time}s;/g" /etc/nginx/nginx.conf &&
    systemctl daemon-reload &&
    systemctl restart nginx
    """

    try:
        subprocess.run(ssh_command, shell=True, check=True)
        print(f"Successfully updated livestream length on {ip}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to update {ip}: {e}")


def video_capture_buffer(max_time: int, m3u8_path: str) -> None:
    """Keeps a running video capture buffer of given time."""
    storage_path: str = "data/testing_data/videos/video_capture_buffer"
    os.makedirs(storage_path, exist_ok=True)

    # Runs forever in the background

    # Hello future programmer. Below is an ffmpeg command.
    # ffmpeg is ugly. ffmpeg makes no sense.
    # just know that this is what this does:
    # 1. streams from the given m3u8_path
    # 2. segments the stream into 1 second clips
    # 3. converts each of these one second clips to mp4
    # 4. stores these clips in the above "storage_path" directory
    # it also runs perpetually (but don't worry, it is killed below)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        m3u8_path,
        "-f",
        "segment",
        "-segment_time",
        "1",
        "-strftime",
        "1",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        f"{storage_path}/%Y-%m-%d_%H-%M-%S.mp4",
    ]
    """
    Note to self:
        1. stdout and stderr are subprocess' way of outputing logs and errors to the terminal
        2. DEVNULL is a "black hole" file
        3. here, we are telling subprocess to stfu instead of attacking our terminal
    """
    process = subprocess.Popen(
        cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    # give ffmpeg a second to get started
    time.sleep(1)

    # cleans up
    try:
        while True:
            # creates buffer

            # Filter for .mp4 only so we don't accidentally try to delete temp files
            buffer: list[str] = sorted(
                [f for f in os.listdir(storage_path) if f.endswith(".mp4")]
            )

            # enforces maximum time
            if len(buffer) >= max_time + 1:
                attempted_removals: int = 0

                def _remove_item(attempted_removals: int = 0) -> None:
                    # only try 3 times
                    if attempted_removals > 3:
                        return

                    try:
                        os.remove(f"{storage_path}/{buffer[0]}")
                    except IndexError:
                        # assume ffmpeg hasn't done anything yet
                        pass
                    except OSError:
                        # wait a second, then try again
                        time.sleep(1)
                        attempted_removals += 1
                        _remove_item(attempted_removals)

                _remove_item(attempted_removals)

            time.sleep(1)
    finally:
        process.terminate()


def launch_background_tasks() -> None:
    """Launches background processes."""
    # gets this package's directory
    package_dir = os.path.dirname(os.path.abspath(__file__))

    # adds script name to the end
    script_full_path = os.path.join(package_dir, "run_background.sh")

    subprocess.Popen(["bash", script_full_path])
