import json
from opentrons_shared_data.gripper import load_definition, load_schema
from opentrons_shared_data.gripper.dev_types import GripperSchemaVersion, GripperModel
from opentrons_shared_data import load_shared_data


def test_load_schema() -> None:
    assert load_schema(GripperSchemaVersion.V1) == json.loads(
        load_shared_data("gripper/schemas/1.json")
    )


def test_load_definition() -> None:
    load_definition(GripperSchemaVersion.V1, GripperModel.V1) == json.loads(
        load_shared_data("gripper/definitions/1/gripperV1.json")
    )
