# noqa: D100

from logging import getLogger

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.actions.action_handler import ActionHandler
from opentrons.protocol_engine.actions.actions import (
    Action,
    BeginAwaitingRecoveryAction,
    FailCommandAction,
    ResumeFromRecoveryAction,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryType
from opentrons.protocol_engine.execution.pipetting import HardwarePipettingHandler
from opentrons.protocol_engine.execution.tip_handler import HardwareTipHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView

log = getLogger(__name__)


class ErrorRecoveryHardwareStateSynchronizer(ActionHandler):
    """A hack to keep the hardware API's state correct through certain error recovery flows.

    BACKGROUND:

    Certain parts of robot state are duplicated between `opentrons.protocol_engine` and
    `opentrons.hardware_control`. Stuff like "is there a tip attached."

    Normally, Protocol Engine command implementations (`opentrons.protocol_engine.commands`)
    mutate hardware API state when they execute; and then when they finish executing,
    the Protocol Engine state stores (`opentrons.protocol_engine.state`) update Protocol
    Engine state accordingly. So both halves are accounted for. This generally works fine.

    However, we need to go out of our way to support
    `ProtocolEngine.resume_from_recovery(reconcile_false_positive=True)`.
    It wants to apply a second set of state updates to "fix things up" with the
    new knowledge that some error was a false positive. The Protocol Engine half of that
    is easy for us to apply the normal way, through the state stores; but the
    hardware API half of that cannot be applied the normal way, from the command
    implementation, because the command in question is no longer running.

    THE HACK:

    This listens for the same error recovery state updates that the state stores do,
    figures out what hardware API state mutations ought to go along with them,
    and then does those mutations.

    The problem is that hardware API state is now mutated from two different places
    (sometimes the command implementations, and sometimes here), which are bound
    to grow accidental differences.

    ``handle_action`` is synchronous and runs when the action is dispatched.
    That is too late to move the plunger: dispatch releases the protocol.
    ``prepare_for_false_positive_tip_pickup`` runs before that dispatch.

    TO FIX:

    Make Protocol Engine's use of the hardware API less stateful. e.g. supply
    tip geometry every time we call a hardware API movement method, instead of
    just once when we pick up a tip. Use Protocol Engine state as the single source
    of truth.
    """

    def __init__(self, hardware_api: HardwareControlAPI, state_view: StateView) -> None:
        self._hardware_api = hardware_api
        self._state_view = state_view

    def handle_action(self, action: Action) -> None:
        """Modify hardware API state in reaction to a Protocol Engine action."""
        state_update = _get_state_update(action)
        if state_update:
            self._synchronize(state_update)

    async def prepare_for_false_positive_tip_pickup(
        self, state_update: update_types.StateUpdate
    ) -> None:
        """Finish a false-positive pickup before the protocol continues.

        A successful ``pickUpTip`` caches the tip and calls ``prepare_for_aspirate``
        before it sets ``ready_to_aspirate``. The tip-presence check raises before
        that, so this does the plunger move when the false-positive update is about
        to attach a tip.

        Call this before the failed command is finalized or recovery resumes. If the
        protocol resumes while ``ready_to_aspirate`` is false, the next liquid-class
        transfer queues its own ``prepareToAspirate`` and shifts every later command
        key off analysis. If the plunger move fails, the pipette is left not ready
        so the protocol can prepare it itself.
        """
        tip_update = state_update.pipette_tip_state
        ready_update = state_update.ready_to_aspirate
        if (
            tip_update == update_types.NO_CHANGE
            or tip_update.tip_geometry is None
            or ready_update == update_types.NO_CHANGE
            or not ready_update.ready_to_aspirate
        ):
            return

        tip_handler = HardwareTipHandler(self._state_view, self._hardware_api)
        pipetting = HardwarePipettingHandler(self._state_view, self._hardware_api)
        try:
            tip_handler.cache_tip(
                pipette_id=tip_update.pipette_id, tip=tip_update.tip_geometry
            )
            await pipetting.prepare_for_aspirate(tip_update.pipette_id)
        except Exception:
            log.warning(
                "Failed to prepare pipette %s after a false-positive tip pickup.",
                tip_update.pipette_id,
                exc_info=True,
            )
            state_update.set_pipette_ready_to_aspirate(
                pipette_id=tip_update.pipette_id, ready_to_aspirate=False
            )

    def _synchronize(self, state_update: update_types.StateUpdate) -> None:
        tip_handler = HardwareTipHandler(self._state_view, self._hardware_api)

        if state_update.pipette_tip_state != update_types.NO_CHANGE:
            pipette_id = state_update.pipette_tip_state.pipette_id
            tip_geometry = state_update.pipette_tip_state.tip_geometry
            if tip_geometry is None:
                tip_handler.remove_tip(pipette_id)
            else:
                tip_handler.cache_tip(pipette_id=pipette_id, tip=tip_geometry)


def _get_state_update(action: Action) -> update_types.StateUpdate | None:
    """Get the mutations that we need to do on the hardware API to stay in sync with an engine action.

    The mutations are returned in Protocol Engine terms, as a StateUpdate.
    They then need to be converted to hardware API terms.
    """
    match action:
        case ResumeFromRecoveryAction(state_update=state_update):
            return state_update

        case (
            FailCommandAction(
                error=DefinedErrorData(
                    state_update_if_false_positive=state_update_if_false_positive
                )
            )
            | BeginAwaitingRecoveryAction(
                error=DefinedErrorData(
                    state_update_if_false_positive=state_update_if_false_positive
                )
            )
        ):
            return (
                state_update_if_false_positive
                if action.type == ErrorRecoveryType.ASSUME_FALSE_POSITIVE_AND_CONTINUE
                else None
            )

        case _:
            return None
