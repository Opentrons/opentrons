from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.actions.action_handler import ActionHandler
from opentrons.protocol_engine.actions.actions import (
    Action,
    FailCommandAction,
    ResumeFromRecoveryAction,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryType
from opentrons.protocol_engine.execution.tip_handler import HardwareTipHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView


class ErrorRecoveryHardwareStateSynchronizer(ActionHandler):
    def __init__(self, hardware_api: HardwareControlAPI, state_view: StateView) -> None:
        self._hardware_api = hardware_api
        self._state_view = state_view

    def handle_action(self, action: Action) -> None:
        state_update = _get_state_update(action)
        if state_update:
            self.synchronize(state_update)

    def synchronize(self, state_update: update_types.StateUpdate) -> None:
        tip_handler = HardwareTipHandler(self._state_view, self._hardware_api)

        if state_update.pipette_tip_state != update_types.NO_CHANGE:
            pipette_id = state_update.pipette_tip_state.pipette_id
            tip_geometry = state_update.pipette_tip_state.tip_geometry
            if tip_geometry is None:
                tip_handler.remove_tip(pipette_id)
            else:
                tip_handler.cache_tip(pipette_id=pipette_id, tip=tip_geometry)


def _get_state_update(action: Action) -> update_types.StateUpdate | None:
    # Return the state update that needs synchronization.
    match action:
        case ResumeFromRecoveryAction(state_update=state_update):
            # state_update here is
            return state_update
        case FailCommandAction(
            error=DefinedErrorData(
                state_update_if_false_positive=state_update_if_false_positive
            )
        ):
            return (
                state_update_if_false_positive
                if action.type == ErrorRecoveryType.ASSUME_FALSE_POSITIVE_AND_CONTINUE
                else None
            )
        case _:
            return None
