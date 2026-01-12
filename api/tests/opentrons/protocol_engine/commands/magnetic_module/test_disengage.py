"""Test magnetic module disengage commands."""

from decoy import Decoy

from opentrons.hardware_control.modules import MagDeck
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.magnetic_module import (
    DisengageParams,
    DisengageResult,
)
from opentrons.protocol_engine.commands.magnetic_module.disengage import (
    DisengageImplementation,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    MagneticModuleId,
    MagneticModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_magnetic_module_disengage_implementation(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should validate, find hardware module if not virtualized, and disengage."""
    subject = DisengageImplementation(state_view=state_view, equipment=equipment)

    params = DisengageParams(moduleId="unverified-module-id")

    verified_module_id = MagneticModuleId("module-id")
    magnetic_module_substate = decoy.mock(cls=MagneticModuleSubState)
    magnetic_module_hw = decoy.mock(cls=MagDeck)

    decoy.when(
        state_view.modules.get_magnetic_module_substate("unverified-module-id")
    ).then_return(magnetic_module_substate)

    decoy.when(magnetic_module_substate.module_id).then_return(verified_module_id)

    decoy.when(equipment.get_module_hardware_api(verified_module_id)).then_return(
        magnetic_module_hw
    )

    result = await subject.execute(params=params)

    decoy.verify(await magnetic_module_hw.deactivate(), times=1)
    assert result == SuccessData(public=DisengageResult())
