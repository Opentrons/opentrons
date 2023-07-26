"""Unit tests for the calibrateGripper implementation."""

from __future__ import annotations

import inspect
import pytest
from datetime import datetime
from decoy import Decoy
from typing import TYPE_CHECKING

from opentrons.hardware_control import ot3_calibration
from opentrons.hardware_control.api import API as OT2API
from opentrons.hardware_control.types import GripperProbe, OT3Mount
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
)
from opentrons.calibration_storage.types import (
    CalibrationStatus,
    SourceType as CalibrationSourceType,
)
from opentrons.types import Point

from opentrons.protocol_engine.commands.calibration.calibrate_gripper import (
    CalibrateGripperResult,
    CalibrateGripperImplementation,
    CalibrateGripperParams,
    CalibrateGripperParamsJaw,
)
from opentrons.protocol_engine.errors import HardwareNotSupportedError
from opentrons.protocol_engine.types import Vec3f

if TYPE_CHECKING:
    # Support environments without OT-3 hardware control dependencies.
    from opentrons.hardware_control.ot3api import OT3API


@pytest.mark.ot3_only
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
    ot3_hardware_api: OT3API,
    _mock_ot3_calibration: None,
    params_probe: CalibrateGripperParamsJaw,
    expected_hc_probe: GripperProbe,
) -> None:
    """It should delegate to the hardware API to calibrate the gripper."""
    subject = CalibrateGripperImplementation(hardware_api=ot3_hardware_api)

    params = CalibrateGripperParams(jaw=params_probe)
    decoy.when(
        await ot3_calibration.calibrate_gripper_jaw(
            ot3_hardware_api, probe=expected_hc_probe
        )
    ).then_return(Point(1.1, 2.2, 3.3))

    result = await subject.execute(params)
    assert result == CalibrateGripperResult(jawOffset=Vec3f(x=1.1, y=2.2, z=3.3))


@pytest.mark.ot3_only
async def test_calibrate_gripper_saves_calibration(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    _mock_ot3_calibration: None,
) -> None:
    """It should delegate to hardware API to calibrate the gripper & save calibration."""
    subject = CalibrateGripperImplementation(hardware_api=ot3_hardware_api)
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
    decoy.when(
        await ot3_calibration.calibrate_gripper_jaw(
            ot3_hardware_api, probe=GripperProbe.REAR
        )
    ).then_return(Point(1.1, 2.2, 3.3))
    decoy.when(
        await ot3_hardware_api.save_instrument_offset(
            mount=OT3Mount.GRIPPER, delta=Point(x=2.75, y=3.85, z=4.95)
        )
    ).then_return(expected_calibration_data)
    result = await subject.execute(params)
    assert result.jawOffset == Vec3f(x=1.1, y=2.2, z=3.3)
    assert result.savedCalibration == expected_calibration_data


@pytest.mark.ot3_only
async def test_calibrate_gripper_does_not_save_during_error(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """Data should not be saved when an error is raised."""
    subject = CalibrateGripperImplementation(hardware_api=ot3_hardware_api)

    params = CalibrateGripperParams(
        jaw=CalibrateGripperParamsJaw.REAR,
        otherJawOffset=Vec3f(x=4.4, y=5.5, z=6.6),
    )

    decoy.when(
        await ot3_calibration.calibrate_gripper_jaw(
            ot3_hardware_api, probe=GripperProbe.REAR
        )
    ).then_raise(ot3_calibration.EarlyCapacitiveSenseTrigger(5.0, 3.0))

    with pytest.raises(ot3_calibration.EarlyCapacitiveSenseTrigger):
        await subject.execute(params)

    decoy.verify(
        await ot3_hardware_api.save_instrument_offset(
            mount=OT3Mount.LEFT, delta=Point(x=3, y=4, z=6)
        ),
        times=0,
    )


async def test_calibrate_gripper_raises_on_ot2(
    decoy: Decoy,
    ot2_hardware_api: OT2API,
) -> None:
    """It should raise with a descriptive error if run on an OT-2, instead of OT-3."""
    subject = CalibrateGripperImplementation(hardware_api=ot2_hardware_api)

    params = CalibrateGripperParams(jaw=CalibrateGripperParamsJaw.REAR)

    with pytest.raises(HardwareNotSupportedError):
        await subject.execute(params)
