import pytest
from opentrons.config import gripper_config as gc
from opentrons_shared_data.gripper.gripper_definition import GripperModel


def test_load_gripper_config() -> None:
    loaded_config = gc.load(GripperModel.v1)
    assert loaded_config.display_name == "Flex Gripper"


def test_gripper_force_conversion() -> None:
    loaded_config = gc.load(GripperModel.v1)
    for force in range(0, 25):
        if 5 <= force <= 20:
            expected = 2.09 * force - 0.282
            result = gc.duty_cycle_by_force(force, loaded_config.grip_force_profile)
            assert result == expected
        else:
            with pytest.raises(ValueError):
                gc.duty_cycle_by_force(force, loaded_config.grip_force_profile)
