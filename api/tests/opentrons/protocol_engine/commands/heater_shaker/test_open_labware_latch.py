"""Test Heater Shaker open labware latch command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.open_labware_latch import (
    OpenLabwareLatchImpl,
)
from opentrons.protocol_engine.types import MotorAxis


async def test_open_labware_latch(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should be able to open the module's labware latch."""
    subject = OpenLabwareLatchImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )
    data = heater_shaker.OpenLabwareLatchParams(moduleId="input-heater-shaker-id")

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
        state_view.motion.check_pipette_blocking_hs_latch(
            HeaterShakerModuleId("heater-shaker-id")
        )
    ).then_return(True)

    # Get stubbed hardware module
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)
    decoy.when(state_view.motion.get_robot_mount_axes()).then_return(
        [MotorAxis.EXTENSION_Z]
    )
    result = await subject.execute(data)
    decoy.verify(
        hs_module_substate.raise_if_shaking(),
        await movement.home(
            [MotorAxis.EXTENSION_Z],
        ),
        await hs_hardware.open_labware_latch(),
    )
    assert result == heater_shaker.OpenLabwareLatchResult(pipetteRetracted=True)
