import copy

from opentrons import containers
from opentrons.robot.command import Command

from opentrons.robot.robot import Robot
from opentrons.containers.calibrator import Calibrator
from opentrons.containers.placeable import Placeable, humanize_location
from opentrons.instruments.instrument import Instrument

import itertools


class Pipette(Instrument):

    """

    Through this class you can can:
        * Handle liquids with :meth:`aspirate`, :meth:`dispense`, :meth:`mix`, and :meth:`blow_out`
        * Handle tips with :meth:`pick_up_tip`, :meth:`drop_tip`, and :meth:`return_tip`
        * Calibrate this pipette's plunger positions
        * Calibrate the position of each :any:`Container` on deck

    Here are the typical steps of using the Pipette:
        * Instantiate a pipette, attaching it to an axis (`a` or `b`)
        * Set the maximum volume of this pipette (using :meth:`set_max_volume`)
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
    trash_container : Container
        Sets the default location :meth:`drop_tip()` will put tips (Default: `None`)
    tip_racks : list
        A list of Containers for this Pipette to track tips when calling :meth:`pick_up_tip` (Default: [])
    aspirate_speed : int
        The speed (in mm/minute) the plunger will move while aspirating (Default: 300)
    dispense_speed : int
        The speed (in mm/minute) the plunger will move while dispensing (Default: 500)

    Returns
    -------

    A new instance of :class:`Pipette`.

    Examples
    --------
    >>> from opentrons import instruments, containers
    >>> p1000 = instruments.Pipette(axis='a')
    >>> p1000.set_max_volume(1000)
    >>> tip_rack_200ul = containers.load('tiprack-200ul', 'A1')
    >>> p200 = instruments.Pipette(
    >>>      axis='b',
    >>>      name='my_favorite_pipette',
    >>>      tip_racks=[tip_rack_200ul],
    >>>      channels=8,
    >>>      aspirate_speed=300,
    >>>      dispense_speed=500
    >>> )
    >>> p200.set_max_volume(200)
    """

    def __init__(
            self,
            axis,
            name=None,
            channels=1,
            min_volume=0,
            trash_container=None,
            tip_racks=[],
            aspirate_speed=300,
            dispense_speed=500):

        self.axis = axis
        self.channels = channels

        if not name:
            name = self.__class__.__name__
        self.name = name

        self.calibration_data = {}

        self.trash_container = trash_container
        self.tip_racks = tip_racks

        self.reset_tip_tracking()

        self.robot = Robot.get_instance()
        self.robot.add_instrument(self.axis, self)
        self.plunger = self.robot.get_motor(self.axis)

        self.placeables = []
        self.current_volume = 0

        self.speeds = {
            'aspirate': aspirate_speed,
            'dispense': dispense_speed
        }

        self.min_volume = min_volume
        self.max_volume = self.min_volume + 1

        self.positions = {
            'top': None,
            'bottom': None,
            'blow_out': None,
            'drop_tip': None
        }
        self.calibrated_positions = copy.deepcopy(self.positions)

        self.init_calibrations()
        self.load_persisted_data()

        self.calibrator = Calibrator(self.robot._deck, self.calibration_data)

    def reset(self):
        self.placeables = []
        self.current_volume = 0
        self.reset_tip_tracking()

    def set_plunger_defaults(self):
        self.calibrated_positions = copy.deepcopy(self.positions)
        self.positions['top'] = 0
        self.positions['bottom'] = 10
        self.positions['blow_out'] = 12
        self.positions['drop_tip'] = 14

    def restore_plunger_positions(self):
        self.positions = self.calibrated_positions

    def has_tip_rack(self):
        return (self.tip_racks is not None and
                isinstance(self.tip_racks, list) and
                len(self.tip_racks) > 0)

    def reset_tip_tracking(self):
        self.current_tip_home_well = None
        self.tip_rack_iter = iter([])

        if self.has_tip_rack():
            iterables = self.tip_racks

            if self.channels > 1:
                iterables = []
                for rack in self.tip_racks:
                    iterables.append(rack.rows)

            self.tip_rack_iter = itertools.cycle(
                itertools.chain(*iterables)
            )

    def associate_placeable(self, location):
        placeable, _ = containers.unpack_location(location)
        if not self.placeables or (placeable != self.placeables[-1]):
            self.placeables.append(placeable)

    def move_to(self, location, strategy='arc', now=False):
        if location:
            self.associate_placeable(location)
            self.robot.move_to(
                location,
                instrument=self,
                strategy=strategy,
                now=now)

        return self

    def aspirate(self, volume=None, location=None, rate=1.0):
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If no `location` is passed, the pipette will aspirate from it's current position.
        If no `volume` is passed, `aspirate` will default to it's `max_volume` (see :any:`set_max_volume`)

        Parameters
        ----------
        volume : int or float
            The number of microliters to aspirate (Default: self.max_volume)

        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the aspirate.
            Can also be a tuple with first item :any:`Placeable`, second item relative :any:`Vector`
        
        rate : float
            Set plunger speed for this aspirate, where speed = rate * aspirate_speed (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a')
        >>> p200.set_max_volume(200)

        >>> # aspirate 50uL from a Well
        >>> p200.aspirate(50, plate[0])

        >>> # aspirate 50uL from the center of a well
        >>> relative_vector = plate[1].center()
        >>> p200.aspirate(50, (plate[1], relative_vector))

        >>> # aspirate 20uL in place, twice as fast
        >>> p200.aspirate(20, rate=2.0)

        >>> # aspirate the pipette's remaining volume (80uL in this case) from a Well
        >>> p200.aspirate(plate[2])
        """
        def _do_aspirate():
            nonlocal volume
            nonlocal location
            if not isinstance(volume, (int, float, complex)):
                if volume and not location:
                    location = volume
                volume = self.max_volume - self.current_volume

            if self.current_volume + volume > self.max_volume:
                print('********', volume, location, self.max_volume)
                raise RuntimeWarning(
                    'Pipette cannot hold volume {}'
                    .format(self.current_volume + volume)
                )

            self.position_for_aspirate(location)

            self.current_volume += volume
            distance = self.plunge_distance(self.current_volume)
            bottom = self.positions['bottom'] or 0
            destination = bottom - distance

            speed = self.speeds['aspirate'] * rate

            self.plunger.speed(speed)
            self.plunger.move(destination)

        description = "Aspirating {0}uL at {1}".format(
            volume,
            (humanize_location(location) if location else '<In Place>')
        )
        self.robot.add_command(
            Command(do=_do_aspirate, description=description))

        return self

    def dispense(self, volume=None, location=None, rate=1.0):
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If no `location` is passed, the pipette will dispense from it's current position.
        If no `volume` is passed, `dispense` will default to it's `current_volume`

        Parameters
        ----------
        volume : int or float
            The number of microliters to dispense (Default: self.current_volume)
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the dispense.
            Can also be a tuple with first item :any:`Placeable`, second item relative :any:`Vector`
        rate : float
            Set plunger speed for this dispense, where speed = rate * dispense_speed (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a')
        >>> p200.set_max_volume(200)
        >>> p200.aspirate(plate[0])  # fill the pipette with liquid (200uL)

        >>> # dispense 50uL to a Well
        >>> p200.dispense(50, plate[0])

        >>> # dispense 50uL to the center of a well
        >>> relative_vector = plate[1].center()
        >>> p200.dispense(50, (plate[1], relative_vector))

        >>> # dispense 20uL in place, at half the speed
        >>> p200.dispense(20, rate=0.5)

        >>> # dispense the pipette's remaining volume (80uL in this case) to a Well
        >>> p200.dispense(plate[2])
        """
        def _do():
            nonlocal location
            nonlocal volume
            if not isinstance(volume, (int, float, complex)):
                if volume and not location:
                    location = volume
                volume = self.current_volume

            if self.current_volume - volume < 0:
                volume = self.current_volume

            if location:
                self.move_to(location, strategy='arc', now=True)

            if volume:
                self.current_volume -= volume
                distance = self.plunge_distance(self.current_volume)
                bottom = self.positions['bottom'] or 0
                destination = bottom - distance

                speed = self.speeds['dispense'] * rate

                self.plunger.speed(speed)
                self.plunger.move(destination)

        description = "Dispensing {0}uL at {1}".format(
            volume,
            (humanize_location(location) if location else '<In Place>')
        )
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def position_for_aspirate(self, location=None):

        # first go to the destination
        if location:
            placeable, _ = containers.unpack_location(location)
            self.move_to(placeable.top(), strategy='arc', now=True)

        # setup the plunger above the liquid
        if self.current_volume == 0:
            self.plunger.move(self.positions['bottom'] or 0)

        # then go inside the location
        if location:
            if isinstance(location, Placeable):
                location = location.bottom(1)
            self.move_to(location, strategy='direct', now=True)

    def mix(self, volume, repetitions=1, location=None):
        """
        Mix a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If no `location` is passed, the pipette will mix from it's current position.
        If no `volume` is passed, `mix` will default to it's `max_volume`

        Parameters
        ----------
        volume : int or float
            The number of microliters to mix (Default: self.max_volume)
        repetitions: int
            How many times the pipette should mix (Default: 1)
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the mix.
            Can also be a tuple with first item :any:`Placeable`, second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a')
        >>> p200.set_max_volume(200)

        >>> # mix 50uL in a Well, three times
        >>> p200.mix(50, 3, plate[0])

        >>> # mix three times the pipette's maximum volume in it's current position
        >>> p200.mix(rate=3)
        """
        def _do():
            # plunger movements are handled w/ aspirate/dispense
            # using Command for printing description
            pass

        description = "Mixing {0} times with a volume of {1}ul".format(
            repetitions, str(self.current_volume)
        )
        self.robot.add_command(Command(do=_do, description=description))

        self.aspirate(location=location, volume=volume)
        for i in range(repetitions - 1):
            self.dispense(volume)
            self.aspirate(volume)
        self.dispense(volume)

        return self

    def blow_out(self, location=None):
        """
        Force any remaining liquid to dispense, by moving this pipette's plunger to the calibrated `blow_out` position

        Notes
        -----
        If no `location` is passed, the pipette will blow_out from it's current position.

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the blow_out.
            Can also be a tuple with first item :any:`Placeable`, second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a')
        >>> p200.set_max_volume(200)
        >>> p200.aspirate(50).dispense().blow_out()
        """
        def _do():
            nonlocal location
            if location:
                self.move_to(location, strategy='arc', now=True)
            self.plunger.move(self.positions['blow_out'])
            self.current_volume = 0
        description = "Blow_out at {}".format(
            humanize_location(location) if location else '<In Place>'
        )
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def touch_tip(self, location=None):
        """
        Helper method for touching the tip to the sides of a well, removing left-over droplets

        Notes
        -----
        If no `location` is passed, the pipette will blow_out from it's current position.

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the touch_tip.
            Can also be a tuple with first item :any:`Placeable`, second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a')
        >>> p200.set_max_volume(200)
        >>> p200.aspirate(50, plate[0])
        >>> p200.dispense(plate[1])
        >>> p200.touch_tip()
        """
        def _do():
            nonlocal location
            if location:
                self.move_to(location, strategy='arc', now=True)
            else:
                location = self.placeables[-1]

            self.move_to(
                (location, location.from_center(x=1, y=0, z=1)),
                strategy='direct',
                now=True)
            self.move_to(
                (location, location.from_center(x=-1, y=0, z=1)),
                strategy='direct',
                now=True)
            self.move_to(
                (location, location.from_center(x=0, y=1, z=1)),
                strategy='direct',
                now=True)
            self.move_to(
                (location, location.from_center(x=0, y=-1, z=1)),
                strategy='direct',
                now=True)

        description = 'Touching tip'
        self.robot.add_command(Command(do=_do, description=description))

        return self

    def return_tip(self):
        """
        Drop the pipette's current tip to it's originating tip rack

        Notes
        -----
        This method requires one or more tip-rack :any:`Container` to be in this Pipette's `tip_racks` list (see :any:`Pipette`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> p200 = instruments.Pipette(axis='a', tip_racks=[tiprack])
        >>> p200.pick_up_tip()
        >>> p200.aspirate(50, plate[0])
        >>> p200.dispense(plate[1])
        >>> p200.return_tip()
        """
        def _do():
            if not self.current_tip_home_well:
                self.robot.add_warning('Pipette has no tip to return')
                return

            self.drop_tip(self.current_tip_home_well)

        description = "Returning tip"
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def pick_up_tip(self, location=None):
        """
        Pick up a tip for the Pipette to run liquid-handling commands with

        Notes
        -----
        A tip can be manually set by passing a `location`. If no location is passed, the Pipette will pick up the next available tip in it's `tip_racks` list (see :any:`Pipette`)

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the pick_up_tip.
            Can also be a tuple with first item :any:`Placeable`, second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> p200 = instruments.Pipette(axis='a', tip_racks=[tiprack])
        >>> p200.pick_up_tip(tiprack[0])
        >>> p200.return_tip()
        >>> p200.pick_up_tip()    # will default to tiprack[1]
        >>> p200.return_tip()
        """
        def _do():
            nonlocal location

            if not location:
                if self.has_tip_rack():
                    # TODO: raise warning/exception if looped back to first tip
                    location = next(self.tip_rack_iter)
                else:
                    self.robot.add_warning(
                        'pick_up_tip called with no reference to a tip')

            if location:
                placeable, _ = containers.unpack_location(location)
                self.move_to(placeable.bottom(), strategy='arc', now=True)

            self.current_tip_home_well = location

            # TODO: actual plunge depth for picking up a tip
            # varies based on the tip
            # right now it's accounted for via plunge depth
            tip_plunge = 6

            # Dip into tip and pull it up
            for _ in range(3):
                self.robot.move_head(z=-tip_plunge, mode='relative')
                self.robot.move_head(z=tip_plunge, mode='relative')

        description = "Picking up tip from {0}".format(
            (humanize_location(location) if location else '<In Place>')
        )
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def drop_tip(self, location=None):
        """
        Drop the pipette's current tip

        Notes
        -----
        If no location is passed, the pipette defaults to its `trash_container` (see :any:`Pipette`)

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the drop_tip.
            Can also be a tuple with first item :any:`Placeable`, second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> trash = containers.load('point', 'A1')
        >>> p200 = instruments.Pipette(axis='a', trash_container=trash)
        >>> p200.pick_up_tip(tiprack[0])
        >>> p200.drop_tip()  # drops the tip in the trash
        >>> p200.pick_up_tip(tiprack[1])
        >>> p200.drop_tip(tiprack[1])  # drops the tip back at its tip rack
        """
        def _do():
            nonlocal location
            if not location and self.trash_container:
                location = self.trash_container

            if location:
                placeable, _ = containers.unpack_location(location)
                self.move_to(placeable.bottom(), strategy='arc', now=True)

            self.plunger.move(self.positions['drop_tip'])
            self.plunger.home()
            self.current_volume = 0

        description = "Drop_tip at {}".format(
            (humanize_location(location) if location else '<In Place>')
        )
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def home(self):
        """
        Home the pipette's plunger axis during a protocol run

        Notes
        -----
        `Pipette.home()` enqueues to `Robot` commands (see :any:`run` and :any:`simulate`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> p200 = instruments.Pipette(axis='a')
        >>> p200.home()
        """
        def _do():
            self.plunger.home()
            self.current_volume = 0

        description = "Homing pipette plunger on axis {}".format(self.axis)
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def transfer(self, volume, source, destination=None):
        """
        transfer
        """
        if not isinstance(volume, (int, float, complex)):
            if volume and not destination:
                destination = source
                source = volume
            volume = None

        self.aspirate(volume, source)
        self.dispense(volume, destination)
        return self

    def distribute(self, volume, source, destinations):
        """
        distribute
        """
        volume = volume or self.max_volume
        fractional_volume = volume / len(destinations)

        self.aspirate(volume, source)
        for well in destinations:
            self.dispense(fractional_volume, well)

        return self

    def consolidate(self, volume, sources, destination):
        """
        consolidate
        """
        volume = volume or self.max_volume
        fractional_volume = (volume) / len(sources)

        for well in sources:
            self.aspirate(fractional_volume, well)

        self.dispense(volume, destination)
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
        >>> p200.calibrate('top')  # 'top' is now saved to position 10
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
        Save the position of a :any:`Placeable` (usually a :any:`Container`) relative to this pipette.

        Notes
        -----
        The saved position will be persisted under this pipette's `name` and `axis` (see :any:`Pipette`)

        Parameters
        ----------
        location : tuple(:any:`Placeable`, :any:`Vector`)
            A tuple with first item :any:`Placeable`, second item relative :any:`Vector`

        current : :any:`Vector`
            The coordinate to save this container to (Default: robot current position)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------
        ..
        >>> tiprack = containers.load('tiprack-200ul', 'A1')
        >>> p200 = instruments.Pipette(axis='a')
        >>> robot.move_head(Vector(100, 100, 100))
        >>> relative_vector = tiprack[0].from_center(x=0, y=0, z=-1, reference=tiprack)
        >>> p200.calibrate_position((tiprack, relative_vector))
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
        Set this pipette's maximum volume, equal to the number of microliters drawn when aspirating with the plunger's full range
        """
        self.max_volume = max_volume

        if self.max_volume <= self.min_volume:
            raise RuntimeError(
                'Pipette max volume is less than '
                'min volume ({0} < {1})'.format(
                    self.max_volume, self.min_volume))

        self.update_calibrations()

        return self

    def plunge_distance(self, volume):
        """Calculate axis position for a given liquid volume.

        Translates the passed liquid volume to absolute coordinates
        on the axis associated with this pipette.

        Calibration of the top and bottom positions are necessary for
        these calculations to work.
        """
        percent = self._volume_percentage(volume)
        top = self.positions['top'] or 0
        bottom = self.positions['bottom'] or 0
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
        if volume < self.min_volume:
            self.robot.add_warning(
                "{0}µl is less than pipette's min_volume ({1}ul).".format(
                    volume, self.min_volume))

        return volume / self.max_volume

    def delay(self, seconds):
        """
        delay
        """
        def _do():
            self.plunger.wait(seconds)

        description = "Delaying {} seconds".format(seconds)
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def set_speed(self, **kwargs):
        """
        set_speed
        """
        keys = {'head', 'aspirate', 'dispense'} & kwargs.keys()
        for key in keys:
            self.speeds[key] = kwargs.get(key)

        return self
