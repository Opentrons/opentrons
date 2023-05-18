"""Test Heater Shaker set shake speed command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.set_and_wait_for_shake_speed import (
    SetAndWaitForShakeSpeedImpl,
)
from opentrons.protocol_engine.types import MotorAxis


async def test_set_and_wait_for_shake_speed(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should be able to set the module's shake speed."""
    subject = SetAndWaitForShakeSpeedImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )
    data = heater_shaker.SetAndWaitForShakeSpeedParams(
        moduleId="input-heater-shaker-id",
        rpm=1234.56,
    )

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)
    hs_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    decoy.when(
        state_view.motion.check_pipette_blocking_hs_shaker(
            HeaterShakerModuleId("heater-shaker-id")
        )
    ).then_return(True)

    # Stub speed validation from hs module view
    decoy.when(hs_module_substate.validate_target_speed(rpm=1234.56)).then_return(1234)

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)
    decoy.when(state_view.motion.get_robot_mount_axes()).then_return(
        [MotorAxis.EXTENSION_Z]
    )
    result = await subject.execute(data)
    decoy.verify(
        hs_module_substate.raise_if_labware_latch_not_closed(),
        await movement.home(
            [MotorAxis.EXTENSION_Z],
        ),
        await hs_hardware.set_speed(rpm=1234),
    )
    assert result == heater_shaker.SetAndWaitForShakeSpeedResult(pipetteRetracted=True)
