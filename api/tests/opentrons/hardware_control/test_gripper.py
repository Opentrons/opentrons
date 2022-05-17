from opentrons.types import Point
from opentrons.hardware_control import gripper
from opentrons.config import gripper_config


fake_gripper_conf = gripper_config.GripperConfig(
    gripper_offset=(0, 0, 0),
    gripper_current=1.0,
    display_name="Display Name of This Gripper",
    name="gripper",
    model="gripper_v1",
    max_travel=10.0,
    home_position=0.0,
    steps_per_mm=0.0,
    idle_current=0.0,
)


def test_config_update():
    gripr = gripper.Gripper(fake_gripper_conf, "fakeid123")
    config_to_update = {"idle_current": 1.0, "gripper_offset": (1.0, 2.0, 3.0)}
    for k, v in config_to_update.items():
        gripr.update_config_item(k, v)
    assert gripr.config.idle_current == config_to_update["idle_current"]
    assert gripr.config.gripper_offset == config_to_update["gripper_offset"]


def test_id_get_added_to_dict():
    gripr = gripper.Gripper(fake_gripper_conf, "fakeid123")
    assert gripr.as_dict()["gripper_id"] == "fakeid123"


def test_critical_point():
    gripr = gripper.Gripper(fake_gripper_conf, "fakeid123")
    # TODO: update test when critical_point() is fully implemented
    assert gripr.critical_point() == Point(0, 0, 0)
