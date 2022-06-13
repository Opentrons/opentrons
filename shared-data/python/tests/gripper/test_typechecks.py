import pytest
from opentrons_shared_data import gripper
from opentrons_shared_data.gripper import dev_types


GRIPPER_DEF = {
    "$otSharedSchema": "gripper/schemas/1",
    "model": "gripperV1",
    "displayName": "Gripper GEN1",
    "idleCurrent": {
        "value": 0.1,
        "min": 0.02,
        "max": 1.0,
        "units": "amps",
        "type": "float",
    },
    "activeCurrent": {
        "value": 0.8,
        "min": 0.02,
        "max": 2.0,
        "units": "amps",
        "type": "float",
    },
    "referenceVoltage": {
        "value": 2.6,
        "min": 0.5,
        "max": 3.3,
        "units": "volt",
        "type": "float",
    },
    "pwmFrequency": {
        "value": 32000,
        "min": 1000,
        "max": 32000,
        "units": "hertz",
        "type": "int",
    },
    "dutyCycle": {
        "value": 50,
        "min": 10,
        "max": 90,
        "units": "percentage",
        "type": "int",
    },
    "baseOffsetFromMount": {"x": 6.775, "y": 87.325, "z": 32.05},
    "jawCenterOffsetFromBase": {"x": 8.5, "y": 2.5, "z": 86},
    "pinOneOffsetFromBase": {"x": 23, "y": 73.37920159, "z": 95},
    "pinTwoOffsetFromBase": {"x": 23, "y": 78.37920159, "z": 95},
    "quirks": [],
}


def test_gripper_definition() -> None:
    gripper_def = gripper.load_definition(
        dev_types.GripperSchemaVersion.v1, dev_types.GripperModel.v1
    )
    assert isinstance(gripper_def, dev_types.GripperDefinitionV1)


def test_gripper_definition_type() -> None:
    assert dev_types.GripperDefinitionV1.from_dict(GRIPPER_DEF)

    # missing key
    del GRIPPER_DEF["idleCurrent"]
    with pytest.raises(dev_types.InvalidGripperDefinition):
        assert dev_types.GripperDefinitionV1.from_dict(GRIPPER_DEF)

    # add back in missing values
    GRIPPER_DEF["idleCurrent"] = {
        "value": 0.01,
        "min": 0.02,
        "max": 1.0,
        "units": "amps",
        "type": "float",
    }
    assert dev_types.GripperDefinitionV1.from_dict(GRIPPER_DEF)
