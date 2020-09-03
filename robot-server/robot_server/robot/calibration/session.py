import contextlib
import typing
from uuid import UUID, uuid4

from robot_server.robot.calibration.constants import (
    TIP_RACK_LOOKUP_BY_MAX_VOL,
    SHORT_TRASH_DECK,
    STANDARD_DECK
)
from robot_server.robot.calibration.errors import CalibrationError
from robot_server.robot.calibration.helper_classes import PipetteInfo, \
    PipetteRank, LabwareInfo, Moves, CheckMove
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager, Pipette, CriticalPoint
from opentrons.hardware_control.util import plan_arc
from opentrons.protocol_api import labware
from opentrons.protocols.geometry import deck, planning
from opentrons.types import Mount, Point, Location

from robot_server.service.errors import RobotServerError
from .util import save_default_pick_up_current


class SessionManager:
    """Small wrapper to keep track of robot calibration sessions created."""
    def __init__(self):
        self._sessions = {}

    @property
    def sessions(self):
        return self._sessions


# vector from front bottom left of slot 12
HEIGHT_SAFETY_BUFFER = Point(0, 0, 5.0)


class CalibrationSession:
    """Class that controls state of the current robot calibration session"""
    def __init__(self, hardware: ThreadManager,
                 lights_on_before: bool = False):
        self._hardware = hardware
        self._lights_on_before = lights_on_before

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = deck.Deck(load_name=deck_load_name)
        self._pip_info_by_mount = self._get_pip_info_by_mount(
                hardware.get_attached_instruments())
        self._labware_info = self._determine_required_labware()
        self._moves = self._build_deck_moves()

    @classmethod
    async def build(cls, hardware: ThreadManager):
        lights_on = hardware.get_lights()['rails']
        await hardware.cache_instruments()
        await hardware.set_lights(rails=True)
        await hardware.home()
        return cls(hardware=hardware, lights_on_before=lights_on)

    @staticmethod
    def _get_pip_info_by_mount(
            new_pipettes: typing.Dict[Mount, Pipette.DictType]) \
            -> typing.Dict[Mount, PipetteInfo]:
        pip_info_by_mount = {}
        attached_pips = {m: p for m, p in new_pipettes.items() if p}
        num_pips = len(attached_pips)
        if num_pips > 0:
            for mount, data in attached_pips.items():
                if data:
                    rank = PipetteRank.first
                    if num_pips == 2 and mount == Mount.LEFT:
                        rank = PipetteRank.second
                    cp = None
                    if data['channels'] == 8:
                        cp = CriticalPoint.FRONT_NOZZLE
                    pip_info_by_mount[mount] = PipetteInfo(tiprack_id=None,
                                                           critical_point=cp,
                                                           rank=rank,
                                                           mount=mount)
            return pip_info_by_mount
        else:
            raise RobotServerError(
                definition=CalibrationError.NO_PIPETTE_ATTACHED,
                flow='calibration check')

    def _determine_required_labware(self) -> typing.Dict[UUID, LabwareInfo]:
        """
        A function that inserts tiprack information into two dataclasses
        :py:class:`.LabwareInfo` and :py:class:`.LabwareDefinition` based
        on the current pipettes attached.
        """
        lw: typing.Dict[UUID, LabwareInfo] = {}
        _prev_lw_uuid: typing.Optional[UUID] = None

        for mount, pip_info in self._pip_info_by_mount.items():
            load_name: str = self._load_name_for_mount(mount)
            prev_lw = lw.get(_prev_lw_uuid, None) if _prev_lw_uuid else None
            if _prev_lw_uuid and prev_lw and prev_lw.loadName == load_name:
                #  pipette uses same tiprack as previous, use existing
                lw[_prev_lw_uuid].forMounts.append(mount)
                self._pip_info_by_mount[mount].tiprack_id = _prev_lw_uuid
            else:
                lw_def = labware.get_labware_definition(load_name)
                new_uuid: UUID = uuid4()
                _prev_lw_uuid = new_uuid
                slot = self._get_tip_rack_slot_for_mount(mount)
                lw[new_uuid] = LabwareInfo(
                    alternatives=self._alt_load_names_for_mount(mount),
                    forMounts=[mount],
                    loadName=load_name,
                    slot=slot,
                    namespace=lw_def['namespace'],
                    version=lw_def['version'],
                    id=new_uuid,
                    definition=lw_def)
                self._pip_info_by_mount[mount].tiprack_id = new_uuid
        return lw

    def _alt_load_names_for_mount(self, mount: Mount) -> typing.List[str]:
        pip_vol = self.pipettes[mount]['max_volume']
        return list(TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].alternatives)

    def _load_name_for_mount(self, mount: Mount) -> str:
        pip_vol = self.pipettes[mount]['max_volume']
        return TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].load_name

    def _build_deck_moves(self) -> Moves:
        return Moves(
                joggingFirstPipetteToHeight=self._build_height_dict('5'),
                joggingFirstPipetteToPointOne=self._build_cross_dict('1BLC'),
                joggingFirstPipetteToPointTwo=self._build_cross_dict('3BRC'),
                joggingFirstPipetteToPointThree=self._build_cross_dict('7TLC'),
                joggingSecondPipetteToHeight=self._build_height_dict('5'),
                joggingSecondPipetteToPointOne=self._build_cross_dict('1BLC'))

    def _build_cross_dict(self, pos_id: str) -> CheckMove:
        cross_coords = self._deck.get_calibration_position(pos_id).position
        return CheckMove(position=Point(*cross_coords), locationId=uuid4())

    def _build_height_dict(self, slot: str) -> CheckMove:
        pos = self._deck.get_slot_center(slot)
        ydim: float\
            = self._deck.get_slot_definition(slot)['boundingBox']['yDimension']
        # shift down to 10mm +y of the slot edge to both stay clear of the
        # slot boundary, avoid the engraved slot number, and avoid the
        # tiprack colliding if this is a multi
        updated_pos = pos - Point(0, (ydim/2)-10, pos.z) + HEIGHT_SAFETY_BUFFER
        return CheckMove(position=updated_pos, locationId=uuid4())

    def _get_tip_rack_slot_for_mount(self, mount) -> str:
        if len(self._pip_info_by_mount) == 2:
            shared_tiprack = self._load_name_for_mount(Mount.LEFT) == \
                    self._load_name_for_mount(Mount.RIGHT)
            if mount == Mount.LEFT and not shared_tiprack:
                return '6'
            else:
                return '8'
        else:
            return '8'

    async def _jog(self, mount: Mount, vector: Point):
        """
        General function that can be used by all session types to jog around
        a specified pipette.
        """
        await self.hardware.move_rel(mount, vector)

    async def _pick_up_tip(self, mount: Mount):
        pip_info = self._pip_info_by_mount[mount]
        instr = self._hardware._attached_instruments[mount]

        if pip_info.tiprack_id:
            lw_info = self.get_tiprack(pip_info.tiprack_id)
            # Note: ABC DeckItem cannot have tiplength b/c of
            # mod geometry contexts. Ignore type checking error here.
            tiprack = self._deck[lw_info.slot]
            full_length = tiprack.tip_length  # type: ignore
            overlap_dict: typing.Dict =\
                self.pipettes[mount]['tip_overlap']  # type: ignore
            default = overlap_dict['default']
            overlap = overlap_dict.get(
                                    tiprack.uri,  # type: ignore
                                    default)
            tip_length = full_length - overlap
        else:
            tip_length = self.pipettes[mount]['fallback_tip_length']

        with contextlib.ExitStack() as stack:
            if pip_info.critical_point:
                # If the pipette we're picking up tip for
                # has a critical point, we know it is a multichannel
                stack.enter_context(save_default_pick_up_current(instr))
            await self.hardware.pick_up_tip(mount, tip_length)

    async def _trash_tip(self, mount: Mount):
        trash_lw = self._deck.get_fixed_trash()
        assert trash_lw
        to_loc = trash_lw.wells()[0].top()
        await self._move(mount, to_loc, CriticalPoint.XY_CENTER)
        await self._drop_tip(mount)

    async def _drop_tip(self, mount: Mount):
        await self.hardware.drop_tip(mount)

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._get_pip_info_by_mount(
                self.hardware.get_attached_instruments())
        self._pip_info_by_mount.clear()
        self._pip_info_by_mount.update(new_dict)

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    def get_tiprack(self, uuid: UUID) -> LabwareInfo:
        return self._labware_info[uuid]

    @property
    def pipettes(self) -> typing.Dict[Mount, Pipette.DictType]:
        return self.hardware.attached_instruments

    @property
    def labware_status(self) -> typing.Dict[UUID, LabwareInfo]:
        """
        Public property to help format the current labware status of a given
        session for the client.
        """
        return self._labware_info

    async def _move(self,
                    mount: Mount,
                    to_loc: Location,
                    cp_override: CriticalPoint = None):
        from_pt = await self.hardware.gantry_position(mount)
        from_loc = Location(from_pt, None)
        cp = cp_override or self._pip_info_by_mount[mount].critical_point

        max_height = self.hardware.get_instrument_max_height(mount)
        safe = planning.safe_height(
            from_loc, to_loc, self._deck, max_height)
        moves = plan_arc(from_pt, to_loc.point, safe,
                         origin_cp=None,
                         dest_cp=cp)
        for move in moves:
            await self.hardware.move_to(
                mount, move[0], critical_point=move[1])
