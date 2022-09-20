"""Test calibrate-pipette command."""
import inspect

import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.calibration.calibrate_pipette import (
    CalibratePipetteResult,
    CalibratePipetteImplementation,
    CalibratePipetteParams,
)
from opentrons.protocol_engine.errors.exceptions import HardwareNotSupported

from opentrons.hardware_control import ot3_calibration as calibration
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.api import API
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Point


@pytest.fixture(autouse=True)
def _mock_ot3_calibration(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(calibration, inspect.isfunction):
        monkeypatch.setattr(calibration, name, decoy.mock(func=func))


async def test_calibrate_pipette_implementation(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """Test Calibration command execution."""
    subject = CalibratePipetteImplementation(hardware_api=ot3_hardware_api)

    params = CalibratePipetteParams(
        mount=OT3Mount.LEFT,
    )

    decoy.when(
        await calibration.calibrate_mount(hcapi=ot3_hardware_api, mount=params.mount)
    ).then_return(Point(x=3, y=4, z=6))

    result = await subject.execute(params)

    assert result == CalibratePipetteResult(pipetteOffset=Point(x=3, y=4, z=6))


async def test_calibrate_pipette_implementation_wrong_hardware(
    decoy: Decoy, ot2_hardware_api: API
) -> None:
    """Should raise an unsupported hardware error."""
    subject = CalibratePipetteImplementation(hardware_api=ot2_hardware_api)

    params = CalibratePipetteParams(
        mount=OT3Mount.LEFT,
    )

    with pytest.raises(HardwareNotSupported):
        await subject.execute(params)
