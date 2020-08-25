import logging
from typing import Any, Awaitable, Callable, Dict, List, Optional

from opentrons.calibration_storage import get
from opentrons.calibration_storage.types import TipLengthCalNotFound
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.protocol_api import geometry, labware
from opentrons.types import Mount, Point, Location
from robot_server.service.errors import RobotServerError
from robot_server.service.session.models import CalibrationCommand
from robot_server.robot.calibration.constants import (
    TIP_RACK_LOOKUP_BY_MAX_VOL,
    SHORT_TRASH_DECK,
    STANDARD_DECK,
    POINT_ONE_ID,
    MOVE_TO_DECK_SAFETY_BUFFER,
    MOVE_TO_TIP_RACK_SAFETY_BUFFER)
import robot_server.robot.calibration.util as uf
from ..errors import CalibrationError
from ..helper_classes import (RequiredLabware, AttachedPipette)
from .constants import (PipetteOffsetCalibrationState as State,
                        TIP_RACK_SLOT, JOG_TO_DECK_SLOT)
from .state_machine import PipetteOffsetCalibrationStateMachine


MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the orientation of a specific physical
pipette attached to the gantry, in relation to the deck
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


class PipetteOffsetCalibrationUserFlow:
    def __init__(self,
                 hardware: ThreadManager,
                 mount: Mount = Mount.RIGHT):
        self._hardware = hardware
        self._mount = mount
        self._hw_pipette = self._hardware._attached_instruments[mount]
        if not self._hw_pipette:
            raise RobotServerError(
                definition=CalibrationError.NO_PIPETTE_ON_MOUNT,
                mount=mount)

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = geometry.Deck(load_name=deck_load_name)
        self._tip_rack = self._get_tip_rack_lw()
        self._deck[TIP_RACK_SLOT] = self._tip_rack

        self._current_state = State.sessionStarted
        self._state_machine = PipetteOffsetCalibrationStateMachine()

        self._tip_origin_pt: Optional[Point] = None

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.jog: self.jog,
            CalibrationCommand.pick_up_tip: self.pick_up_tip,
            CalibrationCommand.invalidate_tip: self.invalidate_tip,
            CalibrationCommand.save_offset: self.save_offset,
            CalibrationCommand.move_to_tip_rack: self.move_to_tip_rack,
            CalibrationCommand.move_to_deck: self.move_to_deck,
            CalibrationCommand.move_to_point_one: self.move_to_point_one,
            CalibrationCommand.exit: self.exit_session,
        }

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    @property
    def current_state(self) -> State:
        return self._current_state

    def get_pipette(self) -> AttachedPipette:
        return AttachedPipette(
            model=self._hw_pipette.model,
            name=self._hw_pipette.name,
            tip_length=self._hw_pipette.config.tip_length,
            mount=str(self._mount),
            serial=self._hw_pipette.pipette_id)

    def get_required_labware(self) -> List[RequiredLabware]:
        return [RequiredLabware.from_lw(self._tip_rack)]

    def _set_current_state(self, to_state: State):
        self._current_state = to_state

    def _get_tip_rack_lw(self) -> labware.Labware:
        pip_vol = self._hw_pipette.config.max_volume
        lw_load_name = TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].load_name
        return labware.load(lw_load_name,
                            self._deck.position_for(TIP_RACK_SLOT))

    async def handle_command(self,
                             name: Any,
                             data: Dict[Any, Any]):
        """
        Handle a client command

        :param name: Name of the command
        :param data: Data supplied in command
        :return: None
        """
        next_state = self._state_machine.get_next_state(self._current_state,
                                                        name)

        handler = self._command_map.get(name)
        if handler is not None:
            await handler(**data)
        self._set_current_state(next_state)
        MODULE_LOG.debug(
            f'PipetteOffsetCalUserFlow handled command {name}, transitioned'
            f'from {self._current_state} to {next_state}')

    def _get_critical_point(self) -> CriticalPoint:
        return (CriticalPoint.FRONT_NOZZLE if
                self._hw_pipette.config.channels == 8 else
                self._hw_pipette.critical_point)

    async def _get_current_point(self) -> Point:
        return await self._hardware.gantry_position(self._mount)

    async def load_labware(self):
        pass

    async def jog(self, vector):
        await self._hardware.move_rel(mount=self._mount,
                                      delta=Point(*vector))

    async def move_to_tip_rack(self):
        point = self._deck[TIP_RACK_SLOT].wells()[0].top().point + \
                MOVE_TO_TIP_RACK_SAFETY_BUFFER
        to_loc = Location(point, None)
        await self._move(to_loc)

    def _get_tip_length(self) -> float:
        try:
            return get.load_tip_length_calibration(
                self._hw_pipette.pipette_id,  # type: ignore
                self._tip_rack._definition,
                '')['tipLength']
        except TipLengthCalNotFound:
            tip_overlap = self._hw_pipette.config.tip_overlap.get(
                self._tip_rack.uri,
                self._hw_pipette.config.tip_overlap['default'])
            tip_length = self._tip_rack.tip_length
            return tip_length - tip_overlap

    async def move_to_deck(self):
        deck_pt = self._deck.get_slot_center(JOG_TO_DECK_SLOT)
        ydim = self._deck.get_slot_definition(
            JOG_TO_DECK_SLOT)['boundingBox']['yDimension']
        new_pt = deck_pt + Point(0, (ydim/2), 0) + \
            MOVE_TO_DECK_SAFETY_BUFFER
        to_loc = Location(new_pt, None)
        await self._move(to_loc)

    async def move_to_point_one(self):
        coords = self._deck.get_calibration_position(POINT_ONE_ID).position
        await self._move(Location(Point(*coords), None))

    async def save_offset(self):
        pass

    async def pick_up_tip(self):
        await uf.pick_up_tip(self, tip_length=self._get_tip_length())

    async def invalidate_tip(self):
        await uf.invalidate_tip(self)

    async def _return_tip(self):
        await uf.return_tip(self, tip_length=self._get_tip_length())

    async def _move(self, to_loc: Location):
        await uf.move(self, to_loc)

    async def exit_session(self):
        await self._return_tip()
