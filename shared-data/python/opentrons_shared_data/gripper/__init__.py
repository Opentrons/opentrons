"""opentrons_shared_data.gripper: functions and types for gripper config."""

import json
from pathlib import Path
from typing import Any, cast

from typing_extensions import Literal

from .. import load_shared_data
from .gripper_definition import (
    Geometry,
    GripForceProfile,
    GripperDefinition,
    GripperModel,
    GripperSchema,
    GripperSchemaVersion,
)


class InvalidGripperDefinition(Exception):
    """Incorrect gripper definition."""

    pass


def generate_schema() -> str:
    """Create schema."""
    raw_json_schema = GripperDefinition.schema_json()
    schema_as_dict = json.loads(raw_json_schema)
    return json.dumps(schema_as_dict, indent=2)


def load_schema(version: Literal[1]) -> GripperSchema:
    """Load gripper schema."""
    path = Path("gripper") / "schemas" / f"{version}.json"
    return cast(GripperSchema, json.loads(load_shared_data(path)))


def _load_definition_data(path: Path) -> Any:
    return


def load_definition(
    model: GripperModel,
    version: GripperSchemaVersion = 1,
) -> GripperDefinition:
    """Load gripper definition based on schema version and gripper model."""
    try:
        path = Path("gripper") / "definitions" / f"{version}" / f"{model.value}.json"
        return GripperDefinition.model_validate(json.loads(load_shared_data(path)))
    except FileNotFoundError:
        raise InvalidGripperDefinition(
            f"Gripper model {model} definition in schema version {version} does not exist."
        )


__all__ = [
    "GripperDefinition",
    "GripperSchema",
    "GripperSchemaVersion",
    "GripForceProfile",
    "GripperModel",
    "Geometry",
    "generate_schema",
]
