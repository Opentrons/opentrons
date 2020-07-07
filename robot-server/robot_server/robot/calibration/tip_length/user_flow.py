import typing
from opentrons.types import Mount, Point
from opentrons.hardware_control import ThreadManager
from robot_server.service.session.models import (
    CommandName,
    CommandDataType,
    JogPosition
)
from robot_server.robot.calibration.tip_length.util import (
    SimpleStateMachine,
    TipCalibrationError as Error
)
from robot_server.robot.calibration.tip_length.constants import (
    TipCalibrationState as State,
)


"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the combination of a pipette tip type and a
unique (by serial number) physical pipette.
"""

TIP_LENGTH_TRANSITIONS: typing.Dict[State, typing.Set[State]] = {
    State.sessionStarted: {State.labwareLoaded},
    State.labwareLoaded: {State.measuringNozzleOffset},
    State.measuringNozzleOffset: {State.preparingPipette},
    State.preparingPipette: {State.measuringTipOffset},
    State.measuringTipOffset: {State.calibrationComplete},
    State.WILDCARD: {State.sessionExited},
}

# TODO: enumerate acceptable command names for this session type
TipLengthCommandName = CommandName

COMMAND_HANDLER = typing.Callable[[CommandDataType], typing.Awaitable]

COMMAND_MAP = typing.Dict[TipLengthCommandName, typing.Tuple[COMMAND_HANDLER,
                          typing.Set[State]]]


class TipCalibrationUserFlow():
    def __init__(self,
                 hardware: ThreadManager,
                 mount: Mount = Mount.LEFT,
                 has_calibration_block=True):
        # TODO: require mount and has_calibration_block params
        self._has_calibration_block = has_calibration_block
        self._hardware = hardware
        self._current_state = State.sessionStarted
        self._state_machine = SimpleStateMachine(
            states=set(s for s in State),
            transitions=TIP_LENGTH_TRANSITIONS
        )
        self._mount = mount
        self._hw_pipette = self._hardware.attached_instruments[mount]
        if not self._hw_pipette:
            raise Error(f'No pipette found on {mount} mount,'
                        'cannot run tip length calibration')

        self._command_map: COMMAND_MAP = {
            CommandName.load_labware: (self.load_labware,
                                       {State.sessionStarted}),
            CommandName.jog: (self.jog, {State.measuringNozzleOffset,
                                         State.measuringTipOffset,
                                         State.preparingPipette}),
            CommandName.pick_up_tip: (self.pick_up_tip,
                                      {State.preparingPipette}),
            CommandName.invalidate_tip: (self.invalidate_tip,
                                         {State.preparingPipette}),
            CommandName.save_offset: (self.save_offset,
                                      {State.measuringNozzleOffset,
                                       State.measuringTipOffset}),
            CommandName.move_to_reference_point: (self.move_to_reference_point,
                                                  {State.labwareLoaded,
                                                   State.preparingPipette}),
            CommandName.exit: (self.exit_session, {State.WILDCARD})
        }

    def _transition_to_state(self, to_state):
        next_state = self._state_machine.trigger_transition(
                self._current_state,
                to_state)
        if next_state:
            self._current_state = next_state
        else:
            raise Error(f"Cannot proceed to {to_state} step"
                        f"from {self._current_state}.")

    async def handle_command(self,
                             name: TipLengthCommandName,
                             data: CommandDataType):
        """
        Handle a client command

        :param name: Name of the command
        :param data: Data supplied in command
        :return: None
        """

        command_info = self._command_map.get(name)
        if command_info is not None:
            handler = command_info[0]
            valid_states = command_info[1]
            if (State.WILDCARD not in valid_states) and \
                    (self._current_state not in valid_states):
                raise Error(f'Cannot issue {name} command '
                            f'from {self._current_state}')
            args = dict(data)
            return await handler(**args)

    async def load_labware(self, *args):
        # TODO: load tip rack onto deck
        # TODO: move to pick up tip pick up start location
        self._transition_to_state(State.labwareLoaded)

    async def move_to_reference_point(self, *args):
        # TODO: move nozzle/tip to reference location (block || trash edge)
        if self._current_state == State.labwareLoaded:
            self._transition_to_state(State.measuringNozzleOffset)
        elif self._current_state == State.preparingPipette:
            self._transition_to_state(State.measuringTipOffset)

    async def save_offset(self, *args):
        # TODO: save the current nozzle/tip offset here
        if self._current_state == State.measuringNozzleOffset:
            # TODO: move to pick up tip pick up start location
            self._transition_to_state(State.preparingPipette)
        elif self._current_state == State.measuringTipOffset:
            self._transition_to_state(State.calibrationComplete)

    async def jog(self, vector, *args):
        await self._hardware.move_rel(self._mount, Point(*vector))

    async def pick_up_tip(self, *args):
        saved_default = None
        if self._hw_pipette.config.channels > 1:
            # reduce pick up current for multichannel pipette picking up 1 tip
            saved_default = self._hw_pipette.config.pick_up_current
            self._hw_pipette.update_config_item('pick_up_current', 0.1)
        tip_length = self._hw_pipette.config.tip_length

        # TODO: get proper tip length from loaded tip rack
        # # Note: ABC DeckItem cannot have tiplength b/c of
        # # mod geometry contexts. Ignore type checking error here.
        # tiprack = self._deck[lw_info.slot]
        # full_length = tiprack.tip_length  # type: ignore
        # overlap_dict: typing.Dict =\
        #     self.pipettes[mount]['tip_overlap']  # type: ignore
        # default = overlap_dict['default']
        # overlap = overlap_dict.get(
        #                         tiprack.uri,  # type: ignore
        #                         default)
        # tip_length = full_length - overlap
        # Do we need a fallback tip length here anymore?
        # tip_length = self.pipettes[mount]['fallback_tip_length']

        await self._hardware.pick_up_tip(self._mount, tip_length)
        if saved_default:
            self._hw_pipette.update_config_item('pick_up_current',
                                                saved_default)
        # TODO: save current location locally for returning tip later

    async def invalidate_tip(self, *args):
        # TODO: move back to pick up tip start location
        await self._hardware.drop_tip(self._mount)

    async def exit_session(self, *args):
        # TODO: move to saved (jogged to) pick up tip location, return tip
        self._transition_to_state(State.sessionExited)
