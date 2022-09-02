"""opentrons_shared_data.robot: Submodule for handling robot definition data."""
from typing import cast
from typing_extensions import Final

import json

from .. import load_shared_data

from .dev_types import RobotDefinition, RobotId

DEFAULT_ROBOT_DEFINITION_VERSION: Final = 1


def load(
    robot_id: RobotId, version: int = DEFAULT_ROBOT_DEFINITION_VERSION
) -> RobotDefinition:
    """Load the definition for the specified robot id."""
    return cast(
        RobotDefinition,
        json.loads(load_shared_data(f"robot/definitions/{version}/{robot_id}.json")),
    )
