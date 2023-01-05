from opentrons.config import gripper_config as gc
from opentrons_shared_data.gripper.dev_types import GripperModel


def test_load_gripper_config() -> None:
    loaded_config = gc.load(GripperModel.V1)
    assert loaded_config.name == "gripper"


def test_gripper_force_conversion() -> None:
    loaded_config = gc.load(GripperModel.V1)
    for force in range(25):
        expected = 2.09 * force - 0.282
        result = gc.duty_cycle_by_force(force, loaded_config.jaw_duty_cycle_polynomial)
        assert result == expected
