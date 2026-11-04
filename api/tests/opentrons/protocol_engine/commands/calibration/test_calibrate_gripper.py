"""Unit tests for the calibrateGripper implementation."""

from __future__ import annotations

import inspect
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import EarlyCapacitiveSenseTrigger

from opentrons.calibration_storage.types import (
    CalibrationStatus,
)
from opentrons.calibration_storage.types import (
    SourceType as CalibrationSourceType,
)
from opentrons.hardware_control import HardwareControlAPI, ot3_calibration
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
)
from opentrons.hardware_control.types import GripperProbe, OT3Mount
from opentrons.protocol_engine.commands.calibration.calibrate_gripper import (
    CalibrateGripperImplementation,
    CalibrateGripperParams,
    CalibrateGripperParamsJaw,
    CalibrateGripperResult,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.types import Vec3f
from opentrons.types import Point


@pytest.fixture(autouse=True)
def _mock_ot3_calibration(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(ot3_calibration, inspect.isfunction):
        monkeypatch.setattr(ot3_calibration, name, decoy.mock(func=func))


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "params_probe, expected_hc_probe",
    [
        (CalibrateGripperParamsJaw.FRONT, GripperProbe.FRONT),
        (CalibrateGripperParamsJaw.REAR, GripperProbe.REAR),
    ],
)
async def test_calibrate_gripper(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    _mock_ot3_calibration: None,
    params_probe: CalibrateGripperParamsJaw,
    expected_hc_probe: GripperProbe,
) -> None:
    """It should delegate to the hardware API to calibrate the gripper."""
    subject = CalibrateGripperImplementation(hardware_api=hardware_api)

    params = CalibrateGripperParams(jaw=params_probe)
    decoy.when(
        await ot3_calibration.calibrate_gripper_jaw(
            hardware_api, probe=expected_hc_probe
        )
    ).then_return(Point(1.1, 2.2, 3.3))

    result = await subject.execute(params)
    assert result == SuccessData(
        public=CalibrateGripperResult(jawOffset=Vec3f(x=1.1, y=2.2, z=3.3)),
    )


@pytest.mark.ot3_only
async def test_calibrate_gripper_saves_calibration(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    _mock_ot3_calibration: None,
) -> None:
    """It should delegate to hardware API to calibrate the gripper & save calibration."""
    subject = CalibrateGripperImplementation(hardware_api=hardware_api)
    params = CalibrateGripperParams(
        jaw=CalibrateGripperParamsJaw.REAR,
        otherJawOffset=Vec3f(x=4.4, y=5.5, z=6.6),
    )
    expected_calibration_data = GripperCalibrationOffset(
        offset=Point(x=101, y=102, z=103),
        source=CalibrationSourceType.calibration_check,
        status=CalibrationStatus(markedBad=False),
        last_modified=datetime(year=3000, month=1, day=1),
    )
    saved_delta_captor = matchers.Captor()
    decoy.when(
        await ot3_calibration.calibrate_gripper_jaw(
            hardware_api, probe=GripperProbe.REAR
        )
    ).then_return(Point(1.1, 2.2, 3.3))
    decoy.when(
        await hardware_api.save_instrument_offset(
            mount=OT3Mount.GRIPPER, delta=saved_delta_captor
        )
    ).then_return(expected_calibration_data)
    result = await subject.execute(params)
    saved_delta: Point = saved_delta_captor.value
    assert result.public.jawOffset == Vec3f(x=1.1, y=2.2, z=3.3)
    assert saved_delta.elementwise_isclose(Point(x=2.75, y=3.85, z=4.95))
    assert result.public.savedCalibration == expected_calibration_data


@pytest.mark.ot3_only
async def test_calibrate_gripper_does_not_save_during_error(
    decoy: Decoy, hardware_api: HardwareControlAPI
) -> None:
    """Data should not be saved when an error is raised."""
    subject = CalibrateGripperImplementation(hardware_api=hardware_api)

    params = CalibrateGripperParams(
        jaw=CalibrateGripperParamsJaw.REAR,
        otherJawOffset=Vec3f(x=4.4, y=5.5, z=6.6),
    )

    decoy.when(
        await ot3_calibration.calibrate_gripper_jaw(
            hardware_api, probe=GripperProbe.REAR
        )
    ).then_raise(EarlyCapacitiveSenseTrigger())

    with pytest.raises(EarlyCapacitiveSenseTrigger):
        await subject.execute(params)

    decoy.verify(
        await hardware_api.save_instrument_offset(
            mount=OT3Mount.LEFT, delta=Point(x=3, y=4, z=6)
        ),
        times=0,
    )
