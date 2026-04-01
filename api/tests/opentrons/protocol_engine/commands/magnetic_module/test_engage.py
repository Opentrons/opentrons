"""Test magnetic module engage commands."""

from decoy import Decoy

from opentrons.hardware_control.modules import MagDeck
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.magnetic_module import (
    EngageParams,
    EngageResult,
)
from opentrons.protocol_engine.commands.magnetic_module.engage import (
    EngageImplementation,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    MagneticModuleId,
    MagneticModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_magnetic_module_engage_implementation(
    decoy: Decoy, state_view: StateView, equipment: EquipmentHandler
) -> None:
    """It should calculate the proper hardware height and engage."""
    subject = EngageImplementation(state_view=state_view, equipment=equipment)

    params = EngageParams(
        moduleId="unverified-module-id",
        height=3.14159,
    )

    verified_module_id = MagneticModuleId("module-id")
    magnetic_module_substate = decoy.mock(cls=MagneticModuleSubState)
    magnetic_module_hw = decoy.mock(cls=MagDeck)

    decoy.when(
        state_view.modules.get_magnetic_module_substate("unverified-module-id")
    ).then_return(magnetic_module_substate)

    decoy.when(
        magnetic_module_substate.calculate_magnet_hardware_height(mm_from_base=3.14159)
    ).then_return(9001)

    decoy.when(magnetic_module_substate.module_id).then_return(verified_module_id)

    decoy.when(equipment.get_module_hardware_api(verified_module_id)).then_return(
        magnetic_module_hw
    )

    result = await subject.execute(params=params)

    decoy.verify(await magnetic_module_hw.engage(9001), times=1)
    assert result == SuccessData(public=EngageResult())
