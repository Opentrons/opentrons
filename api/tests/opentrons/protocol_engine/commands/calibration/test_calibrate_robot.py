"""Test calibrate-robot command."""
import inspect

import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.calibration.calibrate_robot import (
    CalibrateRobotResult,
    CalibrateRobotImplementation,
    CalibrateRobotParams,
)

from opentrons.hardware_control import (
    HardwareControlAPI,
    ot3_calibration as calibration,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Point


@pytest.fixture(autouse=True)
def _mock_ot3_calibration(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(calibration, inspect.isfunction):
        monkeypatch.setattr(calibration, name, decoy.mock(func=func))


async def test_calibrate_robot_implementation(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
) -> None:
    """Test Probe command execution."""
    subject = CalibrateRobotImplementation(hardware_api=hardware_api)

    params = CalibrateRobotParams(
        mount=OT3Mount.LEFT,
    )

    decoy.when(
        await calibration.calibrate_mount(hcapi=hardware_api, mount=params.mount)
    ).then_return(Point(x=3, y=4, z=6))

    result = await subject.execute(params)

    assert result == CalibrateRobotResult(pipetteOffset=Point(x=3, y=4, z=6))
