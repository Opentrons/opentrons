"""Test calibrate-robot command."""
import inspect
from typing import cast

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


@pytest.fixture(autouse=True)
def _mock_ot3_calibration(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(calibration, inspect.isfunction):
        monkeypatch.setattr(calibration, name, decoy.mock(func=func))


async def test_calibrate_robot_implementation(
    decoy: Decoy,
    ot3_api: OT3API,
) -> None:
    """Test Probe command execution."""
    subject = CalibrateRobotImplementation(hardware_api=OT3API)

    params = CalibrateRobotParams(
        mount=OT3Mount.LEFT,
    )

    decoy.when(
        await calibration.find_deck_position(hcapi=ot3_api, mount=params.mount)
    ).then_return(5.0)
    decoy.when(
        await calibration.find_slot_center_binary(
            hcapi=ot3_api, mount=params.mount, deck_height=5.0
        )
    ).then_return((3, 4))

    result = await subject.execute(params)

    assert result == CalibrateRobotResult()
