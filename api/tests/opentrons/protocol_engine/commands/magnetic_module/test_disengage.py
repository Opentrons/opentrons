"""Test magnetic module disengage commands."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule, MagDeck
from opentrons.protocol_engine.state import StateView, EngineConfigs
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

    decoy.when(state_view.get_configs()).then_return(
        EngineConfigs(
            ignore_pause=False,
            use_virtual_modules=use_virtual_modules,
        )
    )

    attached = [decoy.mock(cls=AbstractModule), decoy.mock(cls=AbstractModule)]
    # "type: ignore" to mock out what's normally a read-only property.
    hardware_api.attached_modules = attached  # type: ignore[misc]

    match = decoy.mock(cls=MagDeck)

    decoy.when(
        state_view.modules.find_loaded_hardware_module(
            module_id="module-id", attached_modules=attached, expected_type=MagDeck
        )
    ).then_return(match)

    result = await subject.execute(params=params)

    decoy.verify(state_view.modules.assert_is_magnetic_module(module_id="module-id"))
    decoy.verify(await match.deactivate(), times=(0 if use_virtual_modules else 1))

    assert result == DisengageResult()
