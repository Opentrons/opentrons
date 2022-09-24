"""Test calibrate-pipette command."""
from __future__ import annotations
from typing import TYPE_CHECKING

import inspect
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.calibration.calibrate_pipette import (
    CalibratePipetteResult,
    CalibratePipetteImplementation,
    CalibratePipetteParams,
)
from opentrons.protocol_engine.errors.exceptions import HardwareNotSupportedError

from opentrons.hardware_control.api import API
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Point, MountType

from opentrons.hardware_control import ot3_calibration as calibration

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.mark.ot3_only
@pytest.fixture(autouse=True)
def _mock_ot3_calibration(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(calibration, inspect.isfunction):
        monkeypatch.setattr(calibration, name, decoy.mock(func=func))


@pytest.mark.ot3_only
async def test_calibrate_pipette_implementation(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """Test Calibration command execution."""
    # TODO (tz, 9-23-22) Figure out a better way to run this test with OT-3 api only.
    if ot3_hardware_api:
        subject = CalibratePipetteImplementation(hardware_api=ot3_hardware_api)

        params = CalibratePipetteParams(
            mount=MountType.LEFT,
        )

        decoy.when(
            await calibration.calibrate_mount(
                hcapi=ot3_hardware_api, mount=OT3Mount.LEFT
            )
        ).then_return(Point(x=3, y=4, z=6))

        result = await subject.execute(params)

        assert result == CalibratePipetteResult(pipetteOffset=Point(x=3, y=4, z=6))


@pytest.mark.ot3_only
async def test_calibrate_pipette_implementation_wrong_hardware(
    decoy: Decoy, ot2_hardware_api: API
) -> None:
    """Should raise an unsupported hardware error."""
    subject = CalibratePipetteImplementation(hardware_api=ot2_hardware_api)

    params = CalibratePipetteParams(
        mount=MountType.LEFT,
    )

    with pytest.raises(HardwareNotSupportedError):
        await subject.execute(params)
