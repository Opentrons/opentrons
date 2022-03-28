"""Test Heater Shaker set shake speed command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.modules import (
    HeaterShakerModuleView,
    HeaterShakerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.set_target_shake_speed import (
    SetTargetShakeSpeedImpl,
)


async def test_set_target_shake_speed(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to set the module's shake speed."""
    subject = SetTargetShakeSpeedImpl(state_view=state_view, equipment=equipment)
    data = heater_shaker.SetTargetShakeSpeedParams(
        moduleId="input-heater-shaker-id",
        rpm=1234.56,
    )

    # Get module view
    hs_module_view = decoy.mock(cls=HeaterShakerModuleView)
    hs_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_view(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_view)

    decoy.when(hs_module_view.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    # Stub speed validation from hs module view
    decoy.when(hs_module_view.validate_target_speed(rpm=1234.56)).then_return(1234)

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)

    result = await subject.execute(data)
    decoy.verify(await hs_hardware.set_speed(rpm=1234), times=1)
    assert result == heater_shaker.SetTargetShakeSpeedResult()
