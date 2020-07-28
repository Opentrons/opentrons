import logging
from typing import Dict, Awaitable, Callable, Any, Set, List
from opentrons.types import Mount, Point, Location
from opentrons.config import feature_flags as ff
from opentrons.calibration_storage import modify
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.hardware_control.util import plan_arc
from opentrons.protocol_api import geometry, labware
from robot_server.service.session.models import CalibrationCommand, \
    TipLengthCalibrationCommand
from robot_server.robot.calibration.constants import (
    TIP_RACK_LOOKUP_BY_MAX_VOL,
    SHORT_TRASH_DECK,
    STANDARD_DECK
)
from robot_server.robot.calibration.tip_length.state_machine import (
    TipCalibrationStateMachine
)
from robot_server.robot.calibration.tip_length.util import (
    TipCalibrationError as Error
)
from robot_server.robot.calibration.tip_length.constants import (
    TipCalibrationState as State,
    TRASH_WELL,
    TIP_RACK_SLOT,
    CAL_BLOCK_SETUP_BY_MOUNT,
    MOVE_TO_TIP_RACK_SAFETY_BUFFER,
    MOVE_TO_REF_POINT_SAFETY_BUFFER,
    TRASH_REF_POINT_OFFSET
)
from robot_server.robot.calibration.tip_length.models import (
    RequiredLabware,
    AttachedPipette
)


MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the combination of a pipette tip type and a
unique (by serial number) physical pipette.
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


