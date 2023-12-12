from typing import Optional, Callable, TYPE_CHECKING, Any, Generator
import pytest
from contextlib import nullcontext
from unittest.mock import MagicMock, patch, PropertyMock

from opentrons.types import Point
from opentrons.calibration_storage import types as cal_types
from opentrons.hardware_control.instruments.ot3 import gripper, instrument_calibration
from opentrons.hardware_control.types import CriticalPoint
from opentrons.config import gripper_config
from opentrons_shared_data.gripper import GripperModel
from opentrons_shared_data.errors.exceptions import FailedGripperPickupError

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


@pytest.fixture
def mock_jaw_width() -> Generator[MagicMock, None, None]:
    with patch(
        "opentrons.hardware_control.instruments.ot3.gripper.Gripper.jaw_width",
        new_callable=PropertyMock,
    ) as jaw_width:
        yield jaw_width


@pytest.fixture
def mock_max_grip_error() -> Generator[MagicMock, None, None]:
    with patch(
        "opentrons.hardware_control.instruments.ot3.gripper.Gripper.max_allowed_grip_error",
        new_callable=PropertyMock,
    ) as max_error:
        yield max_error


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
@pytest.mark.parametrize(
    argnames=["jaw_width_val", "error_context"],
    argvalues=[
        (89, nullcontext()),
        (100, pytest.raises(FailedGripperPickupError)),
        (50, pytest.raises(FailedGripperPickupError)),
        (85, nullcontext()),
    ],
)
def test_check_labware_pickup(
    mock_jaw_width: Any,
    mock_max_grip_error: Any,
    jaw_width_val: float,
    error_context: Any,
) -> None:
    """Test that FailedGripperPickupError is raised correctly."""
    #  This should only be triggered when the difference between the
    #  gripper jaw and labware widths is greater than the max allowed error.
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    mock_jaw_width.return_value = jaw_width_val
    mock_max_grip_error.return_value = 6
    with error_context:
        gripr.check_labware_pickup(85)


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
    new_gripper, skip = gripper._reload_gripper(
        old_gripper.config, old_gripper, new_cal
    )

    # it's the same gripper
    assert new_gripper == old_gripper
    # we said upstream could skip
    assert skip
