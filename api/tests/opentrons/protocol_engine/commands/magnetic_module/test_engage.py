"""Test magnetic module engage commands."""

from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule, MagDeck
from opentrons.protocol_engine.state import MagneticModuleView, StateView
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

    magnetic_module_view = decoy.mock(cls=MagneticModuleView)
    decoy.when(
        state_view.modules.get_magnetic_module_view(module_id="module-id")
    ).then_return(magnetic_module_view)

    decoy.when(
        magnetic_module_view.calculate_magnet_hardware_height(mm_from_base=3.14159)
    ).then_return(9001)

    attached = [decoy.mock(cls=AbstractModule), decoy.mock(cls=AbstractModule)]

    match = decoy.mock(cls=MagDeck)
    # "type: ignore" to mock out what's normally a read-only property.
    decoy.when(hardware_api.attached_modules).then_return(attached)
    decoy.when(magnetic_module_view.find_hardware(attached)).then_return(match)

    result = await subject.execute(params=params)

    decoy.verify(await match.engage(9001), times=1)
    assert result == EngageResult()
