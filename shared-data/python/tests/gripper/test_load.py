import json
from opentrons_shared_data.gripper import load_definition, load_schema
from opentrons_shared_data.gripper.gripper_definition import (
    GripperModel,
)
from opentrons_shared_data import load_shared_data


def test_load_schema() -> None:
    assert load_schema(1) == json.loads(load_shared_data("gripper/schemas/1.json"))


def test_load_definition() -> None:
    load_definition(GripperModel.v1, 1) == json.loads(
        load_shared_data("gripper/definitions/1/gripperV1.json")
    )
