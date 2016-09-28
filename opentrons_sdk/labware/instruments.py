from opentrons_sdk.protocol.command import Command
from opentrons_sdk.protocol.robot import Robot


class Pipette(object):
    max_vol = 10

    _top = 0  # Top of the plunger.
    _bottom = 1
    _blowout = 2  # Bottom of the plunger (all liquid expelled).
    _droptip = 3  # Point where the screw on the axis hits the droptip.

    _current_volume = 0

    def __init__(
            self,
            axis,
            channels=1,
            min_vol=0,
            trash_container=None,
            tip_racks=None):

        self.axis = axis
        self.channels = channels
        self.min_vol = min_vol
        self.trash_container = trash_container
        self.tip_racks = tip_racks
        self.motor = None

        self.robot = Robot.get_instance()
        self.robot.add_instrument(self.axis, self)
        self.motor = self.robot.get_motor(self.axis)

    def aspirate(self, volume, address=None):
        if address:
            self.robot.move_to(address)

        # depending on current volume,
        # move the plunger so it picks up the supplied volume

        # if current_volume=0, move plunger all the way down first
        # else, move relatively from current position

        empty_pipette = False
        distance = self.plunge_distance(volume) * -1
        if self._current_volume == 0:
            empty_pipette = True

        def _do():
            if empty_pipette:
                self.motor.move(self._bottom)
            self.motor.move(distance, absolute=False)
            self.motor.wait_for_arrival()

        description = "Aspirating {0}uL at {1}".format(volume, str(address))
        self.robot.add_command(Command(do=_do, description=description))

        self._current_volume += volume

        return self

    def dispense(self, volume, address=None):
        return self

    def blowout(self):
        self._current_volume = 0
        return self

    def drop_tip(self):
        self._current_volume = 0
        return self

    def calibrate_plunger(self, top=None, bottom=None, blowout=None, droptip=None):
        """Set calibration values for the pipette plunger.

        This can be called multiple times as the user sets each value,
        or you can set them all at once.

        Parameters
        ----------

        top : int
           Touching but not engaging the plunger.

        bottom: int
            Soft-stop

        blowout : int
            Plunger has been pushed down enough to expell all liquids.

        droptip : int
            This position that causes the tip to be released from the
            pipette.

        axis : char
            A letter representing the axis of the motor control driver
            connected to this pipette.

        """
        if top is not None:
            self._top = top
        if bottom is not None:
            self._bottom = bottom
        if blowout is not None:
            self._blowout = blowout
        if droptip is not None:
            self._droptip = droptip

    def set_max_volume(self, max_volume):
        self.max_vol = max_volume

    def plunge_distance(self, volume):
        """Calculate axis position for a given liquid volume.

        Translates the passed liquid volume to absolute coordinates
        on the axis associated with this pipette.

        Calibration of the top and bottom positions are necessary for
        these calculations to work.
        """
        if self._bottom is None or self._top is None:
            raise ValueError(
                "Pipette {} not calibrated.".format(self.axis)
            )
        percent = self._volume_percentage(volume)
        travel = self._bottom - self._top
        return travel * percent

    def _volume_percentage(self, volume):
        """Returns the plunger percentage for a given volume.

        We use this to calculate what actual position the plunger axis
        needs to be at in order to achieve the correct volume of liquid.
        """
        if volume < 0:
            raise IndexError("Volume must be a positive number.")
        if volume > self.max_vol:
            raise IndexError("{}µl exceeds maximum volume.".format(volume))
        if volume < self.min_vol:
            raise IndexError("{}µl is too small.".format(volume))

        return volume / self.max_vol

    def supports_volume(self, volume):
        return self.min_vol <= volume <= self.max_vol

    @property
    def name(self):
        return self.size.lower()
