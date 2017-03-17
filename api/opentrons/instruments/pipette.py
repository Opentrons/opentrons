import copy
import itertools

from opentrons import containers
from opentrons.containers.calibrator import Calibrator
from opentrons.containers.placeable import Placeable, WellSeries, Container
from opentrons.containers.placeable import humanize_location
from opentrons.instruments.instrument import Instrument
from opentrons.helpers import helpers


class Pipette(Instrument):

    """

    Through this class you can can:
        * Handle liquids with :meth:`aspirate`, :meth:`dispense`,
          :meth:`mix`, and :meth:`blow_out`
        * Handle tips with :meth:`pick_up_tip`, :meth:`drop_tip`,
          and :meth:`return_tip`
        * Calibrate this pipette's plunger positions
        * Calibrate the position of each :any:`Container` on deck

    Here are the typical steps of using the Pipette:
        * Instantiate a pipette with a maximum volume (uL)
        and an axis (`a` or `b`)
        * Design your protocol through the pipette's liquid-handling commands
        * Run on the :any:`Robot` using :any:`run` or :any:`simulate`

    Parameters
    ----------
    axis : str
        The axis of the pipette's actuator on the Opentrons robot ('a' or 'b')
    name : str
        Assigns the pipette a unique name for saving it's calibrations
    channels : int
        The number of channels on this pipette (Default: `1`)
    min_volume : int
        The smallest recommended uL volume for this pipette (Default: `0`)
    max_volume : int
        The largest uL volume for this pipette (Default: `min_volume` + 1)
    trash_container : Container
        Sets the default location :meth:`drop_tip()` will put tips
        (Default: `None`)
    tip_racks : list
        A list of Containers for this Pipette to track tips when calling
        :meth:`pick_up_tip` (Default: [])
    aspirate_speed : int
        The speed (in mm/minute) the plunger will move while aspirating
        (Default: 300)
    dispense_speed : int
        The speed (in mm/minute) the plunger will move while dispensing
        (Default: 500)

    Returns
    -------

    A new instance of :class:`Pipette`.

    Examples
    --------
    >>> from opentrons import instruments, containers
    >>> p1000 = instruments.Pipette(axis='a', max_volume=1000)
    >>> tip_rack_200ul = containers.load('tiprack-200ul', 'A1')
    >>> p200 = instruments.Pipette(
    ...     axis='b',
    ...     max_volume=200,
    ...     tip_racks=[tip_rack_200ul])
    """

    def __init__(
            self,
            axis,
            name=None,
            channels=1,
            min_volume=0,
            max_volume=None,
            trash_container=None,
            tip_racks=[],
            aspirate_speed=300,
            dispense_speed=500):

        self.axis = axis
        self.channels = channels

        if not name:
            name = self.__class__.__name__
        self.name = name

        if isinstance(trash_container, Container) and len(trash_container) > 0:
            trash_container = trash_container[0]
        self.trash_container = trash_container
        self.tip_racks = tip_racks
        self.starting_tip = None

        # default mm above tip to execute drop-tip
        # this gives room for the drop-tip mechanism to work
        self._drop_tip_offset = 15

        self.reset_tip_tracking()

        self.robot.add_instrument(self.axis, self)

        self.placeables = []
        self.previous_placeable = None
        self.current_volume = 0

        self.speeds = {
            'aspirate': aspirate_speed,
            'dispense': dispense_speed
        }

        self.min_volume = min_volume
        self.max_volume = max_volume or (min_volume + 1)

        self.positions = {
            'top': None,
            'bottom': None,
            'blow_out': None,
            'drop_tip': None
        }
        self.calibrated_positions = copy.deepcopy(self.positions)

        self.calibration_data = {}

        # Pipette properties to persist between sessions
        persisted_attributes = ['calibration_data', 'positions', 'max_volume']
        persisted_key = '{axis}:{name}'.format(
            axis=self.axis,
            name=self.name)

        self.init_calibrations(
            key=persisted_key,
            attributes=persisted_attributes)
        self.load_persisted_data()

        self.calibrator = Calibrator(self.robot._deck, self.calibration_data)

        # if the user passed an initialization value,
        # overwrite the loaded persisted data with it
        if isinstance(max_volume, (int, float, complex)) and max_volume > 0:
            self.max_volume = max_volume
            self.update_calibrations()

    def update_calibrator(self):
        self.calibrator = Calibrator(self.robot._deck, self.calibration_data)

    def reset(self):
        """
        Resets the state of this pipette, removing associated placeables,
        setting current volume to zero, and resetting tip tracking
        """
        self.placeables = []
        self.previous_placeable = None
        self.current_volume = 0
        self.reset_tip_tracking()

    def setup_simulate(self, **kwargs):
        """
        Overwrites :any:`Instrument` method, setting the plunger positions
        to simulation defaults
        """
        self.calibrated_positions = copy.deepcopy(self.positions)
        self.positions['top'] = 0
        self.positions['bottom'] = 10
        self.positions['blow_out'] = 12
        self.positions['drop_tip'] = 14

    def teardown_simulate(self):
        """
        Re-assigns any previously-calibrated plunger positions
        """
        self.positions = self.calibrated_positions

    def has_tip_rack(self):
        """
        Returns True of this :any:`Pipette` was instantiated with tip_racks
        """
        return (self.tip_racks is not None and
                isinstance(self.tip_racks, list) and
                len(self.tip_racks) > 0)

    def reset_tip_tracking(self):
        """
        Resets the :any:`Pipette` tip tracking, "refilling" the tip racks
        """
        self.current_tip(None)
        self.tip_rack_iter = iter([])

        if self.has_tip_rack():
            iterables = self.tip_racks

            if self.channels > 1:
                iterables = [r for rack in self.tip_racks for r in rack.rows]
            else:
                iterables = [w for rack in self.tip_racks for w in rack]

            if self.starting_tip:
                iterables = iterables[iterables.index(self.starting_tip):]

            self.tip_rack_iter = itertools.chain(iterables)

    def current_tip(self, *args):
        if len(args) and (isinstance(args[0], Placeable) or args[0] is None):
            self.current_tip_home_well = args[0]
        return self.current_tip_home_well

    def start_at_tip(self, _tip):
        if isinstance(_tip, Placeable):
            self.starting_tip = _tip
            self.reset_tip_tracking()

    def get_next_tip(self):
        next_tip = None
        if self.has_tip_rack():
            try:
                next_tip = next(self.tip_rack_iter)
            except StopIteration as e:
                raise RuntimeWarning(
                    '{0} has run out of tips'.format(self.name))
        else:
            self.robot.add_warning(
                'pick_up_tip called with no reference to a tip')
        return next_tip

    def _associate_placeable(self, location):
        """
        Saves a reference to a placeable
        """
        if not location:
            return

        placeable, _ = containers.unpack_location(location)
        self.previous_placeable = placeable
        if not self.placeables or (placeable != self.placeables[-1]):
            self.placeables.append(placeable)

    # QUEUEABLE
    def move_to(self,
                location,
                strategy='arc',
                enqueue=True):
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

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.
        """
        if not location:
            return self

        self.robot.move_to(
            location,
            instrument=self,
            strategy=strategy,
            enqueue=enqueue)

        return self

    # QUEUEABLE
    def aspirate(self,
                 volume=None,
                 location=None,
                 rate=1.0,
                 enqueue=True):
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If no `location` is passed, the pipette will aspirate
        from it's current position. If no `volume` is passed,
        `aspirate` will default to it's `max_volume`

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

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)

        >>> # aspirate 50uL from a Well
        >>> p200.aspirate(50, plate[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # aspirate 50uL from the center of a well
        >>> relative_vector = plate[1].center()
        >>> p200.aspirate(50, (plate[1], relative_vector)) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # aspirate 20uL in place, twice as fast
        >>> p200.aspirate(20, rate=2.0) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # aspirate the pipette's remaining volume (80uL) from a Well
        >>> p200.aspirate(plate[2]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """

        # set True if volume before this aspirate was 0uL
        plunger_empty = False

        def _setup():
            nonlocal volume
            nonlocal location
            nonlocal rate
            nonlocal plunger_empty
            if not isinstance(volume, (int, float, complex)):
                if volume and not location:
                    location = volume
                volume = self.max_volume - self.current_volume

            if self.current_volume + volume > self.max_volume:
                raise RuntimeWarning(
                    'Pipette ({0}) cannot hold volume {1}'
                    .format(
                        self.max_volume,
                        self.current_volume + volume)
                )

            if self.current_volume == 0:
                plunger_empty = True
            self.current_volume += volume

            self._associate_placeable(location)

        def _do():
            nonlocal volume
            nonlocal location
            nonlocal rate
            nonlocal plunger_empty
            distance = self._plunge_distance(self.current_volume)
            bottom = self._get_plunger_position('bottom')
            destination = bottom - distance

            speed = self.speeds['aspirate'] * rate

            self._position_for_aspirate(location, plunger_empty)

            self.motor.speed(speed)
            self.motor.move(destination)

        # if volume is specified as 0uL, then do nothing
        if volume is 0:
            return self

        _description = "Aspirating {0} {1}".format(
            volume,
            ('at ' + humanize_location(location) if location else '')
        )
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        return self

    # QUEUEABLE
    def dispense(self,
                 volume=None,
                 location=None,
                 rate=1.0,
                 enqueue=True):
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If no `location` is passed, the pipette will dispense
        from it's current position. If no `volume` is passed,
        `dispense` will default to it's `current_volume`

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

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)
        >>> # fill the pipette with liquid (200uL)
        >>> p200.aspirate(plate[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # dispense 50uL to a Well
        >>> p200.dispense(50, plate[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # dispense 50uL to the center of a well
        >>> relative_vector = plate[1].center()
        >>> p200.dispense(50, (plate[1], relative_vector)) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # dispense 20uL in place, at half the speed
        >>> p200.dispense(20, rate=0.5) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # dispense the pipette's remaining volume (80uL) to a Well
        >>> p200.dispense(plate[2]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        def _setup():
            nonlocal location
            nonlocal volume
            nonlocal rate

            if not isinstance(volume, (int, float, complex)):
                if volume and not location:
                    location = volume
                volume = self.current_volume

            if volume is None or (self.current_volume - volume < 0):
                volume = self.current_volume

            if isinstance(location, Placeable):
                location = location.bottom(1)

            self.current_volume -= volume

            self._associate_placeable(location)

        def _do():
            nonlocal location
            nonlocal volume
            nonlocal rate

            self.move_to(location, strategy='arc', enqueue=False)

            distance = self._plunge_distance(self.current_volume)
            bottom = self._get_plunger_position('bottom')
            destination = bottom - distance

            speed = self.speeds['dispense'] * rate

            self.motor.speed(speed)
            self.motor.move(destination)

        # if volume is specified as 0uL, then do nothing
        if volume is 0:
            return self

        _description = "Dispensing {0} {1}".format(
            volume,
            ('at ' + humanize_location(location) if location else '')
        )
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)
        return self

    def _position_for_aspirate(self, location=None, plunger_empty=False):
        """
        Position this :any:`Pipette` for an aspiration,
        given it's current state
        """

        # first go to the destination
        if location:
            placeable, _ = containers.unpack_location(location)
            self.move_to(placeable.top(), strategy='arc', enqueue=False)

        # setup the plunger above the liquid
        if plunger_empty:
            self.motor.move(self._get_plunger_position('bottom'))

        # then go inside the location
        if location:
            if isinstance(location, Placeable):
                location = location.bottom(1)
            self.move_to(location, strategy='direct', enqueue=False)

    # QUEUEABLE
    def mix(self,
            repetitions=1,
            volume=None,
            location=None,
            rate=1.0,
            enqueue=True):
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

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)

        >>> # mix 50uL in a Well, three times
        >>> p200.mix(3, 50, plate[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>

        >>> # mix 3x with the pipette's max volume, from current position
        >>> p200.mix(3) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """

        def _setup():
            nonlocal volume
            nonlocal location
            nonlocal repetitions

            if volume is None:
                volume = self.max_volume

            self._associate_placeable(location)

        def _do():
            # plunger movements are handled w/ aspirate/dispense
            # using Command for printing description
            pass

        _description = "Mixing {0} times with a volume of {1}ul".format(
            repetitions, self.max_volume if volume is None else volume
        )
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        if not location and self.previous_placeable:
            location = self.previous_placeable
        self.aspirate(location=location,
                      volume=volume,
                      rate=rate,
                      enqueue=enqueue)
        for i in range(repetitions - 1):
            self.dispense(volume, rate=rate, enqueue=enqueue)
            self.aspirate(volume, rate=rate, enqueue=enqueue)
        self.dispense(volume, rate=rate, enqueue=enqueue)

        return self

    # QUEUEABLE
    def blow_out(self, location=None, enqueue=True):
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

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)
        >>> p200.aspirate(50).dispense().blow_out() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        def _setup():
            nonlocal location
            self.current_volume = 0
            self._associate_placeable(location)

        def _do():
            nonlocal location
            self.move_to(location, strategy='arc', enqueue=False)
            self.motor.move(self._get_plunger_position('blow_out'))

        _description = "Blowing out {}".format(
            'at ' + humanize_location(location) if location else ''
        )
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)
        return self

    # QUEUEABLE
    def touch_tip(self, location=None, radius=1.0, enqueue=True):
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
            Radius is a floating point number between 0.0 and 1.0, describing
            the percentage of a well's radius. When radius=1.0,
            :any:`touch_tip()` will move to 100% of the wells radius. When
            radius=0.5, :any:`touch_tip()` will move to 50% of the wells
            radius.

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)
        >>> p200.aspirate(50, plate[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.dispense(plate[1]).touch_tip() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        height_offset = 0

        def _setup():
            nonlocal location, height_offset
            if isinstance(location, (int, float, complex)):
                height_offset = location
                location = self.previous_placeable
            self._associate_placeable(location)

        def _do():
            nonlocal location, radius

            # if no location specified, use the previously
            # associated placeable to get Well dimensions
            if location:
                self.move_to(location, strategy='arc', enqueue=False)
            else:
                location = self.previous_placeable

            v_offset = (0, 0, height_offset)

            self.move_to(
                (
                    location,
                    location.from_center(x=radius, y=0, z=1) + v_offset
                ),
                strategy='direct',
                enqueue=False)
            self.move_to(
                (
                    location,
                    location.from_center(x=radius * -1, y=0, z=1) + v_offset
                ),
                strategy='direct',
                enqueue=False)
            self.move_to(
                (
                    location,
                    location.from_center(x=0, y=radius, z=1) + v_offset
                ),
                strategy='direct',
                enqueue=False)
            self.move_to(
                (
                    location,
                    location.from_center(x=0, y=radius * -1, z=1) + v_offset
                ),
                strategy='direct',
                enqueue=False)

        _description = 'Touching tip'
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        return self

    # QUEUEABLE
    def air_gap(self, volume=None, height=None, enqueue=True):
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
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)
        >>> p200.aspirate(50, plate[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.air_gap(50) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """

        def _setup():
            pass

        def _do():
            pass

        # if volumes is specified as 0uL, do nothing
        if volume is 0:
            return self

        _description = 'Air gap'
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        if height is None:
            height = 20

        location = self.previous_placeable.top(height)
        # "move_to" separate from aspirate command
        # so "_position_for_aspirate" isn't executed
        self.move_to(location, enqueue=enqueue)
        self.aspirate(volume, enqueue=enqueue)

        return self

    # QUEUEABLE
    def return_tip(self, enqueue=True):
        """
        Drop the pipette's current tip to it's originating tip rack

        Notes
        -----
        This method requires one or more tip-rack :any:`Container`
        to be in this Pipette's `tip_racks` list (see :any:`Pipette`)

        Parameters
        ----------
        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> robot.reset() # doctest: +ELLIPSIS
        <opentrons.robot.robot.Robot object at ...>
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> p200 = instruments.Pipette(axis='a', tip_racks=[tiprack])
        >>> p200.pick_up_tip() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.aspirate(50, plate[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.dispense(plate[1]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.return_tip() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """

        def _setup():
            pass

        def _do():
            pass

        _description = "Returning tip"
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        if not self.current_tip():
            self.robot.add_warning(
                'Pipette has no tip to return, dropping in place')

        self.drop_tip(self.current_tip(), enqueue=enqueue)

        return self

    # QUEUEABLE
    def pick_up_tip(self, location=None, enqueue=True):
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

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> robot.reset() # doctest: +ELLIPSIS
        <opentrons.robot.robot.Robot object at ...>
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> p200 = instruments.Pipette(axis='a', tip_racks=[tiprack])
        >>> p200.pick_up_tip(tiprack[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.return_tip() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> # `pick_up_tip` will automatically go to tiprack[1]
        >>> p200.pick_up_tip() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.return_tip() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        def _setup():
            nonlocal location
            if not location:
                location = self.get_next_tip()
            self.current_tip(None)
            if location:
                placeable, _ = containers.unpack_location(location)
                self.current_tip(placeable)

            if isinstance(location, Placeable):
                location = location.bottom()

            self._associate_placeable(location)

            self.current_volume = 0

        def _do():
            nonlocal location

            if location:
                self.move_to(location, strategy='arc', enqueue=False)

            tip_plunge = 6

            self.robot.move_head(z=tip_plunge, mode='relative')
            self.robot.move_head(z=-tip_plunge - 1, mode='relative')
            self.robot.move_head(z=tip_plunge + 1, mode='relative')
            self.robot.move_head(z=-tip_plunge, mode='relative')

        _description = "Picking up tip {0}".format(
            ('from ' + humanize_location(location) if location else '')
        )
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)
        return self

    # QUEUEABLE
    def drop_tip(self, location=None, enqueue=True):
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

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> robot.reset() # doctest: +ELLIPSIS
        <opentrons.robot.robot.Robot object at ...>
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> trash = containers.load('point', 'A1')
        >>> p200 = instruments.Pipette(axis='a', trash_container=trash)
        >>> p200.pick_up_tip(tiprack[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> # drops the tip in the trash
        >>> p200.drop_tip() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> p200.pick_up_tip(tiprack[1]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        >>> # drops the tip back at its tip rack
        >>> p200.drop_tip(tiprack[1]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        def _setup():
            nonlocal location
            if not location and self.trash_container:
                location = self.trash_container

            if isinstance(location, Placeable):
                # give space for the drop-tip mechanism
                location = location.bottom(self._drop_tip_offset)

            self._associate_placeable(location)
            self.current_tip(None)

            self.current_volume = 0

        def _do():
            nonlocal location

            if location:
                self.move_to(location, strategy='arc', enqueue=False)

            self.motor.move(self._get_plunger_position('drop_tip'))
            self.motor.home()

            self.motor.move(self._get_plunger_position('bottom'))

        _description = "Drop_tip {}".format(
            ('at ' + humanize_location(location) if location else '')
        )

        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)
        return self

    # QUEUEABLE
    def home(self, enqueue=True):

        """
        Home the pipette's plunger axis during a protocol run

        Notes
        -----
        `Pipette.home()` enqueues to `Robot` commands
        (see :any:`run` and :any:`simulate`)

        Parameters
        ----------
        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a')
        >>> p200.home() # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """

        def _setup():
            self.current_volume = 0

        def _do():
            self.motor.home()

        _description = "Homing pipette plunger on axis {}".format(self.axis)
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)
        return self

    # QUEUEABLE
    def distribute(self, *args, **kwargs):
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
        >>> plate = containers.load('96-flat', 'B1')
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)
        >>> p200.distribute(50, plate[1], plate.cols[0]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        kwargs['mode'] = 'distribute'
        kwargs['mix_after'] = (0, 0)
        if 'disposal_vol' not in kwargs:
            kwargs['disposal_vol'] = self.min_volume
        return self.transfer(*args, **kwargs)

    # QUEUEABLE
    def consolidate(self, *args, **kwargs):
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
        >>> plate = containers.load('96-flat', 'B1')
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)
        >>> p200.consolidate(50, plate.cols[0], plate[1]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        kwargs['mode'] = 'consolidate'
        kwargs['mix_before'] = (0, 0)
        kwargs['air_gap'] = 0
        kwargs['disposal_vol'] = 0
        return self.transfer(*args, **kwargs)

    # QUEUEABLE
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

        new_tip : number
            The number of clean tips this transfer command will use. If 0,
            no tips will be picked up nor dropped. If 1, a single tip will be
            used for all commands.

        trash : boolean
            If `False` (default behavior) tips will be returned to their
            tip rack. If `True` and a trash container has been attached
            to this `Pipette`, then the tip will be sent to the trash
            container.

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
        ..
        >>> plate = containers.load('96-flat', 'B1')
        >>> p200 = instruments.Pipette(axis='a', max_volume=200)
        >>> p200.transfer(50, plate[0], plate[1]) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
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

        plan = self._create_transfer_plan(volume, source, dest, **kwargs)
        self._run_transfer_plan(tips, plan, **kwargs)

        return self

    # QUEUEABLE
    def delay(self, seconds=0, minutes=0, enqueue=True):
        """
        Parameters
        ----------

        seconds: float
            The number of seconds to freeeze in place.

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately
        """

        def _setup():
            pass

        def _do():
            nonlocal seconds
            self.motor.wait(seconds)

        minutes += int(seconds / 60)
        seconds = seconds % 60
        _description = "Delaying {} minutes and {} seconds".format(
            minutes, seconds)
        seconds += float(minutes * 60)
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)
        return self

    def calibrate(self, position):
        """
        Calibrate a saved plunger position to the robot's current position

        Notes
        -----
        This will only work if the API is connected to a robot

        Parameters
        ----------

        position : str
            Either "top", "bottom", "blow_out", or "drop_tip"

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> robot = Robot()
        >>> p200 = instruments.Pipette(axis='a')
        >>> robot.move_plunger(**{'a': 10})
        >>> # save plunger 'top' to coordinate 10
        >>> p200.calibrate('top') # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        current_position = self.robot._driver.get_plunger_positions()
        current_position = current_position['target'][self.axis]
        kwargs = {}
        kwargs[position] = current_position
        self.calibrate_plunger(**kwargs)

        return self

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
        if top is not None:
            self.positions['top'] = top
        if bottom is not None:
            self.positions['bottom'] = bottom
        if blow_out is not None:
            self.positions['blow_out'] = blow_out
        if drop_tip is not None:
            self.positions['drop_tip'] = drop_tip

        self.update_calibrations()

        return self

    def calibrate_position(self, location, current=None):
        """
        Save the position of a :any:`Placeable` (usually a :any:`Container`)
        relative to this pipette.

        Notes
        -----
        The saved position will be persisted under this pipette's `name`
        and `axis` (see :any:`Pipette`)

        Parameters
        ----------
        location : tuple(:any:`Placeable`, :any:`Vector`)
            A tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        current : :any:`Vector`
            The coordinate to save this container to
            (Default: robot current position)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> robot.reset() # doctest: +ELLIPSIS
        <opentrons.robot.robot.Robot object at ...>
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> p200 = instruments.Pipette(axis='a')
        >>> robot.move_head(x=100, y=100, z=100)
        >>> rel_pos = tiprack[0].from_center(x=0, y=0, z=-1, reference=tiprack)
        >>> p200.calibrate_position((tiprack, rel_pos)) # doctest: +ELLIPSIS
        <opentrons.instruments.pipette.Pipette object at ...>
        """
        if not current:
            current = self.robot._driver.get_head_position()['current']

        self.calibration_data = self.calibrator.calibrate(
            self.calibration_data,
            location,
            current)

        self.update_calibrations()

        return self

    def set_max_volume(self, max_volume):
        """
        Set this pipette's maximum volume, equal to the number of
        microliters drawn when aspirating with the plunger's full range

        Parameters
        ----------
        max_volume: int or float
            The maximum number of microliters this :any:`Pipette` can hold.
            Must be calculated and set after plunger calibrations to ensure
            accuracy
        """
        self.max_volume = max_volume

        if self.max_volume <= self.min_volume:
            raise RuntimeError(
                'Pipette max volume is less than '
                'min volume ({0} < {1})'.format(
                    self.max_volume, self.min_volume))

        self.update_calibrations()

        return self

    def _get_plunger_position(self, position):
        """
        Returns the calibrated coordinate of a given plunger position

        Raises exception if the position has not been calibrated yet
        """
        try:
            value = self.positions[position]
            if isinstance(value, (int, float, complex)):
                return value
            else:
                raise RuntimeError(
                    'Plunger position "{}" not yet calibrated'.format(
                        position))
        except KeyError:
            raise RuntimeError(
                'Plunger position "{}" does not exist'.format(
                    position))

    def _plunge_distance(self, volume):
        """Calculate axis position for a given liquid volume.

        Translates the passed liquid volume to absolute coordinates
        on the axis associated with this pipette.

        Calibration of the top and bottom positions are necessary for
        these calculations to work.
        """
        percent = self._volume_percentage(volume)
        top = self._get_plunger_position('top')
        bottom = self._get_plunger_position('bottom')
        travel = bottom - top
        if travel <= 0:
            self.robot.add_warning('Plunger calibrated incorrectly')
        return travel * percent

    def _volume_percentage(self, volume):
        """Returns the plunger percentage for a given volume.

        We use this to calculate what actual position the plunger axis
        needs to be at in order to achieve the correct volume of liquid.
        """
        if volume < 0:
            raise RuntimeError(
                "Volume must be a positive number, got {}.".format(volume))
            volume = 0
        if volume > self.max_volume:
            raise RuntimeError(
                "{0}µl exceeds pipette's maximum volume ({1}ul).".format(
                    volume, self.max_volume))
        if volume < self.min_volume and volume > 0:
            self.robot.add_warning(
                "{0}µl is less than pipette's min_volume ({1}ul).".format(
                    volume, self.min_volume))

        return volume / self.max_volume

    def _create_transfer_plan(self, v, s, t, **kwargs):
        if self.channels > 1:
            # SPECIAL CASE: if using multi-channel pipette,
            # and the source or target is a WellSeries
            # then avoid iterating through it's Wells
            if isinstance(s, WellSeries) and not isinstance(s[0], WellSeries):
                s = [s] if isinstance(s, WellSeries) else s
            if isinstance(t, WellSeries) and not isinstance(t[0], WellSeries):
                t = [t] if isinstance(t, WellSeries) else t

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

        max_vol = self.max_volume
        max_vol -= kwargs.get('air_gap', 0)  # air

        if kwargs.get('divide', True):
            transfer_plan = helpers._expand_for_carryover(
                max_vol, transfer_plan, **kwargs)

        transfer_plan = helpers._compress_for_repeater(
            max_vol, transfer_plan, **kwargs)

        return transfer_plan

    def _run_transfer_plan(self, tips, plan, **kwargs):
        enqueue = kwargs.get('enqueue', True)
        air_gap = kwargs.get('air_gap', 0)
        touch_tip = kwargs.get('touch_tip', -1)

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
                if touch_tip or touch_tip is 0:
                    self.touch_tip(touch_tip, enqueue=enqueue)
                if step is plan[-1] or plan[i + 1].get('aspirate'):
                    self._blowout_during_transfer(
                        dispense['location'], **kwargs)
                    tips = self._drop_tip_during_transfer(
                        tips, i, total_transfers, **kwargs)
                else:
                    if air_gap:
                        self.air_gap(air_gap, enqueue=enqueue)

    def _add_tip_during_transfer(self, tips, **kwargs):
        """
        Performs a :any:`pick_up_tip` when running a :any:`transfer`,
        :any:`distribute`, or :any:`consolidate`.
        """
        enqueue = kwargs.get('enqueue', True)
        if self.has_tip_rack() and tips > 0 and not self.current_tip():
            self.pick_up_tip(enqueue=enqueue)

    def _aspirate_during_transfer(self, vol, loc, **kwargs):
        """
        Performs an :any:`aspirate` when running a :any:`transfer`, and
        optionally a :any:`touch_tip` afterwards.
        """
        enqueue = kwargs.get('enqueue', True)
        rate = kwargs.get('rate', 1)
        mix_before = kwargs.get('mix', kwargs.get('mix_before', (0, 0)))
        air_gap = kwargs.get('air_gap', 0)
        touch_tip = kwargs.get('touch_tip', False)

        if self.current_volume == 0:
            self._mix_during_transfer(mix_before, loc, **kwargs)
        self.aspirate(vol, loc, rate=rate, enqueue=enqueue)
        if touch_tip or touch_tip is 0:
            self.touch_tip(touch_tip, enqueue=enqueue)
        if air_gap:
            self.air_gap(air_gap, enqueue=enqueue)

    def _dispense_during_transfer(self, vol, loc, **kwargs):
        """
        Performs a :any:`dispense` when running a :any:`transfer`, and
        optionally a :any:`mix`, :any:`touch_tip`, and/or
        :any:`blow_out` afterwards.
        """
        enqueue = kwargs.get('enqueue', True)
        mix_after = kwargs.get('mix_after', (0, 0))
        rate = kwargs.get('rate', 1)
        air_gap = kwargs.get('air_gap', 0)

        if air_gap:
            self.dispense(air_gap, loc, rate=rate, enqueue=enqueue)
        self.dispense(vol, loc, rate=rate, enqueue=enqueue)
        self._mix_during_transfer(mix_after, loc, **kwargs)

    def _mix_during_transfer(self, mix, loc, **kwargs):
        enqueue = kwargs.get('enqueue', True)
        if self.current_volume == 0 and isinstance(mix, (tuple, list)):
            if len(mix) == 2 and 0 not in mix:
                self.mix(mix[0], mix[1], loc, enqueue=enqueue)

    def _blowout_during_transfer(self, loc, **kwargs):
        enqueue = kwargs.get('enqueue', True)
        blow_out = kwargs.get('blow_out', False)
        if self.current_volume > 0 or blow_out:
            if not isinstance(blow_out, Placeable):
                blow_out = self.trash_container
                if self.current_volume == 0:
                    blow_out = None
            self.blow_out(blow_out, enqueue=enqueue)
            self._mix_during_transfer(
                kwargs.get('mix_after', (0, 0)),
                loc,
                **kwargs)

    def _drop_tip_during_transfer(self, tips, i, total, **kwargs):
        """
        Performs a :any:`drop_tip` or :any:`return_tip` when
        running a :any:`transfer`, :any:`distribute`, or :any:`consolidate`.
        """
        enqueue = kwargs.get('enqueue', True)
        trash = kwargs.get('trash', True)
        if tips > 1 or (i + 1 == total and tips > 0):
            if trash and self.trash_container:
                self.drop_tip(enqueue=enqueue)
            else:
                self.return_tip(enqueue=enqueue)
            tips -= 1
        return tips

    def set_speed(self, **kwargs):
        """
        Set the speed (mm/minute) the :any:`Pipette` plunger will move
        during :meth:`aspirate` and :meth:`dispense`

        Parameters
        ----------
        kwargs: Dict
            A dictionary who's keys are either "aspirate" or "dispense",
            and who's values are int or float (Example: `{"aspirate": 300}`)
        """
        keys = {'aspirate', 'dispense'} & kwargs.keys()
        for key in keys:
            self.speeds[key] = kwargs.get(key)
        return self

    @property
    def motor(self):
        return self.robot.get_motor(self.axis)
