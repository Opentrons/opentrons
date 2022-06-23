import pytest
import json
from opentrons_shared_data import gripper, load_shared_data
from opentrons_shared_data.gripper import dev_types

GRIPPER_DEF = json.loads(load_shared_data("gripper/definitions/1/gripperV1.json"))


def test_gripper_definition() -> None:
    gripper_def = gripper.load_definition(
        dev_types.GripperSchemaVersion.V1, dev_types.GripperModel.V1
    )
    assert isinstance(gripper_def, dev_types.GripperDefinitionV1)


def test_gripper_definition_type() -> None:
    assert dev_types.GripperDefinitionV1.from_dict(GRIPPER_DEF)

    # missing key
    del GRIPPER_DEF["idleZCurrent"]
    with pytest.raises(dev_types.InvalidGripperDefinition):
        assert dev_types.GripperDefinitionV1.from_dict(GRIPPER_DEF)

    # add back in missing values
    GRIPPER_DEF["idleZCurrent"] = {
        "defaultValue": 0.01,
        "min": 0.02,
        "max": 1.0,
        "units": "amps",
        "type": "float",
    }
    assert dev_types.GripperDefinitionV1.from_dict(GRIPPER_DEF)
