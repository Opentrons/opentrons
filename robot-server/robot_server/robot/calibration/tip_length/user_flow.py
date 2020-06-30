import typing
import asyncio
from opentrons.types import Mount, Point
from opentrons.hardware_control import ThreadManager
from robot_server.robot.calibration.tip_length.util import (SimpleStateMachine,
                                                            WILDCARD)
from robot_server.robot.calibration.tip_length.types import (
    TipCalibrationState as State,
    TipCalibrationError as Error
)


"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the combination of a pipette tip type and a
unique (by serial number) physical pipette.
"""

TIP_LENGTH_TRANSITIONS: typing.Dict[str, str] = {
    State.sessionStarted: {State.labwareLoaded},
    State.labwareLoaded: {State.measuringNozzleOffset},
    State.measuringNozzleOffset: {State.measuringNozzleOffset,
                                  State.preparingPipette},
    State.preparingPipette: {State.preparingPipette,
                             State.inspectingTip,
                             State.measuringTipOffset},
    State.measuringTipOffset: {State.measuringTipOffset,
                               State.calibrationComplete},
    WILDCARD: {State.sessionExited},
}


class TipCalibrationUserFlow():
    def __init__(self,
                 hardware: ThreadManager,
                 mount: Mount = 'left',
                 has_calibration_block=True):
        # TODO: require mount and has_calibration_block params
        self._has_calibration_block = has_calibration_block
        self._hardware = hardware
        self._current_state = State.sessionStarted
        self._state_machine = SimpleStateMachine(
            states=set([s for s in State]),
            transitions=TIP_LENGTH_TRANSITIONS
        )
        self._mount = mount
        self._hw_pipette = self._hardware.attached_instruments[mount]
        if not self._hw_pipette:
            raise Error(f'No pipette found on {mount} mount,'
                        'cannot run tip length calibration')

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
                             name: str,
                             data: typing.Dict[typing.Any, typing.Any]):
        """
        Handle a client command

        :param name: Name of the command
        :param data: Data supplied in command
        :return: None
        """
        handler = getattr(self, name)
        if asyncio.iscoroutinefunction(handler):
            await handler(**data)
        else:
            handler(**data)

    async def load_labware(self):
        # TODO: load tip rack onto deck
        self._transition_to_state(State.labwareLoaded)

    async def move_to_measure_nozzle_offset(self):
        # TODO: move to reference location (block || trash edge)
        self._transition_to_state(State.measuringNozzleOffset)

    async def save_nozzle_position(self):
        # TODO: save the current nozzle offset here
        # TODO: move to pick up tip pick up start location
        self._transition_to_state(State.preparingPipette)

    async def jog(self, vector: Point):
        await self._hardware.move_rel(self._mount, vector)

    async def pick_up_tip(self):
        if self._current_state != State.preparingPipette:
            raise Error('Cannot issue pick_up_tip command '
                        f'from {self._current_state}')
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

    async def invalidate_tip(self):
        if self._current_state != State.preparingPipette:
            raise Error('Cannot issue invalidate_tip command '
                        f'from {self._current_state}')
        # TODO: move back to pick up tip start location
        await self._hardware.drop_tip(self._mount)

    def confirm_tip_attached(self):
        if self._current_state != State.preparingPipette:
            raise Error('Cannot issue confirm_tip_attached command '
                        f'from {self._current_state}')
        # TODO: move to reference location (block || trash edge)
        self._transition_to_state(State.measuringTipOffset)

    def save_tip_position(self):
        self._transition_to_state(State.calibrationComplete)

    async def exit_session(self):
        # TODO: move to saved (jogged to) pick up tip location, return tip
        self._transition_to_state(State.sessionExited)
