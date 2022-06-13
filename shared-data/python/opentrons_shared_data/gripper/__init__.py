"""opentrons_shared_data.gripper: functions and types for gripper config."""
from typing import cast, Any, Optional
import json
from pathlib import Path

from .. import load_shared_data
from .dev_types import (
    GripperDefinitionV1,
    GripperSchema,
    GripperModel,
    GripperSchemaVersion,
)


def load_schema(version: GripperSchemaVersion) -> GripperSchema:
    """Load gripper schema."""
    path = Path("gripper") / "schemas" / f"{version}.json"
    return cast(GripperSchema, json.loads(load_shared_data(path)))


def _load_definition_data(path: Path) -> Any:
    return json.loads(load_shared_data(path))


def load_definition(
    version: GripperSchemaVersion,
    model: GripperModel,
) -> Optional[GripperDefinitionV1]:
    """Load gripper definition based on schema version and gripper model."""
    if version == GripperSchemaVersion.v1:
        path = Path("gripper") / "definitions" / f"{version}" / f"{model}.json"
        data = _load_definition_data(path)
        return GripperDefinitionV1.from_dict(data)
    else:
        return None
