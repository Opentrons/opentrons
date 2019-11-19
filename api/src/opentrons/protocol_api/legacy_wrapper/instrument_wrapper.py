from numbers import Number
import logging
from typing import Any, Dict, List, Optional, Sequence, TYPE_CHECKING, Union
from opentrons import commands as cmds
from opentrons.types import Point, Location
from opentrons.config import pipette_config
from opentrons.helpers import helpers

from .util import log_call
from ..util import Clearances, clamp_value

from .types import LegacyLocation

from .containers_wrapper import LegacyLabware, LegacyWell, WellSeries

if TYPE_CHECKING:
    from ..contexts import InstrumentContext # noqa(F401)
    from ..labware import Labware, Well  # noqa(F401)

log = logging.getLogger(__name__)

AdvancedLiquidHandling = Union[
    LegacyWell,
    LegacyLocation,
    List[Union[LegacyWell, LegacyLocation]],
    List[List[LegacyWell]]]

MotionTarget = Union[LegacyLocation, LegacyWell]


def _unpack_motion_target(
        motiontarget: MotionTarget, position: str = 'top') -> LegacyLocation:
    """ Make sure we have a full LegacyLocation """
    if isinstance(motiontarget, LegacyLocation):
        target_loc = motiontarget
    elif isinstance(motiontarget, (WellSeries, List)):
        target_loc = [_unpack_motion_target(well, position)
                      for well in motiontarget]
    elif isinstance(motiontarget, LegacyWell):
        if position == 'top':
            target_loc = motiontarget.top()
        else:
            target_loc = motiontarget.bottom()
    else:
        raise TypeError(
            'A Well or tuple(well, point) is needed')
    return target_loc


def _absolute_motion_target(
        motiontarget: MotionTarget,
        position: str = 'top') -> Location:
    """ Get absolute coords out of our old offset + labware ref system """
    target_loc = _unpack_motion_target(motiontarget, position)
    if isinstance(target_loc.labware, LegacyLabware):
        real_loc: Union['Labware', 'Well'] = target_loc.labware.lw_obj
    else:
        real_loc = target_loc.labware
    return Location(
        labware=real_loc,
        point=(target_loc.labware._from_center_cartesian(-1, -1, -1)
               + target_loc.offset))


