import logging
from typing import (
    Dict, Awaitable, Callable, Any, Set, List, Optional,
    TYPE_CHECKING)
from opentrons.types import Mount, Point, Location
from opentrons.config import feature_flags as ff
from opentrons.calibration_storage import modify
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.protocol_api import labware
from opentrons.protocols.geometry import deck

from robot_server.robot.calibration import util
from robot_server.service.errors import RobotServerError
from robot_server.service.session.models import CalibrationCommand
from robot_server.robot.calibration.constants import \
    TIP_RACK_LOOKUP_BY_MAX_VOL, SHORT_TRASH_DECK, STANDARD_DECK
from ..constants import TRASH_WELL, CAL_BLOCK_SETUP_BY_MOUNT, \
    MOVE_TO_TIP_RACK_SAFETY_BUFFER, MOVE_TO_REF_POINT_SAFETY_BUFFER, \
    TRASH_REF_POINT_OFFSET
from ..errors import CalibrationError
from ..helper_classes import RequiredLabware, AttachedPipette
from .constants import TipCalibrationState as State, TIP_RACK_SLOT
from .state_machine import TipCalibrationStateMachine

if TYPE_CHECKING:
    from opentrons_shared_data.labware import LabwareDefinition


MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the combination of a pipette tip type and a
unique (by serial number) physical pipette.
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


class TipCalibrationUserFlow:
    def __init__(self,
                 hardware: ThreadManager,
                 mount: Mount,
                 has_calibration_block: bool,
                 tip_rack: 'LabwareDefinition'):
        self._hardware = hardware
        self._mount = mount
        self._has_calibration_block = has_calibration_block
        self._hw_pipette = self._hardware._attached_instruments[mount]
        if not self._hw_pipette:
            raise RobotServerError(
                definition=CalibrationError.NO_PIPETTE_ON_MOUNT,
                mount=mount)
        self._tip_origin_pt: Optional[Point] = None
        self._nozzle_height_at_reference: Optional[float] = None

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = deck.Deck(load_name=deck_load_name)
        self._tip_rack = self._get_tip_rack_lw(tip_rack)
        self._initialize_deck()

        self._current_state = State.sessionStarted
        self._state_machine = TipCalibrationStateMachine()

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.jog: self.jog,
            CalibrationCommand.pick_up_tip: self.pick_up_tip,
            CalibrationCommand.invalidate_tip: self.invalidate_tip,
            CalibrationCommand.save_offset: self.save_offset,
            CalibrationCommand.move_to_reference_point: self.move_to_reference_point,  # noqa: E501
            CalibrationCommand.move_to_tip_rack: self.move_to_tip_rack,  # noqa: E501
            CalibrationCommand.exit: self.exit_session,
        }

    def _set_current_state(self, to_state: State):
        self._current_state = to_state

    @property
    def current_state(self) -> State:
        return self._current_state

    def get_pipette(self) -> AttachedPipette:
        return AttachedPipette(model=self._hw_pipette.model,
                               name=self._hw_pipette.name,
                               tip_length=self._hw_pipette.config.tip_length,
                               mount=str(self._mount),
                               serial=self._hw_pipette.pipette_id)

    def get_required_labware(self) -> List[RequiredLabware]:
        slots = self._deck.get_non_fixture_slots()
        lw_by_slot = {s: self._deck[s] for s in slots if self._deck[s]}
        return [
            RequiredLabware.from_lw(lw, s)  # type: ignore
            for s, lw in lw_by_slot.items()]

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
        MODULE_LOG.debug(f'TipCalUserFlow handled command {name}, transitioned'
                         f'from {self._current_state} to {next_state}')

    async def load_labware(self):
        pass

    async def move_to_tip_rack(self):
        # point safely above target tip well in tip rack
        pt_above_well = self._tip_rack.wells()[0].top().point + \
            MOVE_TO_TIP_RACK_SAFETY_BUFFER
        if self._tip_origin_pt is not None:
            # use jogged to x and y offsets only if returning tip to rack
            await self._move(Location(Point(self._tip_origin_pt.x,
                                            self._tip_origin_pt.y,
                                            pt_above_well.z),
                                      None))
        else:
            await self._move(Location(pt_above_well, None))

    async def save_offset(self):
        if self._current_state == State.measuringNozzleOffset:
            # critical point would default to nozzle for z height
            cur_pt = await self._get_current_point(
                critical_point=None)
            self._nozzle_height_at_reference = cur_pt.z
        elif self._current_state == State.measuringTipOffset:
            assert self._hw_pipette.has_tip
            assert self._nozzle_height_at_reference is not None
            # set critical point explicitly to nozzle
            cur_pt = await self._get_current_point(
                critical_point=CriticalPoint.NOZZLE)

            util.save_tip_length_calibration(
                pipette_id=self._hw_pipette.pipette_id,
                tip_length_offset=cur_pt.z - self._nozzle_height_at_reference,
                tip_rack=self._tip_rack)

    def _get_default_tip_length(self) -> float:
        tiprack: labware.Labware = self._deck[TIP_RACK_SLOT]  # type: ignore
        full_length = tiprack.tip_length
        overlap_dict: Dict = \
            self._hw_pipette.config.tip_overlap
        default = overlap_dict['default']
        overlap = overlap_dict.get(tiprack.uri, default)
        return full_length - overlap

    def _get_critical_point_override(self) -> Optional[CriticalPoint]:
        return (CriticalPoint.FRONT_NOZZLE if
                self._hw_pipette.config.channels == 8 else None)

    async def _get_current_point(
            self,
            critical_point: CriticalPoint = None) -> Point:
        return await self._hardware.gantry_position(self._mount,
                                                    critical_point)

    async def jog(self, vector):
        await self._hardware.move_rel(mount=self._mount,
                                      delta=Point(*vector))

    async def move_to_reference_point(self):
        ref_loc = util.get_reference_location(
            mount=self._mount,
            deck=self._deck,
            has_calibration_block=self._has_calibration_block)
        await self._move(ref_loc)

    async def pick_up_tip(self):
        await util.pick_up_tip(self, tip_length=self._get_default_tip_length())

    async def invalidate_tip(self):
        await util.invalidate_tip(self)

    async def exit_session(self):
        await self.move_to_tip_rack()
        await self._return_tip()

    def _get_tip_rack_lw(self,
                         tip_rack_def: 'LabwareDefinition') -> labware.Labware:
        try:
            return labware.load_from_definition(
                tip_rack_def,
                self._deck.position_for(TIP_RACK_SLOT))
        except Exception:
            raise RobotServerError(definition=CalibrationError.BAD_LABWARE_DEF)

    def _get_alt_tip_racks(self) -> Set[str]:
        pip_vol = self._hw_pipette.config.max_volume
        return set(TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].alternatives)

    def _initialize_deck(self):
        self._deck[TIP_RACK_SLOT] = self._tip_rack

        if self._has_calibration_block:
            cb_setup = CAL_BLOCK_SETUP_BY_MOUNT[self._mount]
            self._deck[cb_setup['slot']] = labware.load(
                cb_setup['load_name'],
                self._deck.position_for(cb_setup['slot']))

    async def _return_tip(self):
        await util.return_tip(self, tip_length=self._get_default_tip_length())

    async def _move(self, to_loc: Location):
        await util.move(self, to_loc)
