"""Test magnetic module disengage commands."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule, MagDeck
from opentrons.protocol_engine.state import StateView, MagneticModuleView, EngineConfigs
from opentrons.protocol_engine.commands.magnetic_module import (
    DisengageParams,
    DisengageResult,
)
from opentrons.protocol_engine.commands.magnetic_module.disengage import (
    DisengageImplementation,
)


@pytest.mark.parametrize("use_virtual_modules", [True, False])
async def test_magnetic_module_disengage_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    use_virtual_modules: bool,
) -> None:
    """It should validate, find hardware module if not virtualized, and disengage."""
    subject = DisengageImplementation(state_view=state_view, hardware_api=hardware_api)

    params = DisengageParams(
        moduleId="module-id",
    )

    magnetic_module_view = decoy.mock(cls=MagneticModuleView)
    decoy.when(
        state_view.modules.get_magnetic_module_view(module_id="module-id")
    ).then_return(magnetic_module_view)

    attached = [decoy.mock(cls=AbstractModule), decoy.mock(cls=AbstractModule)]
    match = decoy.mock(cls=MagDeck)
    # "type: ignore" to mock out what's normally a read-only property.
    hardware_api.attached_modules = attached  # type: ignore[misc]
    decoy.when(magnetic_module_view.find_hardware(attached)).then_return(match)

    result = await subject.execute(params=params)

    decoy.verify(await match.deactivate(), times=(0 if use_virtual_modules else 1))
    assert result == DisengageResult()
