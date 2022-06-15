import pytest
from opentrons_shared_data import gripper
from opentrons_shared_data.gripper import dev_types


GRIPPER_DEF = {
    "$otSharedSchema": "gripper/schemas/1",
    "model": "gripperV1",
    "displayName": "Gripper GEN1",
    "idleCurrent": {
        "defaultValue": 0.1,
        "min": 0.02,
        "max": 1.0,
        "units": "amps",
        "type": "float",
    },
    "activeCurrent": {
        "defaultValue": 0.8,
        "min": 0.02,
        "max": 2.0,
        "units": "amps",
        "type": "float",
    },
    "referenceVoltage": {
        "defaultValue": 2.6,
        "min": 0.5,
        "max": 3.3,
        "units": "volts",
        "type": "float",
    },
    "pwmFrequency": {
        "defaultValue": 32000,
        "min": 1000,
        "max": 32000,
        "units": "hertz",
        "type": "int",
    },
    "dutyCycle": {
        "defaultValue": 50,
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
        dev_types.GripperSchemaVersion.V1, dev_types.GripperModel.V1
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
        "defaultValue": 0.01,
        "min": 0.02,
        "max": 1.0,
        "units": "amps",
        "type": "float",
    }
    assert dev_types.GripperDefinitionV1.from_dict(GRIPPER_DEF)
