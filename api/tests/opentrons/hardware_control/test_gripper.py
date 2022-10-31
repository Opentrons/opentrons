from typing import Optional, Callable
import pytest

from opentrons.types import Point
from opentrons.hardware_control.instruments.ot3 import gripper
from opentrons.hardware_control.types import CriticalPoint
from opentrons.config import gripper_config
from opentrons_shared_data.gripper.dev_types import GripperModel

fake_gripper_conf = gripper_config.load(GripperModel.V1)


@pytest.mark.ot3_only
@pytest.fixture
def fake_offset():
    from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
        load_gripper_calibration_offset,
    )

    return load_gripper_calibration_offset("fakeid123")


@pytest.mark.ot3_only
def test_config_update(fake_offset):
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    config_to_update = {"z_idle_current": 1.0, "jaw_reference_voltage": 0.5}
    for k, v in config_to_update.items():
        gripr.update_config_item(k, v)
    assert gripr.config.z_idle_current == config_to_update["z_idle_current"]
    assert (
        gripr.config.jaw_reference_voltage == config_to_update["jaw_reference_voltage"]
    )


@pytest.mark.ot3_only
def test_id_get_added_to_dict(fake_offset):
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    assert gripr.as_dict()["gripper_id"] == "fakeid123"


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "override,result_accessor",
    [
        (None, lambda g: g._jaw_center_offset),
        (CriticalPoint.GRIPPER_JAW_CENTER, lambda g: g._jaw_center_offset),
        (
            CriticalPoint.GRIPPER_FRONT_CALIBRATION_PIN,
            lambda g: g._front_calibration_pin_offset,
        ),
        (
            CriticalPoint.GRIPPER_BACK_CALIBRATION_PIN,
            lambda g: g._back_calibration_pin_offset,
        ),
    ],
)
def test_critical_point(
    override: Optional[CriticalPoint],
    result_accessor: Callable[[gripper.Gripper], Point],
    fake_offset,
):
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    assert gripr.critical_point(override) == result_accessor(gripr)


@pytest.mark.ot3_only
def test_load_gripper_cal_offset(fake_offset):
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    # if offset data do not exist, loaded values should match DEFAULT
    assert gripr._calibration_offset.offset == Point(
        *gripper_config.DEFAULT_GRIPPER_CALIBRATION_OFFSET
    )
