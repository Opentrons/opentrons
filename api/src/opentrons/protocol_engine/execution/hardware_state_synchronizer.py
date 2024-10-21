from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.execution.tip_handler import HardwareTipHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView


class HardwareStateSynchronizer:
    @staticmethod
    def synchronize(
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        state_update: update_types.StateUpdate,
    ) -> None:
        # TODO: Probably want to dependency-inject this.
        tip_handler = HardwareTipHandler(state_view, hardware_api)

        if state_update.pipette_tip_state != update_types.NO_CHANGE:
            pipette_id = state_update.pipette_tip_state.pipette_id
            tip_geometry = state_update.pipette_tip_state.tip_geometry
            if tip_geometry is None:
                tip_handler.remove_tip(pipette_id)
            else:
                tip_handler.add_tip(pipette_id=pipette_id, tip=tip_geometry)
