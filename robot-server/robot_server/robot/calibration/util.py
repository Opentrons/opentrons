import contextlib
from typing import Set, Dict, Any, Union, TYPE_CHECKING

from opentrons.hardware_control import Pipette
from opentrons.hardware_control.util import plan_arc
from opentrons.protocols.geometry import util as geometry
from opentrons.types import Point, Location

from robot_server.service.errors import RobotServerError
from robot_server.service.session.models import CommandDefinition
from .constants import STATE_WILDCARD
from .errors import CalibrationError
from .tip_length.constants import TipCalibrationState
from .pipette_offset.constants import PipetteOffsetCalibrationState
from .deck.constants import DeckCalibrationState

if TYPE_CHECKING:
    from .deck.user_flow import DeckCalibrationUserFlow
    from .tip_length.user_flow import TipCalibrationUserFlow
    from .pipette_offset.user_flow import PipetteOffsetCalibrationUserFlow

ValidState = Union[TipCalibrationState, DeckCalibrationState,
                   PipetteOffsetCalibrationState]


class StateTransitionError(RobotServerError):
    def __init__(self,
                 action: CommandDefinition,
                 state: ValidState):
        super().__init__(definition=CalibrationError.BAD_STATE_TRANSITION,
                         action=action,
                         state=state.name)


TransitionMap = Dict[Any, Set[Dict[Any, Any]]]


class SimpleStateMachine:
    def __init__(self,
                 states: Set[Any],
                 transitions: TransitionMap):
        """
        Construct a simple state machine

        :param states: a collection of available states
        :param transitions: the transitions, keyed by "from state",
            with value a dictionary of triggering command to "to state"
        """
        self._states = states
        self._transitions = transitions

    def get_next_state(self, from_state, command):
        """
        Trigger a state transition

        :param from_state: The current state
        :param command: The triggering command
        :param to_state: The desired state
        :return: desired state if successful, None if fails
        """

        wc_transitions = self._transitions.get(STATE_WILDCARD, {})
        wc_to_state = wc_transitions.get(command, {})

        fs_transitions = self._transitions.get(from_state, {})
        fs_to_state = fs_transitions.get(command, {})

        if wc_to_state:
            return wc_to_state
        elif fs_to_state:
            return fs_to_state
        else:
            return None


CalibrationUserFlow = Union[
    'DeckCalibrationUserFlow',
    'TipCalibrationUserFlow',
    'PipetteOffsetCalibrationUserFlow']


async def invalidate_tip(user_flow: CalibrationUserFlow):
    await user_flow._return_tip()
    await user_flow.move_to_tip_rack()


@contextlib.contextmanager
def save_default_pick_up_current(instr: Pipette):
    # reduce pick up current for multichannel pipette picking up 1 tip
    saved_default = instr.config.pick_up_current
    instr.update_config_item('pick_up_current', 0.1)

    try:
        yield
    finally:
        instr.update_config_item('pick_up_current', saved_default)


async def pick_up_tip(user_flow: CalibrationUserFlow, tip_length: float):
    # grab position of active nozzle for ref when returning tip later
    cp = user_flow._get_critical_point_override()
    user_flow._tip_origin_pt = await user_flow._hardware.gantry_position(
        user_flow._mount, critical_point=cp)

    with contextlib.ExitStack() as stack:
        if user_flow._hw_pipette.config.channels > 1:
            stack.enter_context(
                save_default_pick_up_current(user_flow._hw_pipette))

        await user_flow._hardware.pick_up_tip(user_flow._mount, tip_length)


async def return_tip(user_flow: CalibrationUserFlow, tip_length: float):
    """
    Move pipette with tip to tip rack well, such that
    the tip is inside the well, but not so deep that
    the tip rack will block the sheath from ejecting fully.
    Each pipette config contains a coefficient to apply to an
    attached tip's length to determine proper z offset
    """
    if user_flow._tip_origin_pt and user_flow._hw_pipette.has_tip:
        coeff = user_flow._hw_pipette.config.return_tip_height
        to_pt = user_flow._tip_origin_pt - Point(0, 0, tip_length * coeff)
        cp = user_flow._get_critical_point_override()
        await user_flow._hardware.move_to(mount=user_flow._mount,
                                          abs_position=to_pt,
                                          critical_point=cp)
        await user_flow._hardware.drop_tip(user_flow._mount)
        user_flow._tip_origin_pt = None


async def move(user_flow: CalibrationUserFlow, to_loc: Location):
    from_pt = await user_flow._get_current_point()
    from_loc = Location(from_pt, None)
    cp = user_flow._get_critical_point_override()

    max_height = user_flow._hardware.get_instrument_max_height(
        user_flow._mount)

    safe = geometry.safe_height(
        from_loc, to_loc, user_flow._deck, max_height)
    moves = plan_arc(from_pt, to_loc.point, safe,
                     origin_cp=None,
                     dest_cp=cp)
    for move in moves:
        await user_flow._hardware.move_to(mount=user_flow._mount,
                                          abs_position=move[0],
                                          critical_point=move[1])
