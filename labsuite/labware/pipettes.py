class Pipette():

    channels = 1
    size = 'P10'
    min_vol = 0
    max_vol = 10

    _top = None  # Top of the plunger.
    _blowout = None  # Bottom of the plunger (all liquid expelled).
    _droptip = None  # Point where the screw on the axis hits the droptip.

    _axis = 'A'

    _points = [
        {'f1': 1, 'f2': 1},
        {'f1': 2000, 'f2': 2000}
    ]

    _tip_plunge = 6  # Distance from calibrated top of tiprack to pickup tip.

    def calibrate(self, top=None, blowout=None, droptip=None, axis='A'):
        """Set calibration values for the pipette plunger.

        This can be called multiple times as the user sets each value,
        or you can set them all at once.

        Parameters
        ----------

        top : int
           Touching but not engaging the plunger.

        blowout : int
            Plunger has been pushed down enough to expell all liquids.

        droptip : int
            This position that causes the tip to be released from the
            pipette.

        axis : char
            A letter representing the axis of the motor control driver
            connected to this pipette.

        """
        if top:
            self._top = top
        if blowout:
            self._blowout = blowout
        if droptip:
            self._droptip = drop
        if axis:
            self._axis = axis

    def plunge_depth(self, volume):
        """Calculate axis position for a given liquid volume.

        Translates the passed liquid volume to absolute coordinates
        on the axis associated with this pipette.

        Calibration of the top and blowout positions are necessary for
        these calculations to work.
        """
        percent = self._volume_percentage(volume)
        travel = self._blowout - self._top
        distance = travel * percent
        return self._top + distance

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


class Pipette_P2(Pipette):
    size     = 'P2'
    min_vol  =   0.0
    max_vol  =   2


class Pipette_P10(Pipette):
    size     = 'P10'
    min_vol  =    0.5
    max_vol  =   10


class Pipette_P20(Pipette):
    size     = 'P20'
    min_vol  =    2
    max_vol  =   20


class Pipette_P200(Pipette):
    size     = 'P200'
    min_vol  =   20
    max_vol  =  200


class Pipette_P1000(Pipette):
    size     = 'P1000'
    min_vol  =  200
    max_vol  = 1000
