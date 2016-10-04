from opentrons_sdk.robot.command import Command
from opentrons_sdk.robot.robot import Robot
from opentrons_sdk.containers.calibrator import Calibrator


class Pipette(object):

    def __init__(
            self,
            axis,
            channels=1,
            min_volume=0,
            trash_container=None,
            tip_racks=None,
            speed=300):

        self.positions = {
            'top': None,
            'bottom': None,
            'blow_out': None,
            'drop_tip': None
        }

        self.axis = axis
        self.channels = channels

        self.min_volume = min_volume
        self.max_volume = min_volume + 1
        self.current_volume = 0

        self.trash_container = trash_container
        self.tip_racks = tip_racks

        self.robot = Robot.get_instance()
        self.robot.add_instrument(self.axis, self)
        self.motor = self.robot.get_motor(self.axis)

        self.calibration_data = {}
        self.placeables = []

        self.calibrator = Calibrator()

        self.set_speed(speed)

    def go_to(self, location):
        if location:
            self.robot.move_to(location, instrument=self, create_path=False)

        return self

    def aspirate(self, volume=None, location=None):

        if not volume:
            volume = self.max_volume - self.current_volume

        if self.current_volume + volume > self.max_volume:
            raise RuntimeWarning(
                'Pipette cannot hold volume {}'
                .format(self.current_volume + volume)
            )

        if location:
            self.robot.move_to(location, self)

        empty_pipette = False
        distance = self.plunge_distance(volume) * -1
        if self.current_volume == 0:
            empty_pipette = True

        def _do():
            if empty_pipette:
                self.motor.move(self.positions['bottom'])
            self.motor.move(distance, absolute=False)
            self.motor.wait_for_arrival()

        description = "Aspirating {0}uL at {1}".format(volume, str(location))
        self.robot.add_command(Command(do=_do, description=description))
        self.current_volume += volume

        return self

    def dispense(self, volume=None, location=None):

        if not volume:
            volume = self.max_volume - self.current_volume

        if self.current_volume - volume < 0:
            raise RuntimeWarning(
                'Pipette cannot dispense {}ul'.
                format(self.current_volume - volume)
            )

        if location:
            self.robot.move_to(location, self)

        distance = self.plunge_distance(volume)

        def _do():
            self.motor.move(distance, absolute=False)
            self.motor.wait_for_arrival()

        description = "Dispensing {0}uL at {1}".format(volume, str(location))
        self.robot.add_command(Command(do=_do, description=description))
        self.current_volume -= volume

        return self

    def blow_out(self, location=None):
        if location:
            self.robot.move_to(location, self)

        def _do():
            self.motor.move(self.positions['blow_out'])
            self.motor.wait_for_arrival()

        description = "Blow_out at {}".format(str(location))
        self.robot.add_command(Command(do=_do, description=description))
        self.current_volume = 0

        return self

    def pick_up_tip(self, location=None):

        if location:
            self.robot.move_to(location, self)

        # TODO: actual plunge depth for picking up a tip
        # varies based on the tip
        # right now it's accounted for via plunge depth
        # TODO: Need to talk about containers z positioning
        tip_plunge = 6

        def _do():
            # Dip into tip and pull it up
            for _ in range(3):
                self.robot.move_head(z=-tip_plunge, absolute=False)
                self.robot.move_head(z=tip_plunge, absolute=False)

            self.motor.wait_for_arrival()
            self.robot.home('z')

        description = "Picking up tip from {0}".format(str(location))
        self.robot.add_command(Command(do=_do, description=description))
        return self

    def drop_tip(self, location=None):
        if location:
            self.robot.move_to(location, self)

        def _do():
            self.motor.move(self.positions['drop_tip'])
            self.motor.home()
            self.motor.wait_for_arrival()

        description = "Drop_tip at {}".format(str(location))
        self.robot.add_command(Command(do=_do, description=description))
        self.current_volume = 0
        return self

    def calibrate(self, position):
        current = self.robot._driver.get_position()['current'][self.axis]
        kwargs = {}
        kwargs[position] = current
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

    def calibrate_position(self, location, current_position=None):
        if not current_position:
            current = self.robot._driver.get_position()['current']
            current_position = (current['x'], current['y'], current['z'])

        self.calibration_data = self.calibrator.calibrate(
            self.calibration_data,
            location,
            current_position)

    def set_max_volume(self, max_volume):
        self.max_volume = max_volume

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
        percent = self._volume_percentage(volume)
        travel = self.positions['bottom'] - self.positions['top']
        return travel * percent

    def _volume_percentage(self, volume):
        """Returns the plunger percentage for a given volume.

        We use this to calculate what actual position the plunger axis
        needs to be at in order to achieve the correct volume of liquid.
        """
        if volume < 0:
            raise IndexError("Volume must be a positive number.")
        if volume > self.max_volume:
            raise IndexError("{}µl exceeds maximum volume.".format(volume))
        if volume < self.min_volume:
            raise IndexError("{}µl is too small.".format(volume))

        return volume / self.max_volume

    def supports_volume(self, volume):
        return self.max_volume <= volume <= self.max_volume

    def delay(self, seconds):
        def _do():
            self.motor.wait(seconds)

        description = "Delaying {} seconds".format(seconds)
        self.robot.add_command(Command(do=_do, description=description))

    def set_speed(self, rate):
        self.speed = rate
        axis = self.axis

        def _do():
            self.motor.speed(rate, axis)

        description = "Setting speed to {}mm/second".format(rate)
        self.robot.add_command(Command(do=_do, description=description))

    def pause(self):
        def _do():
            print("Paused")

        description = "Pausing"
        self.robot.add_command(Command(do=_do, description=description))

    def resume(self):
        self.robot.run()

    @property
    def name(self):
        return self.size.lower()
