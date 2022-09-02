from typing import List, cast
from pathlib import Path
from opentrons_shared_data.robot.dev_types import RobotId


def list_robot_def_paths(version: int) -> List[RobotId]:
    return [
        cast(RobotId, deffile.stem)
        for deffile in (
            Path(__file__).parent
            / ".."
            / ".."
            / ".."
            / "robot"
            / "definitions"
            / f"{version}"
        ).iterdir()
    ]
