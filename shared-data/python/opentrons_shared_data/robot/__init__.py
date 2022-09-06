"""opentrons_shared_data.robot: Submodule for handling robot definition data."""
from pathlib import Path
from typing import cast
from typing_extensions import Final

import json

from .. import get_shared_data_root, load_shared_data_from_uri

from .dev_types import RobotDefinition, RobotName

DEFAULT_ROBOT_DEFINITION_VERSION: Final = 1


def load_from_uri(uri: str) -> RobotDefinition:
    """Load a robot definition from a URI.

    In comparison to opentrons_shared_data.load_shared_data_from_uri,
    it will raise if the URI is not that of a deck definition.
    """
    data = load_shared_data_from_uri(uri, "robot")
    return cast(RobotDefinition, json.loads(data))


def load(
    robot_name: RobotName, version: int = DEFAULT_ROBOT_DEFINITION_VERSION
) -> RobotDefinition:
    """Load the definition for the specified robot id."""
    for fi in Path(
        get_shared_data_root() / "robot" / "definitions" / f"{version}"
    ).iterdir():
        defn = json.load(fi.open("r"))
        if defn["robotName"] == robot_name:
            return cast(RobotDefinition, defn)
    raise KeyError(robot_name)
