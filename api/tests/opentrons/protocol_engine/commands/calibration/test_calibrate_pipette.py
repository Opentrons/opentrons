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
from opentrons.protocol_engine.types import InstrumentOffsetVector

from opentrons.hardware_control.api import API
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import MountType, Point

from opentrons.hardware_control import ot3_calibration as calibration

from opentrons_shared_data.errors.exceptions import EarlyCapacitiveSenseTrigger

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
    subject = CalibratePipetteImplementation(hardware_api=ot3_hardware_api)

    params = CalibratePipetteParams(
        mount=MountType.LEFT,
    )

    decoy.when(
        await calibration.find_pipette_offset(
            hcapi=ot3_hardware_api, mount=OT3Mount.LEFT, slot=5
        )
    ).then_return(Point(x=3, y=4, z=6))

    result = await subject.execute(params)

    decoy.verify(
        await ot3_hardware_api.save_instrument_offset(
            mount=OT3Mount.LEFT, delta=Point(x=3, y=4, z=6)
        ),
        times=1,
    )

    assert result == CalibratePipetteResult(
        pipetteOffset=InstrumentOffsetVector(x=3, y=4, z=6)
    )


@pytest.mark.ot3_only
async def test_calibrate_pipette_does_not_save_during_error(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """Data should not be saved when an error is raised."""
    subject = CalibratePipetteImplementation(hardware_api=ot3_hardware_api)

    params = CalibratePipetteParams(
        mount=MountType.LEFT,
    )

    decoy.when(
        await calibration.find_pipette_offset(
            hcapi=ot3_hardware_api, mount=OT3Mount.LEFT, slot=5
        )
    ).then_raise(EarlyCapacitiveSenseTrigger(5.0, 3.0))

    with pytest.raises(EarlyCapacitiveSenseTrigger):
        await subject.execute(params)

    decoy.verify(
        await ot3_hardware_api.save_instrument_offset(
            mount=OT3Mount.LEFT, delta=Point(x=3, y=4, z=6)
        ),
        times=0,
    )


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
