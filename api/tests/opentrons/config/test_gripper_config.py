from opentrons.config import gripper_config as gc
from opentrons_shared_data.gripper.dev_types import GripperModel


def test_load_gripper_config() -> None:
    loaded_config = gc.load(GripperModel.V1)
    assert loaded_config.name == "gripper"
