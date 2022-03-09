"""Test magnetic module engage commands."""

from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule, MagDeck
from opentrons.protocol_engine.state import StateView, EngineConfigs
from opentrons.protocol_engine.types import ModuleModel
from opentrons.protocol_engine.commands.magnetic_module import (
    EngageParams,
    EngageResult,
)
from opentrons.protocol_engine.commands.magnetic_module.engage import (
    EngageImplementation,
)


async def test_magnetic_module_engage_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
) -> None:
    """It should calculate the proper hardware height and engage."""
    subject = EngageImplementation(state_view=state_view, hardware_api=hardware_api)

    params = EngageParams(
        moduleId="module-id",
        engageHeight=3.14159,
    )

    decoy.when(state_view.modules.get_model(module_id="module-id")).then_return(
        ModuleModel.MAGNETIC_MODULE_V1,
    )
    decoy.when(
        state_view.modules.calculate_magnet_hardware_height(
            magnetic_module_model=ModuleModel.MAGNETIC_MODULE_V1, mm_from_base=3.14159
        )
    ).then_return(9001)

    attached = [decoy.mock(cls=AbstractModule), decoy.mock(cls=AbstractModule)]
    # "type: ignore" to mock out what's normally a read-only property.
    hardware_api.attached_modules = attached  # type: ignore[misc]

    match = decoy.mock(cls=MagDeck)

    decoy.when(
        state_view.modules.find_loaded_hardware_module(
            module_id="module-id", attached_modules=attached, expected_type=MagDeck
        )
    ).then_return(match)

    decoy.when(state_view.get_configs()).then_return(
        EngineConfigs(
            ignore_pause=False,
            use_virtual_modules=False,
        )
    )

    result = await subject.execute(params=params)
    decoy.verify(await match.engage(9001))
    assert result == EngageResult()
