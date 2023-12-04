"""Test calibrate-module command."""
from __future__ import annotations
from typing import TYPE_CHECKING

import inspect
import pytest
from decoy import Decoy
from opentrons.hardware_control import HardwareControlAPI

from opentrons.protocol_engine.commands.calibration.calibrate_module import (
    CalibrateModuleResult,
    CalibrateModuleImplementation,
    CalibrateModuleParams,
)
from opentrons.protocol_engine.errors.exceptions import HardwareNotSupportedError
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleOffsetVector,
    ModuleOffsetData,
)

from opentrons.hardware_control.types import OT3Mount
from opentrons.types import DeckSlotName, MountType, Point

from opentrons.hardware_control import ot3_calibration as calibration


@pytest.mark.ot3_only
@pytest.fixture(autouse=True)
def _mock_ot3_calibration(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(calibration, inspect.isfunction):
        monkeypatch.setattr(calibration, name, decoy.mock(func=func))


@pytest.mark.ot3_only
async def test_calibrate_module_implementation(
    decoy: Decoy, hardware_api: HardwareControlAPI, state_view: StateView
) -> None:
    """Test Calibration command execution."""
    subject = CalibrateModuleImplementation(state_view, hardware_api)

    location = DeckSlotLocation(slotName=DeckSlotName("D3"))
    module_id = "module123"
    labware_id = "labware123"
    module_serial = "TC1234abcd"
    params = CalibrateModuleParams(
        moduleId=module_id,
        labwareId=labware_id,
        mount=MountType.LEFT,
    )

    decoy.when(subject._state_view.modules.get_serial_number(module_id)).then_return(
        "TC1234abcd"
    )

    decoy.when(subject._state_view.modules.get_location(module_id)).then_return(
        location
    )
    decoy.when(
        subject._state_view.modules.get_module_calibration_offset(module_id)
    ).then_return(
        ModuleOffsetData(
            moduleOffsetVector=ModuleOffsetVector(x=0, y=0, z=0),
            location=location,
        )
    )
    decoy.when(
        subject._state_view.geometry.get_nominal_well_position(
            labware_id=labware_id, well_name="B1"
        )
    ).then_return(Point(x=3, y=2, z=1))
    decoy.when(
        await calibration.calibrate_module(
            hcapi=hardware_api,
            mount=OT3Mount.LEFT,
            slot=location.slotName.id,
            module_id=module_serial,
            nominal_position=Point(x=3, y=2, z=1),
        )
    ).then_return(Point(x=3, y=4, z=6))

    result = await subject.execute(params)

    assert result == CalibrateModuleResult(
        moduleOffset=ModuleOffsetVector(
            x=3,
            y=4,
            z=6,
        ),
        location=location,
    )


@pytest.mark.ot2_only
async def test_calibrate_module_implementation_wrong_hardware(
    decoy: Decoy, hardware_api: HardwareControlAPI, state_view: StateView
) -> None:
    """Should raise an unsupported hardware error."""
    subject = CalibrateModuleImplementation(
        state_view=state_view, hardware_api=hardware_api
    )

    params = CalibrateModuleParams(
        moduleId="Test1234",
        labwareId="Test1234",
        mount=MountType.LEFT,
    )

    with pytest.raises(HardwareNotSupportedError):
        await subject.execute(params)
