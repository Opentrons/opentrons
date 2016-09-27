from opentrons_sdk.protocol import command


class Pipette(object):
    max_vol = 10

    _top = 0  # Top of the plunger.
    _bottom = 1
    _blowout = 2  # Bottom of the plunger (all liquid expelled).
    _droptip = 3  # Point where the screw on the axis hits the droptip.


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

        from opentrons_sdk.protocol.robot import Robot
        self.robot = Robot.get_instance()
        self.robot.add_instrument(self.axis, self)
        self.motor = self.robot.get_motor_driver(self.axis)

    def aspirate(self, volume, address=None):
        #def _aspirate():
        if address:
            self.robot.move_to(address)

        # use volume here
        self.motor.move(self.bottom)
        self.motor.move(self.top)
        #self.robot.add_command(command.Command(do=_aspirate))

    def calibrate(self, top=None, bottom=None, blowout=None, droptip=None, max_volume=None):
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
        if max_volume:
            self.max_vol = max_volume

    def plunge_depth(self, volume):
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
        distance = travel * percent
        return self._bottom - distance

    def _volume_percentage(self, volume):
        """Returns the plunger percentage for a given volume.

        We use this to calculate what actual position the plunger axis
        needs to be at in order to achieve the correct volume of liquid.
        """
        if volume < 0:
            raise IndexError("Volume must be a positive number.")
        if volume > self.max_vol:
            raise IndexError("{}µl exceeds maximum volume.".format(volume))

        p1 = None
        p2 = None

        # Find the correct point.
        points = sorted(self._points, key=lambda a: a['f1'])
        for i in range(len(points) - 1):
            if volume >= points[i]['f1'] and volume <= points[i + 1]['f1']:
                p1 = points[i]
                p2 = points[i + 1]
                break

        if not (p1 and p2):
            raise IndexError(
                "Point data not found for volume {}.".format(volume)
            )

        # Calculate the volume based on this point (piecewise linear).
        diff = p2['f1'] - p1['f1']
        f1 = (volume - p1['f1']) / diff
        lower = p1['f1'] / p1['f2']
        upper = p2['f1'] / p2['f2']
        scale = ((upper - lower) * f1) + lower

        return volume * scale / self.max_vol

    def supports_volume(self, volume):
        return self.min_vol <= volume <= self.max_vol

    @property
    def top(self):
        return self._top

    @property
    def bottom(self):
        return self._bottom

    @property
    def blowout(self):
        return self._blowout

    @property
    def droptip(self):
        return self._droptip

    @property
    def name(self):
        return self.size.lower()
