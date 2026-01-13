from datetime import datetime
from typing import Callable, Optional
from unittest import mock

import pytest

from opentrons_shared_data.errors.exceptions import MotionFailedError
from opentrons_shared_data.gripper import GripperModel

from opentrons.calibration_storage import types as cal_types
from opentrons.config import gripper_config
from opentrons.hardware_control.instruments.ot3 import gripper, instrument_calibration
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
    GripperJawWidthData,
)
from opentrons.hardware_control.types import CriticalPoint
from opentrons.types import Point

fake_gripper_conf = gripper_config.load(GripperModel.v1)


@pytest.fixture
def fake_offset() -> GripperCalibrationOffset:
    return instrument_calibration.load_gripper_calibration_offset("fakeid123")


@pytest.fixture
def fake_jaw_cal(request: pytest.FixtureRequest) -> GripperJawWidthData:
    request.node.add_marker("ot3_only")
    return instrument_calibration.load_gripper_jaw_width("fakeid123")


@pytest.mark.ot3_only
def test_id_get_added_to_dict(fake_offset: GripperCalibrationOffset) -> None:
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
    fake_offset: GripperCalibrationOffset,
) -> None:
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    assert gripr.critical_point(override) == result_accessor(gripr)


@pytest.mark.ot3_only
def test_load_gripper_cal_offset(fake_offset: GripperCalibrationOffset) -> None:
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    # if offset data do not exist, loaded values should match DEFAULT
    assert gripr._calibration_offset.offset == Point(
        *gripper_config.DEFAULT_GRIPPER_CALIBRATION_OFFSET
    )


@pytest.mark.ot3_only
def test_gripper_default_jaw_width_calibration(
    fake_jaw_cal: GripperJawWidthData,
    fake_offset: GripperCalibrationOffset,
) -> None:
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    assert gripr._jaw_max_offset is None
    assert gripr._encoder_position_at_jaw_closed is None


@pytest.mark.parametrize("loaded_encoder_pos", [24.4, None])
@pytest.mark.parametrize("existing_encoder_pos", [24.4, None])
@pytest.mark.ot3_only
def test_gripper_has_jaw_width_calibration(
    fake_jaw_cal: GripperJawWidthData,
    fake_offset: GripperCalibrationOffset,
    loaded_encoder_pos: float,
    existing_encoder_pos: float,
) -> None:
    gripr = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")
    gripr._encoder_position_at_jaw_closed = existing_encoder_pos
    with mock.patch(
        "opentrons.hardware_control.instruments.ot3.gripper.load_gripper_jaw_width",
        return_value=GripperJawWidthData(
            source=fake_jaw_cal.source,
            status=fake_jaw_cal.status,
            encoder_position_at_jaw_closed=loaded_encoder_pos,
            last_modified=datetime.now(),
        ),
        autospec=True,
    ) as fake_load_jaw_width:
        has_cal = gripr.has_jaw_width_calibration
        mock_save_gripper_jaw_width_data = mock.Mock()
        mock.patch(
            "opentrons.hardware_control.instruments.ot3.gripper.save_gripper_jaw_width_data",
            return_value=mock_save_gripper_jaw_width_data(),
        )
        # if gripper._encoder_position_at_jaw_closed has no value:
        if existing_encoder_pos is None:
            # gripper should try to load jaw width from the robot fs
            fake_load_jaw_width.assert_called_once()
            if loaded_encoder_pos is None:
                assert has_cal is False
            else:
                # if robot fs has gripper jaw width data,
                # it should get saved to the gripper object and has_cal return true
                mock_save_gripper_jaw_width_data.assert_called_once()
                assert has_cal is True
        # if gripper._encoder_position_at_jaw_closed has a value:
        else:
            # gripper doesn't try to load from the robot and returns true
            fake_load_jaw_width.assert_not_called()
            assert has_cal is True
            mock_save_gripper_jaw_width_data.assert_called_once()


@pytest.mark.ot3_only
def test_reload_instrument_cal_ot3(fake_offset: GripperCalibrationOffset) -> None:
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
    # jaw offset should persists as well
    assert new_gripper._jaw_max_offset == old_gripper._jaw_max_offset
    # we said upstream could skip
    assert skip


@pytest.mark.ot3_only
def test_reload_instrument_cal_ot3_conf_changed(
    fake_offset: GripperCalibrationOffset,
) -> None:
    old_gripper = gripper.Gripper(
        fake_gripper_conf,
        fake_offset,
        "fakeid123",
    )
    new_conf = fake_gripper_conf.model_copy(
        update={
            "grip_force_profile": fake_gripper_conf.grip_force_profile.model_copy(
                update={"default_grip_force": 1}
            )
        },
        deep=True,
    )
    assert new_conf != old_gripper.config

    new_gripper, skip = gripper._reload_gripper(new_conf, old_gripper, fake_offset)

    # it's not the same gripper
    assert new_gripper != old_gripper
    # do not pass in the old jaw max offse
    assert not new_gripper._jaw_max_offset
    # we said upstream could skip
    assert not skip


@pytest.mark.ot3_only
def test_jaw_calibration_error_checking() -> None:
    subject = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")  # type: ignore[arg-type]
    with pytest.raises(MotionFailedError):
        subject.update_jaw_open_position_from_closed_position(0)


@pytest.mark.ot3_only
def test_jaw_calibration() -> None:
    subject = gripper.Gripper(fake_gripper_conf, fake_offset, "fakeid123")  # type: ignore[arg-type]
    subject.update_jaw_open_position_from_closed_position(
        (
            fake_gripper_conf.geometry.jaw_width["max"]
            - fake_gripper_conf.geometry.jaw_width["min"]
            + 2
        )
        / 2
    )
    assert subject.max_jaw_width == fake_gripper_conf.geometry.jaw_width["max"] + 2
