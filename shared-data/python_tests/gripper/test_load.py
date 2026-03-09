import json
from opentrons_shared_data.gripper import load_definition, load_schema
from opentrons_shared_data.gripper.gripper_definition import (
    GripperModel,
    GripperDefinition,
)
from opentrons_shared_data import load_shared_data


def test_load_schema() -> None:
    assert load_schema(1) == json.loads(load_shared_data("gripper/schemas/1.json"))


def test_load_definition() -> None:
    gripper_def = load_definition(GripperModel.v1, 1)
    assert type(gripper_def) is GripperDefinition
    assert gripper_def.model == GripperModel.v1
    assert gripper_def.grip_force_profile.default_grip_force == 15
    assert gripper_def.geometry.base_offset_from_mount == (19.5, -74.325, -94.825)
