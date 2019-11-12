# pylama:ignore=E731
from numbers import Number
import logging
from typing import List, Optional, Sequence, TYPE_CHECKING, Union

from opentrons import commands as cmds, hardware_control as hc
from ..labware import Well
from opentrons.types import Location, Point

from .util import log_call
from ..util import Clearances

if TYPE_CHECKING:
    from ..contexts import InstrumentContext

log = logging.getLogger(__name__)

AdvancedLiquidHandling = Union[
    Well,
    Location,
    List[Union[Well, Location]],
    List[List[Well]]]


class Pipette():
    """
    This class should not be used directly.

    All model-specific instrument constructors are inheritors of this class.
    With any of those instances you can can:
        * Handle liquids with :meth:`aspirate`, :meth:`dispense`,
          :meth:`mix`, and :meth:`blow_out`
        * Handle tips with :meth:`pick_up_tip`, :meth:`drop_tip`,
          and :meth:`return_tip`
        * Calibrate this pipette's plunger positions
        * Calibrate the position of each :any:`Container` on deck

    Here are the typical steps of using the Pipette:
        * Instantiate a pipette with a maximum volume (uL)
        and a mount (`left` or `right`)
        * Design your protocol through the pipette's liquid-handling commands

    Methods in this class include assertions where needed to ensure that any
    action that requires a tip must be preceeded by `pick_up_tip`. For example:
    `mix`, `transfer`, `aspirate`, `blow_out`, and `drop_tip`.
    """

    def __init__(  # noqa(C901)
            self,
            instrument_context: 'InstrumentContext'):
        self._instr_ctx = instrument_context
        self._ctx = self._instr_ctx._ctx
        self._mount = self._instr_ctx._mount
        self._hw = self._instr_ctx._hw_manager.hardware
        self._hw_pipette = self._hw._attached_instruments[self._mount]

        self._log = self._instr_ctx._log
        self._default_speed = self._instr_ctx.default_speed
        self._max_plunger_speed: Optional[float] = None

        self._trash_container = self._instr_ctx.trash_container
        self._tip_racks = self._instr_ctx.tip_racks\
            if self._instr_ctx.tip_racks else None

        self.reset_tip_tracking()

        self._instr_ctx._well_bottom_clearance = Clearances(
            default_aspirate=1.0, default_dispense=0.5)

        self._placeables = []

    @property
    def _config(self):
        return self._hw_pipette.config

    @property
    def _pipette_status(self):
        return self._hw.attached_instruments[self._mount]

    @property
    def _working_volume(self):
        return self._pipette_status['working_volume']

    @property
    def current_volume(self):
        return self._pipette_status['current_volume']

    @property
    def has_tip(self):
        """
        Returns whether a pipette has a tip attached. Added in for backwards
        compatibility purposes in deck calibration CLI tool.
        """
        return self._pipette_status['has_tip']

    @property
    def mount(self):
        return self._instr_ctx.mount

    @property
    def max_volume(self):
        return self._pipette_status['max_volume']

    @property
    def min_volume(self):
        return self._pipette_status['min_volume']

    @property
    def previous_placeable(self):
        return self._ctx.location_cache.labware

    @property
    def placeables(self):
        return self._placeables

    @property
    def speeds(self):
        return {'aspirate': self._instr_ctx._speeds.aspirate,
                'dispense': self._instr_ctx._speeds.dispense,
                'blow_out': self._instr_ctx._speeds.blow_out}

    @property
    def starting_tip(self):
        return self._instr_ctx.starting_tip

    @property
    def tip_racks(self):
        return self._tip_racks

    @property
    def trash_container(self):
        return self._trash_container

    @property
    def type(self):
        log.info('instrument.type')
        return self._instr_ctx.type

    @log_call(log)
    def reset(self):
        """
        Resets the state of this pipette, removing associated placeables,
        setting current volume to zero, and resetting tip tracking
        """
        instr = self._hw._attached_instruments[self._mount]
        instr.set_current_volume(0)
        instr.current_tiprack_diamater = 0.0
        instr._has_tip = False
        instr._current_tip_length = 0.0

        self._ctx.location_cache = None
        self.reset_tip_tracking()
        self._placeables = []

    @log_call(log)
    def has_tip_rack(self):
        """
        Returns True of this :any:`Pipette` was instantiated with tip_racks
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
        # TODO(ahmed): revisit
        if len(args) and (isinstance(args[0], Well) or args[0] is None):
            self.current_tip_home_well = args[0]
        return self.current_tip_home_well

    @log_call(log)
    def start_at_tip(self, _tip: Well = None):
        self._instr_ctx.starting_tip = _tip

    @log_call(log)
    def get_next_tip(self):
        # Use a tip here
        _, tip = self._instr_ctx._next_available_tip()
        return tip

    @log_call(log)
    def retract(self, safety_margin: float = 10) -> 'InstrumentContext':
        '''
        Move the pipette's mount upwards and away from the deck

        Parameters
        ----------
        safety_margin: int
            Distance in millimeters awey from the limit switch,
            used during the mount's `fast_home()` method
        '''
        self._ctx.location_cache = None
        self._hw.retract(self._mount)
        return self._instr_ctx

    @log_call(log)
    def move_to(self,
                location: Union[Location, Well],
                strategy: str = None):
        """
        Move this :any:`Pipette` to a :any:`Placeable` on the :any:`Deck`

        Notes
        -----
        Until obstacle-avoidance algorithms are in place,
        :any:`Robot` and :any:`Pipette` :meth:`move_to` use either an
        "arc" or "direct"

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The destination to arrive at

        strategy : "arc" or "direct"
            "arc" strategies (default) will pick the head up on Z axis, then
            over to the XY destination, then finally down to the Z destination.
            "direct" strategies will simply move in a straight line from
            the current position

        Returns
        -------

        This instance of :class:`Pipette`.
        """

        placeable = location\
            if isinstance(location, Well) else location.labware

        force_direct = False
        if strategy == 'direct' or (
                not strategy and self.previous_placeable == placeable):
            force_direct = True

        if not self.placeables or (placeable != self.placeables[-1]):
            self.placeables.append(placeable)

        if isinstance(location, Well):
            location = location.top()

        return self._instr_ctx.move_to(location=location,
                                       force_direct=force_direct)

    # @log_call(log)
    def aspirate(self,
                 volume: float = None,
                 location: Union[Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContext':
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette
        from the specified location

        Notes
        -----
        If only a volume is passed, the pipette will aspirate
        from it's current position. If only a location is passed,
        `aspirate` will default to it's `max_volume`.

        The location may be a Well, or a specific position in relation to a
        Well, such as `Well.top()`. If a Well is specified without calling a
        a position method (such as .top or .bottom), this method will default
        to the bottom of the well.

        Parameters
        ----------
        volume : int or float
            The number of microliters to aspirate (Default: self.max_volume)

        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the aspirate.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        rate : float
            Set plunger speed for this aspirate, where
            speed = rate * aspirate_speed (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '2') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='right') # doctest: +SKIP
        >>> p300.pick_up_tip() # doctest: +SKIP
        # aspirate 50uL from a Well
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        # aspirate 50uL from the center of a well
        >>> p300.aspirate(50, plate[1].bottom()) # doctest: +SKIP
        >>> # aspirate 20uL in place, twice as fast
        >>> p300.aspirate(20, rate=2.0) # doctest: +SKIP
        >>> # aspirate the pipette's remaining volume (80uL) from a Well
        >>> p300.aspirate(plate[2]) # doctest: +SKIP
        """
        # TODO: When implementing this, cap rate to self._max_plunger_speed

        self._log.debug("aspirate {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))

        if not isinstance(volume, Number):
            if (isinstance(volume, Well) or isinstance(volume, Location)) \
                    and not location:
                location = volume
            volume = self._working_volume - self.current_volume

        if not location and self.previous_placeable:
            location = self.previous_placeable

        if volume != 0:
            print('doing something')
            self._position_for_aspirate(location)

            cmds.do_publish(
                self._instr_ctx.broker, cmds.aspirate, self.aspirate,
                'before', None, None, self._instr_ctx, volume, location, rate)
            self._hw.aspirate(self._mount, volume, rate)
            cmds.do_publish(
                self._instr_ctx.broker, cmds.aspirate, self.aspirate,
                'after', self, None,  self._instr_ctx, volume, location, rate)
        return self._instr_ctx

    def _position_for_aspirate(self, location: Union[Location, Well]):
        placeable = location if isinstance(location, Well)\
            else location.labware
        # go to top of source if not already there
        if placeable != self.previous_placeable:
            print('Move to well top bc not already there')
            self.move_to(placeable.top())

        if self.current_volume == 0:
            self._hw.prepare_for_aspirate(self._mount)
            print('Now actually move to location for aspirate')
        if location:
            if isinstance(location, Well):
                point, well = location.bottom()
                location = Location(
                    point + Point(
                        0, 0, self._instr_ctx.well_bottom_clearance.aspirate),
                    well)
            self.move_to(location)

    @log_call(log)
    def dispense(self,
                 volume: float = None,
                 location: Union[Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContext':
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If only a volume is passed, the pipette will dispense
        from it's current position. If only a location is passed,
        `dispense` will default to it's `current_volume`

        The location may be a Well, or a specific position in relation to a
        Well, such as `Well.top()`. If a Well is specified without calling a
        a position method (such as .top or .bottom), this method will default
        to the bottom of the well.

        Parameters
        ----------
        volume : int or float
            The number of microliters to dispense
            (Default: self.current_volume)
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the dispense.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`
        rate : float
            Set plunger speed for this dispense, where
            speed = rate * dispense_speed (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        # fill the pipette with liquid (200uL)
        >>> p300.aspirate(plate[0]) # doctest: +SKIP
        # dispense 50uL to a Well
        >>> p300.dispense(50, plate[0]) # doctest: +SKIP
        # dispense 50uL to the center of a well
        >>> relative_vector = plate[1].center() # doctest: +SKIP
        >>> p300.dispense(50, (plate[1], relative_vector)) # doctest: +SKIP
        # dispense 20uL in place, at half the speed
        >>> p300.dispense(20, rate=0.5) # doctest: +SKIP
        # dispense the pipette's remaining volume (80uL) to a Well
        >>> p300.dispense(plate[2]) # doctest: +SKIP
        """
        # TODO: When implementing this, cap rate to self._max_plunger_speed
        if not isinstance(volume, Number):
            if (isinstance(volume, Well) or isinstance(volume, Location)) \
                    and not location:
                location = volume
            volume = self.current_volume

        volume = min(self.current_volume, volume)

        if not location and self.previous_placeable:
            location = self.previous_placeable

        if volume != 0:
            return self._instr_ctx.dispense(
                volume=volume, location=location, rate=rate)
        return self._instr_ctx

    @log_call(log)
    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Union[Location, Well] = None,
            rate: float = 1.0) -> 'InstrumentContext':
        """
        Mix a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If no `location` is passed, the pipette will mix
        from it's current position. If no `volume` is passed,
        `mix` will default to it's `max_volume`

        Parameters
        ----------
        repetitions: int
            How many times the pipette should mix (Default: 1)

        volume : int or float
            The number of microliters to mix (Default: self.max_volume)

        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the mix.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        rate : float
            Set plunger speed for this mix, where
            speed = rate * (aspirate_speed or dispense_speed)
            (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '4') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        # mix 50uL in a Well, three times
        >>> p300.mix(3, 50, plate[0]) # doctest: +SKIP
        # mix 3x with the pipette's max volume, from current position
        >>> p300.mix(3) # doctest: +SKIP
        """
        if not self.has_tip:
            raise hc.NoTipAttachedError('Pipette has no tip. Aborting mix()')

        if not isinstance(volume, Number):
            if (isinstance(volume, Well) or isinstance(volume, Location)) \
                    and not location:
                location = volume
            volume = self._working_volume - self.current_volume

        if not location and self.previous_placeable:
            location = self.previous_placeable

        self.aspirate(volume, location, rate)
        while repetitions - 1 > 0:
            self.dispense(volume, rate=rate)
            self.aspirate(volume, rate=rate)
            repetitions -= 1
        self.dispense(volume, rate=rate)

        return self._instr_ctx

    @log_call(log)
    @cmds.publish.both(command=cmds.blow_out)
    def blow_out(self,
                 location: Union[Location, Well] = None
                 ) -> 'InstrumentContext':
        """
        Force any remaining liquid to dispense, by moving
        this pipette's plunger to the calibrated `blow_out` position

        Notes
        -----
        If no `location` is passed, the pipette will blow_out
        from it's current position.

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the blow_out.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.aspirate(50).dispense().blow_out() # doctest: +SKIP
        """
        # TODO: When implementing this, cap rate to self._max_plunger_speed
        return self._instr_ctx.blow_out(location=location)

    @log_call(log)
    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> 'InstrumentContext':
        """
        Touch the :any:`Pipette` tip to the sides of a well,
        with the intent of removing left-over droplets

        Notes
        -----
        If no `location` is passed, the pipette will touch_tip
        from it's current position.

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the touch_tip.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        radius : float
            Radius is a floating point describing the percentage of a well's
            radius. When radius=1.0, :any:`touch_tip()` will move to 100% of
            the wells radius. When radius=0.5, :any:`touch_tip()` will move to
            50% of the wells radius.
            Default: 1.0 (100%)

        speed: float
            The speed for touch tip motion, in mm/s.
            Default: 60.0 mm/s, Max: 80.0 mm/s, Min: 20.0 mm/s

        v_offset: float
            The offset in mm from the top of the well to touch tip.
            Default: -1.0 mm

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '8') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        >>> p300.dispense(plate[1]).touch_tip() # doctest: +SKIP
        """
        return self._instr_ctx.touch_tip(
                location=location, radius=radius, v_offset=v_offset,
                speed=speed)

    @log_call(log)
    def air_gap(self,
                volume: float = None,
                height: float = None) -> 'InstrumentContext':
        """
        Pull air into the :any:`Pipette` current tip

        Notes
        -----
        If no `location` is passed, the pipette will touch_tip
        from it's current position.

        Parameters
        ----------
        volume : number
            The amount in uL to aspirate air into the tube.
            (Default will use all remaining volume in tip)

        height : number
            The number of millimiters to move above the current Placeable
            to perform and air-gap aspirate
            (Default will be 10mm above current Placeable)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        >>> p300.air_gap(50) # doctest: +SKIP
        """
        return self._instr_ctx.air_gap(volume=volume, height=height)

    @log_call(log)
    @cmds.publish.both(command=cmds.return_tip)
    def return_tip(self, home_after: bool = True) -> 'InstrumentContext':
        """
        Drop the pipette's current tip to it's originating tip rack

        Notes
        -----
        This method requires one or more tip-rack :any:`Container`
        to be in this Pipette's `tip_racks` list (see :any:`Pipette`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> tiprack = labware.load('GEB-tiprack-300', '2') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left',
        ...     tip_racks=[tiprack, tiprack2]) # doctest: +SKIP
        >>> p300.pick_up_tip() # doctest: +SKIP
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        >>> p300.dispense(plate[1]) # doctest: +SKIP
        >>> p300.return_tip() # doctest: +SKIP
        """
        return self._instr_ctx

    @log_call(log)
    def pick_up_tip(
            self, location: Union[Location, Well] = None,
            presses: int = None, increment: float = 1.0)\
            -> 'InstrumentContext':
        """
        Pick up a tip for the Pipette to run liquid-handling cmds with

        Notes
        -----
        A tip can be manually set by passing a `location`. If no location
        is passed, the Pipette will pick up the next available tip in
        it's `tip_racks` list (see :any:`Pipette`)

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the pick_up_tip.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`
        presses : :any:int
            The number of times to lower and then raise the pipette when
            picking up a tip, to ensure a good seal (0 [zero] will result in
            the pipette hovering over the tip but not picking it up--generally
            not desireable, but could be used for dry-run). Default: 3 presses
        increment: :int
            The additional distance to travel on each successive press (e.g.:
            if presses=3 and increment=1, then the first press will travel down
            into the tip by 3.5mm, the second by 4.5mm, and the third by 5.5mm.
            Default: 1mm

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> tiprack = labware.load('GEB-tiprack-300', '2') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left',
        ...     tip_racks=[tiprack]) # doctest: +SKIP
        >>> p300.pick_up_tip(tiprack[0]) # doctest: +SKIP
        >>> p300.return_tip() # doctest: +SKIP
        # `pick_up_tip` will automatically go to tiprack[1]
        >>> p300.pick_up_tip() # doctest: +SKIP
        >>> p300.return_tip() # doctest: +SKIP
        """
        return self._instr_ctx.pick_up_tip(
                location=location, presses=presses, increment=increment)

    @log_call(log)
    def drop_tip(
            self, location: Union[Location, Well] = None,
            home_after: bool = True) -> 'InstrumentContext':
        """
        Drop the pipette's current tip

        Notes
        -----
        If no location is passed, the pipette defaults to its `trash_container`
        (see :any:`Pipette`)

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the drop_tip.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> tiprack = labware.load('tiprack-200ul', 'C2') # doctest: +SKIP
        >>> trash = labware.load('point', 'A3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.pick_up_tip(tiprack[0]) # doctest: +SKIP
        # drops the tip in the fixed trash
        >>> p300.drop_tip() # doctest: +SKIP
        >>> p300.pick_up_tip(tiprack[1]) # doctest: +SKIP
        # drops the tip back at its tip rack
        >>> p300.drop_tip(tiprack[1]) # doctest: +SKIP
        """
        return self._instr_ctx.drop_tip(
                location=location, home_after=home_after)

    @log_call(log)
    def home(self) -> 'InstrumentContext':
        """
        Home the pipette's plunger axis during a protocol run

        Notes
        -----
        `Pipette.home()` homes the `Robot`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='right') # doctest: +SKIP
        >>> p300.home() # doctest: +SKIP
        """
        return self._instr_ctx.home()

    @log_call(log)
    @cmds.publish.both(command=cmds.distribute)
    def distribute(self,
                   volume: float,
                   source: Well,
                   dest: List[Well],
                   *args, **kwargs) -> 'InstrumentContext':
        """
        Distribute will move a volume of liquid from a single of source
        to a list of target locations. See :any:`Transfer` for details
        and a full list of optional arguments.

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.distribute(50, plate[1], plate.cols[0]) # doctest: +SKIP
        """
        return self._instr_ctx.distribute(
            volume=volume, source=source, dest=dest, *args, **kwargs)

    @log_call(log)
    @cmds.publish.both(command=cmds.consolidate)
    def consolidate(self,
                    volume: float,
                    source: List[Well],
                    dest: Well,
                    *args, **kwargs) -> 'InstrumentContext':
        """
        Consolidate will move a volume of liquid from a list of sources
        to a single target location. See :any:`Transfer` for details
        and a full list of optional arguments.

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', 'A3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.consolidate(50, plate.cols[0], plate[1]) # doctest: +SKIP
        """
        return self._instr_ctx.consolidate(
            volume=volume, source=source, dest=dest, *args, **kwargs)

    @log_call(log)
    @cmds.publish.both(command=cmds.transfer)
    def transfer(self,
                 volume: Union[float, Sequence[float]],
                 source: AdvancedLiquidHandling,
                 dest: AdvancedLiquidHandling,
                 **kwargs):
        """
        Transfer will move a volume of liquid from a source location(s)
        to a dest location(s). It is a higher-level command, incorporating
        other :any:`Pipette` commands, like :any:`aspirate` and
        :any:`dispense`, designed to make protocol writing easier at the
        cost of specificity.

        Parameters
        ----------
        volumes : number, list, or tuple
            The amount of volume to remove from each `sources` :any:`Placeable`
            and add to each `targets` :any:`Placeable`. If `volumes` is a list,
            each volume will be used for the sources/targets at the
            matching index. If `volumes` is a tuple with two elements,
            like `(20, 100)`, then a list of volumes will be generated with
            a linear gradient between the two volumes in the tuple.

        source : Placeable or list
            Single :any:`Placeable` or list of :any:`Placeable`s, from where
            liquid will be :any:`aspirate`ed from.

        dest : Placeable or list
            Single :any:`Placeable` or list of :any:`Placeable`s, where
            liquid will be :any:`dispense`ed to.

        new_tip : str
            The number of clean tips this transfer command will use. If
            'never', no tips will be picked up nor dropped. If 'once', a
            single tip will be used for all commands. If 'always', a new tip
            will be used for each transfer. Default is 'once'.

        trash : boolean
            If `True` (default behavior) and trash container has been attached
            to this `Pipette`, then the tip will be sent to the trash
            container.
            If `False`, then tips will be returned to their associated tiprack.

        touch_tip : boolean
            If `True`, a :any:`touch_tip` will occur following each
            :any:`aspirate` and :any:`dispense`. If set to `False` (default),
            no :any:`touch_tip` will occur.

        blow_out : boolean
            If `True`, a :any:`blow_out` will occur following each
            :any:`dispense`, but only if the pipette has no liquid left in it.
            If set to `False` (default), no :any:`blow_out` will occur.

        mix_before : tuple
            Specify the number of repetitions volume to mix, and a :any:`mix`
            will proceed each :any:`aspirate` during the transfer and dispense.
            The tuple's values is interpreted as (repetitions, volume).

        mix_after : tuple
            Specify the number of repetitions volume to mix, and a :any:`mix`
            will following each :any:`dispense` during the transfer or
            consolidate. The tuple's values is interpreted as
            (repetitions, volume).

        carryover : boolean
            If `True` (default), any `volumes` that exceed the maximum volume
            of this `Pipette` will be split into multiple smaller volumes.

        repeat : boolean
            (Only applicable to :any:`distribute` and :any:`consolidate`)If
            `True` (default), sequential :any:`aspirate` volumes will be
            combined into one tip for the purpose of saving time. If `False`,
            all volumes will be transferred seperately.

        gradient : lambda
            Function for calculated the curve used for gradient volumes.
            When `volumes` is a tuple of length 2, it's values are used
            to create a list of gradient volumes. The default curve for
            this gradient is linear (lambda x: x), however a method can
            be passed with the `gradient` keyword argument to create a
            custom curve.

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ...
        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '5') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='right') # doctest: +SKIP
        >>> p300.transfer(50, plate[0], plate[1]) # doctest: +SKIP
        """
        # Note: currently it varies whether the pipette should have a tip on
        # or not depending on the parameters for this call, so we cannot
        # create a very reliable assertion on tip status
        return self._instr_ctx.transfer(
            volume=volume, source=source, dest=dest, **kwargs)

    @log_call(log)
    @cmds.publish.both(command=cmds.delay)
    def delay(self,
              seconds: float = 0,
              minutes: float = 0) -> 'InstrumentContext':
        """
        Parameters
        ----------

        seconds: float
            The number of seconds to freeze in place.
        """
        return self._ctx.delay(seconds=seconds, minutes=minutes)

    @log_call(log)
    def set_speed(self,
                  aspirate: float = None,
                  dispense: float = None,
                  blow_out: float = None) -> 'InstrumentContext':
        """
        Set the speed (mm/second) the :any:`Pipette` plunger will move
        during :meth:`aspirate` and :meth:`dispense`

        Parameters
        ----------
        aspirate: int
            The speed in millimeters-per-second, at which the plunger will
            move while performing an aspirate

        dispense: int
            The speed in millimeters-per-second, at which the plunger will
            move while performing an dispense
        """
        # TODO: When implementing this, cap it to self._max_plunger_speed
        if aspirate:
            self._instr_ctx._speeds.aspirate = aspirate
        if dispense:
            self._instr_ctx._speeds.dispense = dispense
        if blow_out:
            self._instr_ctx._speeds.blow_out = blow_out
        return self._instr_ctx

    @log_call(log)
    def set_flow_rate(self,
                      aspirate: float = None,
                      dispense: float = None,
                      blow_out: float = None) -> 'InstrumentContext':
        """
        Set the speed (uL/second) the :any:`Pipette` plunger will move
        during :meth:`aspirate` and :meth:`dispense`. The speed is set using
        nominal max volumes for any given pipette model.
        Parameters
        ----------
        aspirate: int
            The speed in microliters-per-second, at which the plunger will
            move while performing an aspirate

        dispense: int
            The speed in microliters-per-second, at which the plunger will
            move while performing an dispense
        """
        # TODO: When implementing this, cap it to self._max_plunger_speed
        ul = self.max_volume
        if aspirate:
            ul_per_mm = self._hw_pipette.ul_per_mm(ul, 'aspirate')
            self.set_speed(aspirate=round(aspirate / ul_per_mm, 6))
        if dispense:
            ul_per_mm = self._hw_pipette.ul_per_mm(ul, 'dispense')
            self.set_speed(dispense=round(dispense / ul_per_mm, 6))
        if blow_out:
            ul_per_mm = self._hw_pipette.ul_per_mm(ul, 'dispense')
            self.set_speed(blow_out=round(blow_out / ul_per_mm, 6))
        return self._instr_ctx

    @log_call(log)
    def set_pick_up_current(self, amperes: float) -> 'InstrumentContext':
        """
        Set the current (amperes) the pipette mount's motor will use while
        picking up a tip.

        Parameters
        ----------
        amperes: float (0.0 - 2.0)
            The amperage of the motor while creating a seal with tips.
        """
        if amperes >= 0 and amperes <= 2.0:
            self._hw_pipette.update_config_item('pick_up_current', amperes)
        else:
            raise ValueError(
                'Amperes must be a floating point between 0.0 and 2.0')
        return self._instr_ctx

    def _set_plunger_max_speed_override(self, speed: float):
        self._max_plunger_speed = speed
