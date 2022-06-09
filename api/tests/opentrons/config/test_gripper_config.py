from opentrons.config import gripper_config as gc


def test_load_gripper_config() -> None:
    # TODO: load gripper config from gripper config dir
    loaded_config = gc.load()
    assert loaded_config == gc.DUMMY_GRIPPER_CONFIG
