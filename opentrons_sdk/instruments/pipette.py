from opentrons_sdk import containers
from opentrons_sdk.robot.command import Command

from opentrons_sdk.robot.robot import Robot
from opentrons_sdk.containers.calibrator import Calibrator
from opentrons_sdk.containers.placeable import Placeable, humanize_location
from opentrons_sdk.util.vector import Vector


class Pipette(object):

    def __init__(
            self,
            axis,
            name=None,
            channels=1,
            min_volume=0,
            trash_container=None,
            tip_racks=None,
            aspirate_speed=300,
            dispense_speed=500):

        self.positions = {
            'top': 0,
            'bottom': 10,
            'drop_tip': 12,
            'blow_out': 13
        }

        self.speeds = {
            'aspirate': aspirate_speed,
            'dispense': dispense_speed
        }

        self.axis = axis
        self.channels = channels

        if not name:
            name = axis
        self.name = name

        self.min_volume = min_volume
        self.max_volume = min_volume + 1
        self.current_volume = 0

        self.trash_container = trash_container
        self.tip_racks = tip_racks

        self.robot = Robot.get_instance()
        self.robot.add_instrument(self.axis, self)
        self.plunger = self.robot.get_motor(self.axis)

        self.calibration_data = {}
        self.placeables = []

        self.calibrator = Calibrator(self.robot._deck, self.calibration_data)

    def reset(self):
        self.placeables = []
        self.current_volume = 0

    def associate_placeable(self, location):
        placeable, _ = containers.unpack_location(location)
        if not self.placeables or (placeable != self.placeables[-1]):
            self.placeables.append(placeable)

    def move_to(self, location, create_path=True, now=False):
        if location:
            self.associate_placeable(location)
            self.robot.move_to(
                location,
                instrument=self,
                create_path=create_path,
                now=now)

        return self

    def move_to_top(self, location, create_path=True, now=False):
        placeable, _ = containers.unpack_location(location)
        top_location = (placeable, placeable.from_center(x=0, y=0, z=1))
        return self.move_to(top_location, create_path)

    def move_to_bottom(self, location, create_path=True, now=False):
        placeable, _ = containers.unpack_location(location)
        bottom_location = (placeable, placeable.from_center(x=0, y=0, z=-1))
        return self.move_to(bottom_location, create_path)

    def go_to(self, location, now=False):
        return self.move_to(location, create_path=False, now=False)

    def go_to_top(self, location, now=False):
        return self.move_to_top(location, create_path=False, now=False)

    def go_to_bottom(self, location, now=False):
        return self.move_to_bottom(location, create_path=False, now=False)

    def aspirate(self, volume=None, location=None, rate=1.0):
        def _do_aspirate():
            nonlocal volume
            nonlocal location
            if not isinstance(volume, (int, float, complex)):
                if volume and not location:
                    location = volume
                volume = self.max_volume - self.current_volume

            if self.current_volume + volume > self.max_volume:
                raise RuntimeWarning(
                    'Pipette cannot hold volume {}'
                    .format(self.current_volume + volume)
                )

            self.position_for_aspirate(location)

            self.current_volume += volume
            distance, _ = self.plunge_distance(self.current_volume)
            destination = self.positions['bottom'] - distance

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
                self.move_to(location, now=True)

            if volume:
                self.current_volume -= volume
                distance, _ = self.plunge_distance(self.current_volume)
                destination = self.positions['bottom'] - distance

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
        if location:
            self.move_to_top(location, now=True)

        if self.current_volume == 0:
            self.plunger.move(self.positions['bottom'])

        if location:
            if isinstance(location, Placeable):
                # go all the way to the bottom
                bottom = location.from_center(x=0, y=0, z=-1)
                # go up 1mm to give space to aspirate
                bottom += Vector(0, 0, 1)
                location = (location, bottom)
            self.go_to(location, now=True)

    def transfer(self, source, destination, volume=None):
        volume = volume or self.max_volume
        self.aspirate(volume, source)
        self.dispense(volume, destination)
        return self

    def distribute(self, source, destinations, volume=None, extra_pull=0):
        volume = volume or self.max_volume
        fractional_volume = volume / len(destinations)

        self.aspirate(volume + extra_pull, source)
        for well in destinations:
            self.dispense(fractional_volume, well)

        return self

    def consolidate(self, destination, sources, volume=None):
        volume = volume or self.max_volume
        fractional_volume = (volume) / len(sources)

        for well in sources:
            self.aspirate(fractional_volume, well)

        self.dispense(volume, destination)
        return self

    def mix(self, volume=None, location=None, repetitions=3):
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
        def _do():
            nonlocal location
            if location:
                self.move_to(location, now=True)
            self.plunger.move(self.positions['blow_out'])
            self.current_volume = 0
        description = "Blow_out at {}".format(
            humanize_location(location) if location else '<In Place>'
        )
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def touch_tip(self, location=None):
        def _do():
            nonlocal location
            if location:
                self.move_to(location, now=True)
            else:
                location = self.placeables[-1]

            self.go_to(
                (location, location.from_center(x=1, y=0, z=1)), now=True)
            self.go_to(
                (location, location.from_center(x=-1, y=0, z=1)), now=True)
            self.go_to(
                (location, location.from_center(x=0, y=1, z=1)), now=True)
            self.go_to(
                (location, location.from_center(x=0, y=-1, z=1)), now=True)

        description = 'Touching tip'
        self.robot.add_command(Command(do=_do, description=description))

        return self

    def pick_up_tip(self, location=None):

        def _do():
            nonlocal location
            if location:
                self.go_to_bottom(location, now=True)

            # TODO: actual plunge depth for picking up a tip
            # varies based on the tip
            # right now it's accounted for via plunge depth
            # TODO: Need to talk about containers z positioning
            tip_plunge = 6

            # Dip into tip and pull it up
            for _ in range(3):
                self.robot.move_head(z=-tip_plunge, mode='relative')
                self.robot.move_head(z=tip_plunge, mode='relative')

            self.robot.home('z')
        description = "Picking up tip from {0}".format(
            (humanize_location(location) if location else '<In Place>')
        )
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def drop_tip(self, location=None):
        def _do():
            nonlocal location
            if location:
                self.go_to_bottom(location, now=True)

            self.plunger.move(self.positions['drop_tip'])
            self.plunger.home()
            self.current_volume = 0

        description = "Drop_tip at {}".format(
            (humanize_location(location) if location else '<In Place>')
        )
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def calibrate(self, position):
        current_position = self.robot._driver.get_plunger_position()
        current_position = current_position['current'][self.axis]
        kwargs = {}
        kwargs[position] = current_position
        self.calibrate_plunger(**kwargs)

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

        return self

    def calibrate_position(self, location, current=None):
        if not current:
            current = self.robot._driver.get_head_position()['current']

        self.calibration_data = self.calibrator.calibrate(
            self.calibration_data,
            location,
            current)
        return self

    def set_max_volume(self, max_volume):
        self.max_volume = max_volume
        return self

    def plunge_distance(self, volume):
        """Calculate axis position for a given liquid volume.

        Translates the passed liquid volume to absolute coordinates
        on the axis associated with this pipette.

        Calibration of the top and bottom positions are necessary for
        these calculations to work.
        """
        if self.positions['bottom'] is None or self.positions['top'] is None:
            raise ValueError(
                "Pipette {} not calibrated.".format(self.axis)
            )
        (percent, warnings) = self._volume_percentage(volume)
        travel = self.positions['bottom'] - self.positions['top']
        return (travel * percent, warnings)

    def _volume_percentage(self, volume):
        """Returns the plunger percentage for a given volume.

        We use this to calculate what actual position the plunger axis
        needs to be at in order to achieve the correct volume of liquid.
        """
        warning_msg = None
        if volume < 0:
            warning_msg = "Volume must be a positive number."
        if volume > self.max_volume:
            warning_msg = "{}µl exceeds maximum volume.".format(volume)
        if volume < self.min_volume:
            warning_msg = "{}µl is too small.".format(volume)

        return (volume / self.max_volume, warning_msg)

    def delay(self, seconds):
        def _do():
            self.plunger.wait(seconds)

        description = "Delaying {} seconds".format(seconds)
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def set_speed(self, **kwargs):
        keys = {'head', 'aspirate', 'dispense'} & kwargs.keys()
        for key in keys:
            self.speeds[key] = kwargs.get(key)

        return self