class Pipette:
    """
    This class should not be used directly, and is only created by using
    an instrument constructor (like :py:meth:`P300_Single`).
    """

    def __init__(
            self,
            instrument_context: 'InstrumentContext',
            labware_mappings: Dict['Labware', LegacyLabware]):
        self._lw_mappings = labware_mappings
        self._instr_ctx = instrument_context
        self._ctx = self._instr_ctx._ctx
        self._mount = self._instr_ctx._mount
        self._hw_manager = self._instr_ctx._hw_manager
        self._hw_pipette\
            = self._hw_manager.hardware._attached_instruments[self._mount]

        self._log = self._instr_ctx._log
        self._default_speed = self._instr_ctx.default_speed
        self._max_plunger_speed: Optional[float] = None

        self._trash_container = LegacyLabware(self._instr_ctx.trash_container)
        self._tip_racks = self._instr_ctx.tip_racks\
            if self._instr_ctx.tip_racks else []

        self.reset_tip_tracking()

        self._instr_ctx._well_bottom_clearance = Clearances(
            default_aspirate=1.0, default_dispense=0.5)

        self._placeables: List[Union[LegacyLabware, LegacyWell]] = []
        self._pipette_config = pipette_config.load(self._instr_ctx.model)

    @property
    def requested_as(self) -> Optional[str]:
        return self._instr_ctx.requested_as

    @property
    def model(self) -> str:
        return self._instr_ctx.model

    @property
    def name(self) -> str:
        return self._instr_ctx.name

    @property
    def channels(self) -> int:
        return self._instr_ctx.channels

    @property
    def _config(self) -> pipette_config.pipette_config:
        return self._hw_pipette.config

    @property
    def _pipette_status(self):
        return self._hw_manager.hardware.attached_instruments[self._mount]

    @property
    def _working_volume(self) -> float:
        return self._pipette_status['working_volume']

    @property
    def current_volume(self) -> float:
        """ The amount of liquid currently held in the pipette (in uL) """
        return self._pipette_status['current_volume']

    @property
    def has_tip(self) -> bool:
        """
        Returns whether a pipette has a tip attached. Added in for backwards
        compatibility purposes in deck calibration CLI tool.
        """
        return self._pipette_status['has_tip']

    @property
    def mount(self) -> str:
        """ Which mount the pipette is attached to, 'left' or 'right' """
        return self._instr_ctx.mount

    @property
    def max_volume(self) -> float:
        """ The maximum amount of liquid that may be aspirated (in uL) """
        return self._pipette_status['max_volume']

    @property
    def min_volume(self) -> float:
        """ The minimum amount of liquid that may be aspirated (in uL) """
        return self._pipette_status['min_volume']

    @property
    def previous_placeable(self) -> Optional[Union[LegacyLabware, LegacyWell]]:
        if not self._ctx.location_cache:
            return None
        if isinstance(self._ctx.location_cache.labware, LegacyWell):
            return self._ctx.location_cache.labware
        return self._lw_mappings.get(
            self._ctx.location_cache.labware)  # type: ignore

    @property
    def placeables(self) -> List[Union[LegacyLabware, LegacyWell]]:
        return self._placeables

    @property
    def speeds(self) -> Dict[str, float]:
        """
        The speeds at which the plunger will move. A dict with the keys
        ``'aspirate'``, ``'blow_out'``, and ``'dispense'``.
        """
        return {'aspirate': self._instr_ctx._speeds.aspirate,
                'dispense': self._instr_ctx._speeds.dispense,
                'blow_out': self._instr_ctx._speeds.blow_out}

    @property
    def starting_tip(self):
        """ The first place the pipette will pick up a tip. """
        # this needs to return a LegacyWell
        return self._instr_ctx.starting_tip

    @property
    def tip_attached(self) -> bool:
        return self.has_tip

    @property
    def tip_racks(self) -> List[LegacyLabware]:
        """ A list of the tipracks associated with this pipette. """
        return self._tip_racks

    @property
    def trash_container(self) -> LegacyLabware:
        return self._trash_container

    @property
    def type(self) -> str:
        """ The type of the pipette (``'single'`` or ``'multi'``)"""
        return self._instr_ctx.type

    @log_call(log)
    def reset(self):
        """
        Resets the state of this pipette, removing associated placeables,
        setting current volume to zero, and resetting tip tracking
        """
        instr = self._hw_manager.hardware._attached_instruments[self._mount]
        instr.set_current_volume(0)
        instr.current_tiprack_diamater = 0.0
        instr._has_tip = False
        instr._current_tip_length = 0.0

        self._ctx.location_cache = None
        self.reset_tip_tracking()
        self._placeables = []

    @log_call(log)
    def has_tip_rack(self) -> bool:
        """
        Returns ``True`` of this :any:`Pipette` was instantiated with tipracks
        """
        return (self.tip_racks is not None
                and isinstance(self.tip_racks, list)
                and len(self.tip_racks) > 0)

    @log_call(log)
    def reset_tip_tracking(self):
        """
        Resets the :any:`Pipette` tip tracking, "refilling" the tip racks
        """
        self.current_tip(None)
        self._instr_ctx.reset_tipracks()

    @log_call(log)
    def current_tip(self, *args):
        """ The location from which the current tip was picked up. May be
        called to change that location, which will affect the place where
        the tip is returned using :py:meth:`.return_tip` and the next tip
        that will be picked up.
        """
        if len(args) and (isinstance(args[0], LegacyWell) or args[0] is None):
            self.current_tip_home_well = args[0]
        return self.current_tip_home_well

    @log_call(log)
    def start_at_tip(self, _tip: LegacyWell = None):
        """ Change the first tip that will be picked up """
        self._instr_ctx.starting_tip = _tip

    @log_call(log)
    def get_next_tip(self):
        """ Find the next tip to pick up"""
        tiprack, tip = self._instr_ctx._next_available_tip()
        tiprack.use_tips(tip, self.channels)
        return tip

    @log_call(log)
    def retract(self, safety_margin: float = 10) -> 'Pipette':
        '''
        Move the pipette's mount upwards and away from the deck

        :param float safety_margin: Distance in millimeters away
                                    from the limit switch
        :returns Pipette: This instance
        '''
        self._ctx.location_cache = None
        self._hw_manager.hardware.retract(self._mount)
        return self

    def move_to(self,
                location: MotionTarget,
                strategy: str = None):
        """
        Move this :any:`Pipette` to a location.

        :param location: A :class:`.LegacyLocation` (named tuple of a labware
                         or well and offset) or a Well. The destination to
                         move to
        :param str strategy: "arc" or "direct". "arc" strategies (default)
                             will pick the head up on Z axis, then over to the
                             XY destination, then finally down to the Z
                             destination. "direct" strategies will simply move
                             in a straight line from the current position
        :returns Pipette: This instance.
        """

        placeable = location\
            if isinstance(location, LegacyWell) else location.labware

        force_direct = False
        if strategy == 'direct' or (
                not strategy and self.previous_placeable == placeable):
            force_direct = True

        if not self.placeables or (placeable != self.placeables[-1]):
            self.placeables.append(placeable)

        absolute_location = _absolute_motion_target(location, 'top')
        return self._instr_ctx.move_to(location=absolute_location,
                                       force_direct=force_direct)

    def aspirate(self,
                 volume: float = None,
                 location: MotionTarget = None,
                 rate: float = 1.0) -> 'Pipette':
        """
        Aspirate a volume of liquid (in uL) using this pipette from the
        specified location


        If only a volume is passed, the pipette will aspirate
        from its current position. If only a location is passed,
        ``aspirate`` will default to the pipette's :py:attr:`.max_volume`.

        The location may be a Well, or a specific position in relation to a
        Well, such as `Well.top()`. If a Well is specified without calling a
        a position method (such as .top or .bottom), this method will default
        to 1.0 mm above the bottom of the well.

        :param float volume: The number of uL to aspirate (if not specified,
                             :py:attr:`.max_volume`)
        :param location: A :py:class:`.Location` or a :py:class`.Well` from
                         which to aspirate.
        :param float rate: Set plunger speed for this aspirate, where
                           ``speed = rate * aspirate_speed`` (see
                           :meth:`set_speed`)

        :returns Pipette: This instance.


        For example,

        .. code-block:: python

            from opentrons import instruments, labware, robot
            plate = labware.load('96-flat', '2')
            p300 = instruments.P300_Single(mount='right')
            p300.pick_up_tip()
            # aspirate 50uL from a Well
            p300.aspirate(50, plate[0])
            # aspirate 50uL from the center of a well
            p300.aspirate(50, plate[1].bottom())
            # aspirate 20uL in place, twice as fast
            p300.aspirate(20, rate=2.0)
            # aspirate the pipette's remaining volume (80uL) from a Well
            p300.aspirate(plate[2])

        """
        new_speed = self._clamp_to_max_plunger_speed(
            self.speeds['aspirate'] * rate, 'aspirate rate')
        rate = new_speed / self.speeds['aspirate']

        self._log.debug("aspirate {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))

        if not isinstance(volume, Number):
            if isinstance(volume, (LegacyWell, LegacyLocation)) \
               and not location:
                location = volume
            volume = self._working_volume - self.current_volume

        display_location = location if location else self.previous_placeable

        if volume != 0:
            self._position_for_aspirate(location)
            cmds.do_publish(
                self._instr_ctx.broker, cmds.aspirate, self.aspirate,
                'before', None, None, self, volume,
                display_location, rate)
            self._hw_manager.hardware.aspirate(self._mount, volume, rate)
            cmds.do_publish(
                self._instr_ctx.broker, cmds.aspirate, self.aspirate,
                'after', self, None,  self, volume,
                display_location, rate)

        return self

    def _position_for_aspirate(self, location: MotionTarget = None):
        placeable: Optional[Union[LegacyLabware, LegacyWell]] = None
        if location:
            if isinstance(location, (List, WellSeries)):
                location = self._flatten_well_list(location)
            if isinstance(location, (List)):
                location = location[0]
            placeable, _ = _unpack_motion_target(location, 'top')
            # go to top of source if not already there
            if placeable != self.previous_placeable:
                self.move_to(placeable.top())
        else:
            placeable = self.previous_placeable
        if self.current_volume == 0:
            if placeable:
                self.move_to(placeable.top())
            self._hw_manager.hardware.prepare_for_aspirate(self._mount)

        if location:
            if isinstance(location, LegacyWell):
                well, offset = location.bottom()
                location = LegacyLocation(
                    labware=well,
                    offset=offset + Point(
                        0, 0, self._instr_ctx.well_bottom_clearance.aspirate))
            self.move_to(location, strategy='direct')

    @log_call(log)
    def dispense(self,
                 volume: float = None,
                 location: MotionTarget = None,
                 rate: float = 1.0) -> 'Pipette':
        """
        Dispense a volume of liquid (in uL) using this pipette


        If only a volume is passed, the pipette will dispense
        from its current position. If only a location is passed,
        `dispense` will default to its :attr:`.current_volume`

        The location may be a Well, or a specific position in relation to a
        Well, such as `Well.top()`. If a Well is specified without calling a
        a position method (such as .top or .bottom), this method will default
        to the 0.5mm above the bottom of the well.

        :param float volume: The volume (in uL) to dispense (default:
                             :attr:`.current_volume`)
        :param location: :class:`.Location` or Well into which to perform the
                         dispense.
        :param float rate: Set plunger speed for this dispense, where
                           ``speed = rate * dispense_speed`` (see
                           :meth:`.set_speed`)
        :returns Pipette: This instance.


        For example,
        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            plate = labware.load('96-flat', '3')
            p300 = instruments.P300_Single(mount='left')
            # fill the pipette with liquid (200uL)
            p300.aspirate(plate[0])
            # dispense 50uL to a Well
            p300.dispense(50, plate[0])
            # dispense 50uL to the center of a well
            relative_vector = plate[1].center()
            p300.dispense(50, (plate[1], relative_vector))
            # dispense 20uL in place, at half the speed
            p300.dispense(20, rate=0.5)
            # dispense the pipette's remaining volume (80uL) to a Well
            p300.dispense(plate[2])

        """
        new_speed = self._clamp_to_max_plunger_speed(
            self.speeds['dispense'] * rate, 'dispense rate')
        rate = new_speed / self.speeds['dispense']

        if not isinstance(volume, Number):
            if isinstance(volume, (LegacyWell, LegacyLocation)) \
               and not location:
                location = volume
            volume = self.current_volume

        volume = min(self.current_volume, volume)

        display_location = location if location else self.previous_placeable

        # if not location and self.previous_placeable:
        #     if isinstance(self.previous_placeable, LegacyLabware):
        #         raise RuntimeError('Dispense must be into a well')
        #     display = self.previous_placeable

        cmds.do_publish(self._instr_ctx.broker, cmds.dispense, self.dispense,
                        'before', None, None, self, volume, display_location,
                        rate)

        if volume != 0:
            self._position_for_dispense(location)

            self._hw_manager.hardware.dispense(self._mount, volume, rate)

        cmds.do_publish(self._instr_ctx.broker, cmds.dispense, self.dispense,
                        'after', self, None, self, volume, display_location,
                        rate)
        return self

    def _position_for_dispense(self, location: MotionTarget = None):
        if location:
            if isinstance(location, (List, WellSeries)):
                location = self._flatten_well_list(location)
            if isinstance(location, (List)):
                location = location[0]
            if isinstance(location, LegacyWell):
                location = location.bottom(
                    min(location.depth,
                        self._instr_ctx.well_bottom_clearance.dispense))
            self.move_to(location)

    @log_call(log)
    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: MotionTarget = None,
            rate: float = 1.0) -> 'Pipette':
        """
        Mix a volume of liquid (in uL) using this pipette

        If no ``location`` is passed, the pipette will mix
        from its current position. If no ``volume`` is passed,
        ``mix`` will default to the pipette's :attr:`.max_volume`.

        :param int repetitions: How many times the pipette should mix
        :param float volume: The volume (in uL) of liquid to mix
                             (Default: :attr:`.max_volume`)
        :param location: :class:`.Location` or Well in which to
                         perform the mix.
        :param float rate: Set plunger speed for this mix, where
                           ``speed = rate * (aspirate_speed or
                            dispense_speed)`` (see :meth:`.set_speed`)
        :returns pipette: This instance

        For example,

        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            plate = labware.load('96-flat', '4')
            p300 = instruments.P300_Single(mount='left')
            # mix 50uL in a Well, three times
            p300.mix(3, 50, plate[0])
            # mix 3x with the pipette's max volume, from current position
            p300.mix(3)

        """
        if not self.has_tip:
            self._log.warning("Cannot mix without a tip attached.")

        if not isinstance(volume, Number):
            if isinstance(volume, (LegacyWell, LegacyLocation)) \
               and not location:
                location = volume
            volume = self._working_volume - self.current_volume

        if not location and self.previous_placeable:
            if isinstance(self.previous_placeable, LegacyLabware):
                raise RuntimeError('Dispense must be into a well')
            location = self.previous_placeable

        cmds.do_publish(self._instr_ctx.broker, cmds.mix, self.mix, 'before',
                        None, None, self, repetitions, volume, location, rate)

        self.aspirate(volume=volume, location=location, rate=rate)
        for i in range(repetitions - 1):
            self.dispense(volume, rate=rate)
            self.aspirate(volume, rate=rate)
        self.dispense(volume, rate=rate)

        cmds.do_publish(self._instr_ctx.broker, cmds.mix, self.mix, 'after',
                        self, None, self, repetitions, volume, location, rate)

        return self

    @log_call(log)
    def blow_out(self,
                 location: MotionTarget = None
                 ) -> 'Pipette':
        """
        Force any remaining liquid to dispense, by moving
        this pipette's plunger past its normal empty position.


        If no ``location`` is passed, the pipette will blow out
        from its current position.

        :param location: :class:`.Location` or Well into which to
                         to blow_out.
        :returns Pipette: This instance.

        For example,
        .. code-block:: python

            from opentrons import instruments, robot
            robot.reset()
            p300 = instruments.P300_Single(mount='left')
            p300.aspirate(50).dispense().blow_out()
        """
        if location:
            if isinstance(location, (List, WellSeries)):
                location = self._flatten_well_list(location)
            if isinstance(location, (List)):
                location = location[0]
            self.move_to(location)
        # In API v1, a pipette will blow out at any location as long as there
        # is a tip attached
        self._hw_manager.hardware.blow_out(self._mount)
        return self

    @log_call(log)
    def touch_tip(self,
                  location: LegacyWell = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> 'Pipette':
        """
        Touch the  tip to the sides of a well to remove left-over droplets

        If no ``location`` is passed, the pipette will touch tip
        from its current position.

        :param location: :class:`.Location` or Well in which to touch tip.
        :param float radius: A number describing the percentage of a well's
                             radius to move to when to touch the tip.
                             When ``radius=1.0``, touch tip will move to 100%
                             of the well's radius - in theory, with the center
                             of the tip on the wall of the well. When
                             ``radius=0.5``, touch tip will move to 50% of the
                             well's radius. Default: 1.0 (100%)
        :param float speed: The speed for the touch tip motion, in mm/s.
                            Default: 60.0 mm/s, Max: 80.0 mm/s, Min: 20.0 mm/s
        :param float v_offset: The offset in mm from the top of the well to
                               touch tip. Default: -1.0 mm
        :returns Pipette: This instance.

        For example,

        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            plate = labware.load('96-flat', '8')
            p300 = instruments.P300_Single(mount='left')
            p300.aspirate(50, plate[0])
            p300.dispense(plate[1]).touch_tip()
        """
        if not self.tip_attached:
            self._log.warning("Cannot touch tip without a tip attached.")
        if speed > 80.0:
            self._log.warning(
                "Touch tip speeds greater than 80mm/s not allowed")
            speed = 80.0
        if speed < 20.0:
            self._log.warning(
                "Touch tip speeds greater than 80mm/s not allowed")
            speed = 20.0

        if isinstance(location, Number):
            # Deprecated syntax
            self._log.warning("Please use the `v_offset` named parameter")
            v_offset = location
            location = None

        # if no location specified, use the previously
        # associated placeable to get Well dimensions
        if location is None and\
                isinstance(self.previous_placeable, LegacyWell):
            location = self.previous_placeable  # type: ignore

        if location is None:
            raise ValueError("No valid location to touch tip on.")

        cmds.do_publish(
            self._instr_ctx.broker, cmds.touch_tip, self.touch_tip, 'before',
            None, None, self, location, radius, v_offset, speed)

        # move to location if we're not already there
        if location != self.previous_placeable:
            self.move_to(location, strategy='arc')

        new_v_offset = Point(0.0, 0.0, v_offset)

        well_edges = [
            location.from_center(x=radius, y=0, z=1),       # right edge
            location.from_center(x=radius * -1, y=0, z=1),  # left edge
            location.from_center(x=0, y=radius, z=1),       # back edge
            location.from_center(x=0, y=radius * -1, z=1)   # front edge
        ]

        # Apply vertical offset to well edges
        v_well_edges = [
            LegacyLocation(ll.labware, ll.offset + new_v_offset)
            for ll in well_edges]
        self.set_speed(speed)
        [self.move_to(loc, strategy='direct')
         for loc in v_well_edges]

        cmds.do_publish(
            self._instr_ctx.broker, cmds.touch_tip, self.touch_tip, 'after',
            self, None, self, location, radius, v_offset, speed)

        return self

    @log_call(log)
    def air_gap(self,
                volume: float = None,
                height: float = None) -> 'Pipette':
        """
        Pull air into the pipette, usually under previously-aspirated
        liquid.

        If no ``location`` is passed, the pipette will aspirate air above
        its current position.

        :param float volume: The volume of air to aspirate, in uL.
                             (Default will use all remaining volume in tip)
        :param float height: The height, in mm, to move above the current well.
                             (Default will be 10mm above current Placeable)
        :returns Pipette: This instance

        For example,

        .. code-block:: python

            from opentrons import instruments, robot
            robot.reset()
            p300 = instruments.P300_Single(mount='left')
            p300.aspirate(50, plate[0])
            p300.air_gap(50)
        """

        if volume and volume != 0:
            z_height = 0 if not height else height
            # this is a bug in v1 intentionally reproduced here: if you haven't
            # previously moved to a placeable, airgap will give you an
            # attributeerror with "NoneType" object has no attribute "top".
            location = self.previous_placeable.top(z=z_height)  # type: ignore
            # "move_to" separate from aspirate command
            # so "_position_for_aspirate" isn't executed
            self.move_to(location)
            self.aspirate(volume)
        return self

    @log_call(log)
    def return_tip(self, home_after: bool = True) -> 'Pipette':
        """
        Drop the pipette's current tip to its originating tip rack

        This method requires one or more tip racks to be in this
        Pipette's :attr:`.tip_racks` list.

        :returns Pipette: This instance.

        For example,

        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            tiprack = labware.load('GEB-tiprack-300', '2')
            p300 = instruments.P300_Single(mount='left',
                                           tip_racks=[tiprack, tiprack2])
            p300.pick_up_tip()
            p300.aspirate(50, plate[0])
            p300.dispense(plate[1])
            p300.return_tip()  # returns to tip a1
        """
        if not self.tip_attached:
            self._log.warning("Cannot return tip without tip attached.")

        self.drop_tip(self.current_tip(), home_after=home_after)
        return self

    @log_call(log)
    def pick_up_tip(
            self, location: MotionTarget = None,
            presses: int = None, increment: float = None)\
            -> 'Pipette':
        """
        Pick up a tip for the Pipette to handle liquids with

        A tip can be manually specified by passing a ``location``.
        If no ``location`` is passed, the Pipette will pick up the next
        available tip from :attr:`.tip_racks`.

        :param location: :class:`.Location` or Well from which to pick up a
                         tip.
        :param int presses: The number of times to lower and then raise the
                            pipette when picking up a tip, to ensure a good
                            seal (0 will result in the pipette hovering over
                            the tip but not picking it up - generally not
                            desireable, but could be used for dry-run).
                            Default: Different per pipette, may be customized
        :param float increment: The additional distance to travel on each
                                successive press (e.g.: if ``presses=3`` and
                                ``increment=1``, then the first press will
                                travel down into the tip by 3.5mm, the second
                                by 4.5mm, and the third by 5.5mm)
                                Default: Different per pipette, may be
                                customized.
        :returns Pipette: This instance.

        For example,

        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            tiprack = labware.load('GEB-tiprack-300', '2')
            p300 = instruments.P300_Single(mount='left',
                                           tip_racks=[tiprack])
            p300.pick_up_tip(tiprack[0])
            p300.return_tip()
            # `pick_up_tip` will automatically go to tiprack[1]
            p300.pick_up_tip()
            p300.return_tip()
        """
        display_loc: Union[LegacyLocation, LegacyWell, Well]
        if location:
            display_loc = location
            if isinstance(location, (List, WellSeries)):
                location = self._flatten_well_list(location)
            if isinstance(location, (List)):
                location = location[0]
            new_loc = _unpack_motion_target(location, 'top')
        else:
            tiprack, new_tip = self._instr_ctx._next_available_tip()
            legacy_labware = self._lw_mappings[tiprack]
            tip = legacy_labware[new_tip._display_name.split(' of')[0]]
            new_loc = tip.top()
            display_loc = tip

        self.current_tip(display_loc)

        self._log.info(f"publishing {type(new_loc[0])}")
        cmds.do_publish(self._instr_ctx.broker, cmds.pick_up_tip,
                        self.pick_up_tip, 'before', None, None, self,
                        location=new_loc)
        self.move_to(new_loc)
        self._hw_manager.hardware.set_current_tiprack_diameter(
            self._mount, new_loc.labware.diameter)
        self._hw_manager.hardware.pick_up_tip(
            self._mount,
            self._pipette_config.tip_length,
            presses, increment)
        cmds.do_publish(self._instr_ctx.broker, cmds.pick_up_tip,
                        self.pick_up_tip, 'after', self, None, self,
                        location=new_loc)
        self._hw_manager.hardware.set_working_volume(
            self._mount, new_loc.labware.max_volume)
        self._instr_ctx._last_tip_picked_up_from = \
            self.current_tip()  # type: ignore

        return self

    def _tip_length_for(self, tiprack: Any) -> float:
        return self._pipette_config.tip_length

    def _flatten_well_list(self, well_list: Union[List, WellSeries]):
        if isinstance(well_list[0], (List, WellSeries)):
            return [self._flatten_well_list(i) for i in well_list]
        else:
            return well_list

    @log_call(log)
    def drop_tip(
            self, location: MotionTarget = None,
            home_after: bool = True) -> 'Pipette':
        """
        Drop the pipette's current tip

        If no location is passed, the pipette defaults to its
        :attr:`.trash_container`

        :param location: :class:`.Location` or Well in which to drop the
                         tip.
        :returns Pipette: This instance

        For example,

        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            tiprack = labware.load('tiprack-200ul', 'C2')
            trash = labware.load('point', 'A3')
            p300 = instruments.P300_Single(mount='left')
            p300.pick_up_tip(tiprack[0])
            # drops the tip in the fixed trash
            p300.drop_tip()
            p300.pick_up_tip(tiprack[1])
            # drops the tip back at its tip rack
            p300.drop_tip(tiprack[1])
        """
        if location:
            if isinstance(location, (List, WellSeries)):
                location = self._flatten_well_list(location)
            if isinstance(location, (List)):
                location = location[0]
            lw, coords = _unpack_motion_target(location, 'top')
            if 'rack' in str(lw.parent).lower():
                half_tip_length = self._pipette_config.tip_length * \
                    (self._pipette_config.return_tip_height or 0.5)
                new_loc = lw.top(-half_tip_length)
            elif 'trash' in str(lw.parent).lower():
                new_loc = (lw, coords +
                           (0, self._pipette_config.model_offset[1], 0))
            else:
                new_loc = lw.top()
            checked_location = _unpack_motion_target(new_loc)
        else:
            checked_location = _unpack_motion_target(
                self.trash_container.wells()[0].top())
        self.move_to(checked_location)
        self._log.info(f"publishing {type(checked_location[0])}")
        cmds.do_publish(
            self._ctx.broker, cmds.drop_tip, self.drop_tip,
            'before', None, None, self, location=checked_location.labware)
        self._hw_manager.hardware.drop_tip(self._mount, home_after=home_after)
        cmds.do_publish(
            self._ctx.broker, cmds.drop_tip, self.drop_tip,
            'after', self, None, self, location=checked_location.labware)
        self.current_tip(None)
        return self

    @log_call(log)
    def home(self) -> 'Pipette':
        """
        Home the pipette's plunger axis during a protocol run

        :returns Pipette: This instance
        """
        self._instr_ctx.home()
        return self

    def distribute(self,
                   volume: float,
                   source: LegacyWell,
                   dest: List[LegacyWell],
                   *args, **kwargs) -> 'Pipette':
        """
        Distribute will move a volume of liquid from a single source
        to a list of target locations. See :any:`Transfer` for details
        and a full list of optional arguments.

        :returns Pipette: This instance

        For example,

        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            plate = labware.load('96-flat', '3')
            p300 = instruments.P300_Single(mount='left')
            p300.distribute(50, plate[1], plate.cols[0])
        """
        args = (volume, source, dest, *args)
        kwargs['mode'] = 'distribute'
        kwargs['mix_after'] = (0, 0)
        if 'disposal_vol' not in kwargs:
            kwargs['disposal_vol'] = self.min_volume
        cmds.do_publish(self._ctx.broker, cmds.distribute, self.distribute,
                        'before', None, None,
                        self, volume, source, dest)
        self.transfer(*args, **kwargs)
        cmds.do_publish(self._ctx.broker, cmds.distribute, self.distribute,
                        'after', self, None,
                        self, volume, source, dest)
        return self

    def consolidate(self,
                    volume: float,
                    source: List[LegacyWell],
                    dest: LegacyWell,
                    *args, **kwargs) -> 'Pipette':
        """
        Consolidate will move a volume of liquid from a list of sources
        to a single target location. See :any:`Transfer` for details
        and a full list of optional arguments.

        :returns Pipette: This instance.

        For example,
        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            plate = labware.load('96-flat', 'A3')
            p300 = instruments.P300_Single(mount='left')
            p300.consolidate(50, plate.cols[0], plate[1])
        """
        kwargs['mode'] = 'consolidate'
        kwargs['mix_before'] = (0, 0)
        kwargs['air_gap'] = 0
        kwargs['disposal_vol'] = 0
        args = (volume, source, dest, *args)
        cmds.do_publish(self._ctx.broker, cmds.consolidate, self.consolidate,
                        'before', None, None,
                        self, volume, source, dest)
        self.transfer(*args, **kwargs)
        cmds.do_publish(self._ctx.broker, cmds.consolidate, self.consolidate,
                        'after', self, None,
                        self, volume, source, dest)
        return self

    def transfer(self,
                 volume: Union[float, Sequence[float]],
                 source: AdvancedLiquidHandling,
                 dest: AdvancedLiquidHandling,
                 **kwargs) -> 'Pipette':
        """
        Transfer will move a volume of liquid from a source location(s)
        to a dest location(s). It is a higher-level command, incorporating
        other actions like :meth:`.aspirate` and :meth:`.dispense`

        :param volume: The amount of volume to remove from each
                       ``sources``  and add to each ``dest``. If a list, the
                       list should be the same length as the longer of
                       ``source`` and ``dest``; the elements of the list will
                       be used for the equivalent source and target.
                       If a tuple with two elements, like ``volume=(20, 100)``,
                       then a list of volumes will be generated with
                       a linear gradient between the two volumes in the tuple.
                       If just a single value, the same volume will be
                       transferred between each source and dest.
        :type volume: float or List[float] or Tuple[float, float]
        :param source: A well or list of wells from which liquid should be
                       transferred.
        :param dest: A well or list of wells into which liquid should be
                     transferred.
        :param str new_tip: The strategy for automatically picking up tips
                            during the transfer; one of ``'once'``,
                            ``'never'``, or ``'always'``. If ``'never'``,
                           no tips will be picked up or dropped (so you must
                           call :meth:`.pick_up_tip` before calling
                           ``transfer``, and :meth:`.drop_tip` after). If
                           ``'once'``, a single tip will be used for all
                           actions. If ``'always'``, a new tip will be used
                           for each transfer. Default is 'once'.
        :param bool trash: If ``True`` (default behavior) and trash container
                           has been attached to this `Pipette`, then used tips
                           will be dropped into the trash. If ``False``,
                           used tips will be returned to their associated
                           tiprack.
        :param bool touch_tip: If ``True``, a :meth:`touch_tip` will occur
                               following each :meth:`aspirate` and
                               :meth:`dispense`. If set to ``False`` (default),
                               no :meth:``touch_tip`` will occur.
        :param bool blow_out: If ``True``, a :meth:`blow_out` will occur
                              following each :meth:`dispense` if the dispense
                              leaves the pipette empty. If set to ``False``
                              (default), no :meth:`blow_out` will occur.
        :param mix_before: Specify how to mix before each :meth:`.aspirate` in
                           the transfer. This should be a tuple of
                           ``(repetitions, volume)``.
        :type mix_before: Tuple[int, float]
        :param mix_after: Specify how to mix after each :meth:`.dispense` in
                           the transfer. This should be a tuple of
                           ``(repetitions, volume)``.
        :type mix_after: Tuple[int, float]
        :param bool carryover: If ``True`` (default), any individual transfers
                               that exceed :attr:`.max_volume` will be split
                               into multiple smaller volumes.
        :param bool repeat: (Only applicable to :meth:`distribute` and
                            :meth:`consolidate`) If ``True`` (default),
                            sequential :meth:`aspirate` volumes will be
                            combined into one tip for the purpose of saving
                            time. If `False`, all volumes will be transferred
                            separately.
        :param gradient: A function to calculated the curve used for
                         gradient volumes. When `volumes` is a tuple of length
                         2, its values are used to create a list of gradient
                         volumes. The default curve for this gradient is
                         linear (lambda x: x), however a method can be passed
                         with the `gradient` keyword argument to create a
                         non-linear gradient.
        :type gradient: Callable[[float], float]

        :returns Pipette: This instance.

        For example,
        .. code-block:: python

            from opentrons import instruments, labware, robot
            robot.reset()
            plate = labware.load('96-flat', '5')
            p300 = instruments.P300_Single(mount='right')
            p300.transfer(50, plate[0], plate[1])
        """
        kwargs['mode'] = kwargs.get('mode', 'transfer')

        touch_tip = kwargs.get('touch_tip', False)
        if touch_tip is True:
            touch_tip = -1
        kwargs['touch_tip'] = touch_tip

        tip_options = {
            'once': 1,
            'never': 0,
            'always': float('inf')
        }
        tip_option = kwargs.get('new_tip', 'once')
        tips = tip_options.get(tip_option)
        if tips is None:
            raise ValueError('Unknown "new_tip" option: {}'.format(tip_option))

        cmds.do_publish(self._ctx.broker, cmds.transfer, self.transfer,
                        'before', None, None,
                        self, volume, source, dest)
        plan = self._create_transfer_plan(volume, source, dest, **kwargs)
        self._run_transfer_plan(tips, plan, **kwargs)
        cmds.do_publish(self._ctx.broker, cmds.transfer, self.transfer,
                        'after', self, None,
                        self, volume, source, dest)
        return self

    def _multichannel_transfer(self, s, d):
        # Helper function for multi-channel use-case
        # There is also a separate use-case for troughs in which the WellSeries
        # is only 1 Dimensional but could be formatted as
        # <WellSeries: <A1>,<A2>
        # or as <WellSeries: <WellSeries <A1>, <A2> ...
        if isinstance(s, WellSeries) and not isinstance(s[0], WellSeries):
            if 'trough' in repr(s[0]):
                s = s.get_children_list()
            else:
                s = [s]
        if isinstance(s, WellSeries)\
                and isinstance(s[0], WellSeries) and 'trough' in repr(s[0][0]):
            s = [well for series in s for well in series]
        if isinstance(d, WellSeries) and not isinstance(d[0], WellSeries):
            if 'trough' in repr(d[0]):
                d = d.get_children_list()
            else:
                d = [d]
        if isinstance(d, WellSeries)\
                and isinstance(d[0], WellSeries) and 'trough' in repr(d[0][0]):
            d = [well for series in d for well in series]

        return s, d

    def _create_transfer_plan(self, v, s, t, **kwargs):
        # SPECIAL CASE: if using multi-channel pipette,
        # and the source or target is a WellSeries
        # then avoid iterating through it's Wells.
        # Else, single channel pipettes will flatten a multi-dimensional
        # WellSeries into a 1 dimensional list of wells
        if self.channels > 1:
            s, t = self._multichannel_transfer(s, t)
        else:
            if isinstance(s, WellSeries) and isinstance(s[0], WellSeries):
                s = [well for series in s for well in series]
            if isinstance(t, WellSeries) and isinstance(t[0], WellSeries):
                t = [well for series in t for well in series]

        # create list of volumes, sources, and targets of equal length
        s, t = helpers._create_source_target_lists(s, t, **kwargs)
        total_transfers = len(t)
        v = helpers._create_volume_list(v, total_transfers, **kwargs)

        transfer_plan = []
        for i in range(total_transfers):
            transfer_plan.append({
                'aspirate': {'location': s[i], 'volume': v[i]},
                'dispense': {'location': t[i], 'volume': v[i]}
            })

        if not self.tip_attached and self.tip_racks and \
           self._lw_mappings[self.tip_racks[0]]['A1'].max_volume:
            max_vol = min(
                self._lw_mappings[self.tip_racks[0]]['A1'].max_volume,
                self._working_volume)
        else:
            max_vol = self._working_volume
        max_vol -= kwargs.get('air_gap', 0)  # air

        if kwargs.get('divide', True):
            transfer_plan = helpers._expand_for_carryover(
                max_vol, transfer_plan, **kwargs)

        transfer_plan = helpers._compress_for_repeater(
            max_vol, transfer_plan, **kwargs)

        return transfer_plan

    def _run_transfer_plan(self, tips, plan, **kwargs):
        air_gap = kwargs.get('air_gap', 0)
        touch_tip = kwargs.get('touch_tip', False)

        total_transfers = len(plan)
        for i, step in enumerate(plan):

            aspirate = step.get('aspirate')
            dispense = step.get('dispense')

            if aspirate:
                self._add_tip_during_transfer(tips, **kwargs)
                self._aspirate_during_transfer(
                    aspirate['volume'], aspirate['location'], **kwargs)

            if dispense:
                self._dispense_during_transfer(
                    dispense['volume'], dispense['location'], **kwargs)
                if step is plan[-1] or plan[i + 1].get('aspirate'):
                    if touch_tip or touch_tip is 0:  # noqa(pyflakes)
                        self.touch_tip(touch_tip)
                    self._blowout_during_transfer(
                        dispense['location'], **kwargs)
                    tips = self._drop_tip_during_transfer(
                        tips, i, total_transfers, **kwargs)
                else:
                    if air_gap:
                        self.air_gap(air_gap)
                    if touch_tip or touch_tip is 0:  # noqa(pyflakes)
                        self.touch_tip(touch_tip)

    def _add_tip_during_transfer(self, tips, **kwargs):
        """
        Performs a :any:`pick_up_tip` when running a :any:`transfer`,
        :any:`distribute`, or :any:`consolidate`.
        """
        if self.has_tip_rack() and tips > 0 and not self.current_tip():
            self.pick_up_tip()

    def _aspirate_during_transfer(self, vol, loc, **kwargs):
        """
        Performs an :any:`aspirate` when running a :any:`transfer`, and
        optionally a :any:`touch_tip` afterwards.
        """
        rate = kwargs.get('rate', 1)
        mix_before = kwargs.get('mix', kwargs.get('mix_before', (0, 0)))
        air_gap = kwargs.get('air_gap', 0)
        touch_tip = kwargs.get('touch_tip', False)

        well, _ = _unpack_motion_target(loc)

        if self.current_volume == 0:
            self._mix_during_transfer(mix_before, well, **kwargs)
        self.aspirate(vol, loc, rate=rate)
        if air_gap:
            self.air_gap(air_gap)
        if touch_tip or touch_tip is 0:  # noqa(pyflakes)
            self.touch_tip(touch_tip)

    def _dispense_during_transfer(self, vol, loc, **kwargs):
        """
        Performs a :any:`dispense` when running a :any:`transfer`, and
        optionally a :any:`mix`, :any:`touch_tip`, and/or
        :any:`blow_out` afterwards.
        """
        mix_after = kwargs.get('mix_after', (0, 0))
        rate = kwargs.get('rate', 1)
        air_gap = kwargs.get('air_gap', 0)

        well, _ = _unpack_motion_target(loc)

        if air_gap:
            self.dispense(air_gap, well.top(5), rate=rate)
        self.dispense(vol, loc, rate=rate)
        self._mix_during_transfer(mix_after, well, **kwargs)

    def _mix_during_transfer(self, mix, loc, **kwargs):
        if self.current_volume == 0 and isinstance(mix, (tuple, list)):
            if len(mix) == 2 and 0 not in mix:
                self.mix(mix[0], mix[1], loc)

    def _blowout_during_transfer(self, loc, **kwargs):
        blow_out = kwargs.get('blow_out', False)
        if self.current_volume > 0 or blow_out:
            if not isinstance(blow_out, LegacyWell):
                blow_out = self.trash_container
                if self.current_volume == 0:
                    blow_out = None
            self.blow_out(blow_out)

    def _drop_tip_during_transfer(self, tips, i, total, **kwargs):
        """
        Performs a :any:`drop_tip` or :any:`return_tip` when
        running a :any:`transfer`, :any:`distribute`, or :any:`consolidate`.
        """
        trash = kwargs.get('trash', True)
        if tips > 1 or (i + 1 == total and tips > 0):
            if trash and self.trash_container:
                self.drop_tip()
            else:
                self.return_tip()
            tips -= 1
        return tips

    @log_call(log)
    def delay(self,
              seconds: float = 0,
              minutes: float = 0) -> 'Pipette':
        """
        :param float seconds: The number of seconds to pause
        :param float minutes; The number of minutes to pause

        :returns Pipette: This instance
        """
        self._ctx.delay(seconds=seconds, minutes=minutes)
        return self

    @log_call(log)
    def set_speed(self,
                  aspirate: float = None,
                  dispense: float = None,
                  blow_out: float = None) -> 'Pipette':
        """
        Set the speed (mm/second) the :any:`Pipette` plunger will move
        during :meth:`aspirate`, :meth:`dispense`, and :meth:`blow_out`

        :param float aspirate: The speed, in mm/s, at which the plunger will
                               move while performing an aspirate
        :param float dispense: The speed, in mm/s, at which the plunger will
                               move while performing an dispense
        :returns Pipette: This instance
        """
        if aspirate:
            self._instr_ctx._speeds.aspirate = \
                self._clamp_to_max_plunger_speed(
                    aspirate, 'set aspirate speed')
        if dispense:
            self._instr_ctx._speeds.dispense = \
                self._clamp_to_max_plunger_speed(
                    dispense, 'set dispense speed')
        if blow_out:
            self._instr_ctx._speeds.blow_out = \
                self._clamp_to_max_plunger_speed(
                    blow_out, 'set blow_out speed')
        return self

    def _clamp_to_max_plunger_speed(self,
                                    speed: float,
                                    log_tag: str = '') -> float:
        maxval = self._max_plunger_speed or float('inf')
        return clamp_value(speed, maxval, 0, log_tag)

    @log_call(log)
    def set_flow_rate(self,
                      aspirate: float = None,
                      dispense: float = None,
                      blow_out: float = None) -> 'Pipette':
        """
        Set the volumetric flow rate (uL/second) at which the plunger will
        :meth:`aspirate`, :meth:`dispense`, and :meth:`blow_out`.

        The speed is set using nominal max volumes for any given pipette model.

        :param float aspirate: The flow rate, in uL/s, at which the
                               pipette will aspirate
        :param float dispense: The flow rate, in uL/s, at which the pipette
                               will dispense
        :param float blow_out: The flow rate, in uL/s, at which the plunger
                               will blow out.
        """
        if aspirate:
            set_speed = self._determine_speed(aspirate, 'aspirate')
            self.set_speed(aspirate=set_speed)
        if dispense:
            set_speed = self._determine_speed(dispense, 'dispense')
            self.set_speed(dispense=set_speed)
        if blow_out:
            set_speed = self._determine_speed(blow_out, 'blow_out')
            self.set_speed(blow_out=set_speed)
        return self

    def _determine_speed(self, flow_rate: float, function: str) -> float:
        ul = self.max_volume
        ul_per_mm = self._hw_pipette.ul_per_mm(ul, function)
        max_plunger_flow_rate = self._max_plunger_speed * ul_per_mm

        valid_flow_rate = clamp_value(
            flow_rate, max_plunger_flow_rate, 0, f'set {function} flow rate')
        return round(valid_flow_rate / ul_per_mm, 6)

    @log_call(log)
    def set_pick_up_current(self, amperes: float) -> 'Pipette':
        """
        Set the current (amperes) the pipette mount's motor will use while
        picking up a tip.

        This can be useful to attach tips more firmly or less firmly than
        default

        :param float amperes: The peak winding current of the z motor
                              while creating a seal with tips.
        """
        if amperes >= 0 and amperes <= 2.0:
            self._hw_pipette.update_config_item('pick_up_current', amperes)
        else:
            raise ValueError(
                'Amperes must be a floating point between 0.0 and 2.0')
        return self

    def _set_plunger_max_speed_override(self, speed: float):
        self._max_plunger_speed = speed
