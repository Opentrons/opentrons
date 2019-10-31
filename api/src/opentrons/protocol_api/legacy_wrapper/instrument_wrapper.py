# pylama:ignore=E731

import logging
from typing import Optional, TYPE_CHECKING
from opentrons import commands
from .util import log_call

if TYPE_CHECKING:
    from ..contexts import InstrumentContext

log = logging.getLogger(__name__)


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
        self._ctx = instrument_context
        self._max_plunger_speed: Optional[float] = None

    @log_call(log)
    def reset(self):
        """
        Resets the state of this pipette, removing associated placeables,
        setting current volume to zero, and resetting tip tracking
        """
        return None

    @property
    def has_tip(self):
        """
        Returns whether a pipette has a tip attached. Added in for backwards
        compatibility purposes in deck calibration CLI tool.
        """
        log.info('instrument.has_tip')
        return None

    @log_call(log)
    def has_tip_rack(self):
        """
        Returns True of this :any:`Pipette` was instantiated with tip_racks
        """
        return None

    @log_call(log)
    def reset_tip_tracking(self):
        """
        Resets the :any:`Pipette` tip tracking, "refilling" the tip racks
        """
        return None

    @log_call(log)
    def current_tip(self, *args):
        return None

    @log_call(log)
    def start_at_tip(self, _tip):
        return None

    @log_call(log)
    def get_next_tip(self):
        return None

    @log_call(log)
    def move_to(self, location, strategy=None):
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
        return self

    @log_call(log)
    def aspirate(self, volume=None, location=None, rate=1.0):
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
        return self

    @log_call(log)
    def dispense(self,
                 volume=None,
                 location=None,
                 rate=1.0):
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
        return self

    @log_call(log)
    def retract(self, safety_margin=10):
        '''
        Move the pipette's mount upwards and away from the deck

        Parameters
        ----------
        safety_margin: int
            Distance in millimeters awey from the limit switch,
            used during the mount's `fast_home()` method
        '''
        return self

    @log_call(log)
    def mix(self,
            repetitions=1,
            volume=None,
            location=None,
            rate=1.0):
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
        return self

    @log_call(log)
    @commands.publish.both(command=commands.blow_out)
    def blow_out(self, location=None):
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
        return self

    @log_call(log)
    def touch_tip(self, location=None, radius=1.0, v_offset=-1.0, speed=60.0):
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
        return self

    @log_call(log)
    def air_gap(self, volume=None, height=None):
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
        return self

    @log_call(log)
    @commands.publish.both(command=commands.return_tip)
    def return_tip(self, home_after=True):
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
        return self

    @log_call(log)
    def pick_up_tip(self, location=None, presses=None, increment=None):
        """
        Pick up a tip for the Pipette to run liquid-handling commands with

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
        return self

    @log_call(log)
    def drop_tip(self, location=None, home_after=True):
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
        return self

    @log_call(log)
    def home(self):
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
        return self

    @log_call(log)
    @commands.publish.both(command=commands.distribute)
    def distribute(self, volume, source, dest, *args, **kwargs):
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
        return self.transfer(*args, **kwargs)

    @log_call(log)
    @commands.publish.both(command=commands.consolidate)
    def consolidate(self, volume, source, dest, *args, **kwargs):
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
        return self.transfer(*args, **kwargs)

    @log_call(log)
    @commands.publish.both(command=commands.transfer)
    def transfer(self, volume, source, dest, **kwargs):
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
        return self

    @log_call(log)
    @commands.publish.both(command=commands.delay)
    def delay(self, seconds=0, minutes=0):
        """
        Parameters
        ----------

        seconds: float
            The number of seconds to freeze in place.
        """
        return self

    @log_call(log)
    def calibrate_plunger(
            self,
            top=None,
            bottom=None,
            blow_out=None,
            drop_tip=None):
        """Set calibration values for the pipette plunger.

        This can be called multiple times as the user sets each value,
        or you can set them all at once.

        Parameters
        ----------

        top : int
           Touching but not engaging the plunger.

        bottom: int
            Must be above the pipette's physical hard-stop, while still
            leaving enough room for 'blow_out'

        blow_out : int
            Plunger has been pushed down enough to expell all liquids.

        drop_tip : int
            This position that causes the tip to be released from the
            pipette.

        """
        return self

    @log_call(log)
    def set_speed(self, aspirate=None, dispense=None, blow_out=None):
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
        return self

    @log_call(log)
    def set_flow_rate(self, aspirate=None, dispense=None, blow_out=None):
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
        return self

    @log_call(log)
    def set_pick_up_current(self, amperes):
        """
        Set the current (amperes) the pipette mount's motor will use while
        picking up a tip.

        Parameters
        ----------
        amperes: float (0.0 - 2.0)
            The amperage of the motor while creating a seal with tips.
        """
        return self

    @property
    def type(self):
        log.info('instrument.type')
        return 'single'

    def _set_plunger_max_speed_override(self, speed: float):
        self._max_plunger_speed = speed
