import pytest
from pydantic import ValidationError
import json
from opentrons_shared_data import gripper, load_shared_data
from opentrons_shared_data.gripper.gripper_definition import (
    GripperDefinition,
    GripperModel,
)

GRIPPER_DEF = json.loads(load_shared_data("gripper/definitions/1/v1.json"))


def test_gripper_definition() -> None:
    gripper_def = gripper.load_definition(GripperModel.v1)
    assert isinstance(gripper_def, GripperDefinition)
    assert gripper_def.schema_version == 1


def test_gripper_definition_type() -> None:
    assert GripperDefinition(**GRIPPER_DEF, schema_version=1)

    # missing key
    del GRIPPER_DEF["geometry"]
    with pytest.raises(ValidationError):
        assert GripperDefinition(**GRIPPER_DEF, schema_version=1)

    # no missing key but with incorrect value
    GRIPPER_DEF["ZMotorConfigurations"] = {"idle": 2.0, "run": "1.0"}
    with pytest.raises(ValidationError):
        assert GripperDefinition(**GRIPPER_DEF, schema_version=1)