class TipCalibrationUserFlow():
    def __init__(self,
                 hardware: ThreadManager,
                 mount: Mount,
                 has_calibration_block: bool):
        self._hardware = hardware
        self._mount = mount
        self._has_calibration_block = has_calibration_block
        self._hw_pipette = self._hardware._attached_instruments[mount]
        if not self._hw_pipette:
            raise Error(f'No pipette found on {mount} mount,'
                        'cannot run tip length calibration')
        self._tip_origin_loc = None
        self._nozzle_height_at_reference = None

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = geometry.Deck(load_name=deck_load_name)
        self._initialize_deck()

        self._current_state = State.sessionStarted
        self._state_machine = TipCalibrationStateMachine()

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.jog: self.jog,
            CalibrationCommand.pick_up_tip: self.pick_up_tip,
            CalibrationCommand.invalidate_tip: self.invalidate_tip,
            CalibrationCommand.save_offset: self.save_offset,
            TipLengthCalibrationCommand.move_to_reference_point: self.move_to_reference_point,  # noqa: E501
            TipLengthCalibrationCommand.move_to_tip_rack: self.move_to_tip_rack,  # noqa: E501
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
        alt_trs = self._get_alt_tip_racks(),
        return [
            RequiredLabware(
                alternatives=alt_trs if s == TIP_RACK_SLOT else [],
                slot=s,
                loadName=lw.load_name,
                namespace=lw._definition['namespace'],  # type: ignore
                version=str(lw._definition['version']),  # type: ignore
                isTiprack=lw.is_tiprack  # type: ignore
            ) for s, lw in lw_by_slot.items()
        ]

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
        point = self._deck[TIP_RACK_SLOT].wells()[0].top().point + \
                MOVE_TO_TIP_RACK_SAFETY_BUFFER
        to_loc = Location(point, None)
        await self._move(to_loc)

    async def move_to_reference_point(self):
        to_loc = self._get_reference_point()
        await self._move(to_loc)

    def _get_reference_point(self) -> Location:
        if self._has_calibration_block:
            slot = CAL_BLOCK_SETUP_BY_MOUNT[self._mount]['slot']
            well = CAL_BLOCK_SETUP_BY_MOUNT[self._mount]['well']
            calblock: labware.Labware = self._deck[slot]  # type: ignore
            calblock_loc = calblock.wells_by_name()[well].top()
            return calblock_loc.move(point=MOVE_TO_REF_POINT_SAFETY_BUFFER)
        else:
            trash = self._deck.get_fixed_trash()
            assert trash
            trash_loc = trash.wells_by_name()[TRASH_WELL].top()
            return trash_loc.move(TRASH_REF_POINT_OFFSET +
                                  MOVE_TO_REF_POINT_SAFETY_BUFFER)

    async def save_offset(self):
        if self._current_state == State.measuringNozzleOffset:
            cur_pt = await self._hardware.gantry_position(
                self._mount, critical_point=CriticalPoint.FRONT_NOZZLE)
            self._nozzle_height_at_reference = cur_pt.z
        elif self._current_state == State.measuringTipOffset:
            assert self._hw_pipette.has_tip
            tip_length_offset = await self._calculate_tip_length()

            # TODO: 07-22-2020 parent slot is not important when tracking
            # tip length data, hence the empty string, we should remove it
            # from create_tip_length_data in a refactor
            tip_length_data = modify.create_tip_length_data(
                self._deck[TIP_RACK_SLOT]._definition, '',
                tip_length_offset)
            modify.save_tip_length_calibration(self._hw_pipette.pipette_id,
                                               tip_length_data)

    async def _calculate_tip_length(self) -> float:
        cur_pt = await self._hardware.gantry_position(
            self._mount, critical_point=CriticalPoint.NOZZLE)
        return cur_pt.z - self._nozzle_height_at_reference

    def _get_default_tip_length(self) -> float:
        tiprack: labware.Labware = self._deck[TIP_RACK_SLOT]  # type: ignore
        full_length = tiprack.tip_length
        overlap_dict: Dict = \
            self._hw_pipette.config.tip_overlap
        default = overlap_dict['default']
        overlap = overlap_dict.get(tiprack.uri, default)
        return full_length - overlap

    def _get_critical_point(self):
        return (CriticalPoint.FRONT_NOZZLE if
                self._hw_pipette.config.channels == 8 else
                self._hw_pipette.critical_point)

    async def jog(self, vector):
        await self._hardware.move_rel(self._mount, Point(*vector))

    async def pick_up_tip(self):
        saved_default = None
        if self._hw_pipette.config.channels > 1:
            # reduce pick up current for multichannel pipette picking up 1 tip
            saved_default = self._hw_pipette.config.pick_up_current
            self._hw_pipette.update_config_item('pick_up_current', 0.1)

        tip_length = self._get_default_tip_length()
        cur_pt = await self._hardware.gantry_position(self._mount)
        self._tip_origin_loc = Location(cur_pt, None)

        await self._hardware.pick_up_tip(self._mount, tip_length)

        if saved_default:
            self._hw_pipette.update_config_item('pick_up_current',
                                                saved_default)

    async def invalidate_tip(self):
        await self._return_tip()
        await self.move_to_tip_rack()

    async def exit_session(self):
        await self._return_tip()

    def _get_tip_rack_lw(self) -> labware.Labware:
        pip_vol = self._hw_pipette.config.max_volume
        tr_lookup = TIP_RACK_LOOKUP_BY_MAX_VOL.get(str(pip_vol), None)
        if tr_lookup:
            return labware.load(tr_lookup.load_name,
                                self._deck.position_for(TIP_RACK_SLOT))
        else:
            raise Error(
                    f'No tiprack found for pipette {self._hw_pipette.model}')

    def _get_alt_tip_racks(self) -> Set[str]:
        pip_vol = self._hw_pipette.config.max_volume
        return set(TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].alternatives)

    def _initialize_deck(self):
        tip_rack_lw = self._get_tip_rack_lw()
        self._deck[TIP_RACK_SLOT] = tip_rack_lw

        if self._has_calibration_block:
            cb_setup = CAL_BLOCK_SETUP_BY_MOUNT[self._mount]
            self._deck[cb_setup['slot']] = labware.load(
                cb_setup['load_name'],
                self._deck.position_for(cb_setup['slot']))

    async def _return_tip(self):
        """
        Move pipette with tip to tip rack well, such that
        the tip is inside the well, but not so deep that
        the tip rack will block the sheath from ejecting fully.
        Each pipette config contains a coefficient to apply to an
        attached tip's length to determine proper return tip z offset
        """
        if self._tip_origin_loc and self._hw_pipette.has_tip:
            tip_length = self._get_default_tip_length()
            tip_return_ratio = self._hw_pipette.config.return_tip_height
            return_z = tip_length * tip_return_ratio
            to_pt = self._tip_origin_loc.point - Point(0, 0, return_z)

            cp = self._get_critical_point()
            await self._hardware.move_to(self._mount, to_pt,
                                         critical_point=cp)
            await self._hardware.drop_tip(self._mount)
            self._tip_origin_loc = None

    async def _move(self, to_loc: Location):
        from_pt = await self._hardware.gantry_position(self._mount)
        from_loc = Location(from_pt, None)
        cp = self._get_critical_point()

        max_height = self._hardware.get_instrument_max_height(self._mount)

        safe = geometry.safe_height(
            from_loc, to_loc, self._deck, max_height)
        moves = plan_arc(from_pt, to_loc.point, safe,
                         origin_cp=None,
                         dest_cp=cp)
        for move in moves:
            await self._hardware.move_to(
                self._mount, move[0], critical_point=move[1])
