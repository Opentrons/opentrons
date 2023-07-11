from typing import Optional, Callable, TYPE_CHECKING
import pytest

from opentrons.types import Point
from opentrons.calibration_storage import types as cal_types
from opentrons.hardware_control.instruments.ot3 import gripper, instrument_calibration
from opentrons.hardware_control.types import CriticalPoint
from opentrons.config import gripper_config
from opentrons_shared_data.gripper import GripperModel

if TYPE_CHECKING:
    from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
        GripperCalibrationOffset,
    )

fake_gripper_conf = gripper_config.load(GripperModel.v1)


@pytest.mark.ot3_only
@pytest.fixture
def fake_offset() -> "GripperCalibrationOffset":
    from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
        load_gripper_calibration_offset,
    )

    return load_gripper_calibration_offset("fakeid123")


@pytest.mark.ot3_only
def test_id_get_added_to_dict(fake_offset: "GripperCalibrationOffset") -> None:
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    assert gripr.as_dict()["gripper_id"] == "fakeid123"


@pytest.mark.xfail
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
            CriticalPoint.GRIPPER_REAR_CALIBRATION_PIN,
            lambda g: g._rear_calibration_pin_offset,
        ),
    ],
)
def test_critical_point(
    override: Optional[CriticalPoint],
    result_accessor: Callable[[gripper.Gripper], Point],
    fake_offset: "GripperCalibrationOffset",
) -> None:
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    assert gripr.critical_point(override) == result_accessor(gripr)


@pytest.mark.ot3_only
def test_load_gripper_cal_offset(fake_offset: "GripperCalibrationOffset") -> None:
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    # if offset data do not exist, loaded values should match DEFAULT
    assert gripr._calibration_offset.offset == Point(
        *gripper_config.DEFAULT_GRIPPER_CALIBRATION_OFFSET
    )


@pytest.mark.ot3_only
def test_reload_instrument_cal_ot3(fake_offset: "GripperCalibrationOffset") -> None:
    old_gripper = gripper.Gripper(
        fake_gripper_conf,
        fake_offset,
        "fakeid123",
    )
    # if only calibration is changed
    new_cal = instrument_calibration.GripperCalibrationOffset(
        offset=Point(3, 4, 5),
        source=cal_types.SourceType.user,
        status=cal_types.CalibrationStatus(),
    )
    new_gripper = gripper._reload_gripper(old_gripper.config, old_gripper, new_cal)

    # it's the same pipette
    assert new_gripper == old_gripper
    # only pipette offset has been updated
    assert new_gripper._calibration_offset == new_cal
