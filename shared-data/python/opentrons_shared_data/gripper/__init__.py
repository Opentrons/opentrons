"""opentrons_shared_data.gripper: functions and types for gripper config."""
from typing import cast, Any
from typing_extensions import Literal
import json
from pathlib import Path

from .. import load_shared_data
from .gripper_definition import (
    GripperDefinition,
    GripperSchema,
    GripperSchemaVersion,
    GripperModel,
)


class InvalidGripperDefinition(Exception):
    """Incorrect gripper definition."""

    pass


def load_schema(version: Literal[1]) -> GripperSchema:
    """Load gripper schema."""
    path = Path("gripper") / "schemas" / f"{version}.json"
    return cast(GripperSchema, json.loads(load_shared_data(path)))


def _load_definition_data(path: Path) -> Any:
    return json.loads(load_shared_data(path))


def load_definition(
    model: GripperModel,
    version: GripperSchemaVersion = 1,
) -> GripperDefinition:
    """Load gripper definition based on schema version and gripper model."""
    try:
        path = Path("gripper") / "definitions" / f"{version}" / f"{model}.json"
        data = _load_definition_data(path)
        return GripperDefinition(**data, schema_version=version)
    except FileNotFoundError:
        raise InvalidGripperDefinition(
            f"Gripper model {model} definition in schema version {version} does not exist."
        )
