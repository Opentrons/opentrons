"""Tests for the metrics store."""

from pathlib import Path
from time import sleep

from performance_metrics._robot_activity_tracker import RobotActivityTracker
from performance_metrics._data_shapes import RawActivityData

# Corrected times in seconds
STARTING_TIME = 0.001
CALIBRATING_TIME = 0.002
ANALYZING_TIME = 0.003
RUNNING_TIME = 0.004
SHUTTING_DOWN_TIME = 0.005


async def test_storing_to_file(tmp_path: Path) -> None:
    """Tests storing the tracked data to a file."""
    robot_activity_tracker = RobotActivityTracker(tmp_path, should_track=True)

    @robot_activity_tracker.track("ROBOT_STARTING_UP")
    def starting_robot() -> None:
        sleep(STARTING_TIME)

    @robot_activity_tracker.track("CALIBRATING")
    async def calibrating_robot() -> None:
        sleep(CALIBRATING_TIME)

    @robot_activity_tracker.track("ANALYZING_PROTOCOL")
    def analyzing_protocol() -> None:
        sleep(ANALYZING_TIME)

    starting_robot()
    await calibrating_robot()
    analyzing_protocol()

    robot_activity_tracker.store()

    with open(robot_activity_tracker._store.metadata.data_file_location, "r") as file:
        lines = file.readlines()
        assert len(lines) == 3, "All stored data should be written to the file."

        split_lines: list[list[str]] = [
            line.replace('"', "").strip().split(",") for line in lines
        ]
        assert all(
            RawActivityData.from_csv_row(line) for line in split_lines
        ), "All lines should be valid RawActivityData instances."

    with open(
        robot_activity_tracker._store.metadata.headers_file_location, "r"
    ) as file:
        headers = file.readlines()
        assert len(headers) == 1, "Header should be written to the headers file."
        assert tuple(headers[0].strip().split(",")) == RawActivityData.headers()
