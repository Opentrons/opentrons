"""Test calibrate-pipette command."""

from __future__ import annotations

import inspect

import pytest
from decoy import Decoy

from opentrons_shared_data.errors.exceptions import EarlyCapacitiveSenseTrigger

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control import ot3_calibration as calibration
from opentrons.hardware_control.types import OT3Mount
from opentrons.protocol_engine.commands.calibration.calibrate_pipette import (
    CalibratePipetteImplementation,
    CalibratePipetteParams,
    CalibratePipetteResult,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.types import InstrumentOffsetVector
from opentrons.types import MountType, Point


@pytest.fixture(autouse=True)
def _mock_ot3_calibration(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(calibration, inspect.isfunction):
        monkeypatch.setattr(calibration, name, decoy.mock(func=func))


@pytest.mark.ot3_only
async def test_calibrate_pipette_implementation(
    decoy: Decoy, hardware_api: HardwareControlAPI
) -> None:
    """Test Calibration command execution."""
    subject = CalibratePipetteImplementation(hardware_api=hardware_api)

    params = CalibratePipetteParams(
        mount=MountType.LEFT,
    )

    decoy.when(
        await calibration.find_pipette_offset(
            hcapi=hardware_api, mount=OT3Mount.LEFT, slot=5
        )
    ).then_return(Point(x=3, y=4, z=6))

    result = await subject.execute(params)

    decoy.verify(
        await hardware_api.save_instrument_offset(
            mount=OT3Mount.LEFT, delta=Point(x=3, y=4, z=6)
        ),
        times=1,
    )

    assert result == SuccessData(
        public=CalibratePipetteResult(
            pipetteOffset=InstrumentOffsetVector(x=3, y=4, z=6)
        ),
    )


@pytest.mark.ot3_only
async def test_calibrate_pipette_does_not_save_during_error(
    decoy: Decoy, hardware_api: HardwareControlAPI
) -> None:
    """Data should not be saved when an error is raised."""
    subject = CalibratePipetteImplementation(hardware_api=hardware_api)

    params = CalibratePipetteParams(
        mount=MountType.LEFT,
    )

    decoy.when(
        await calibration.find_pipette_offset(
            hcapi=hardware_api, mount=OT3Mount.LEFT, slot=5
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
