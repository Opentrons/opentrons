from labsuite.protocol.handlers import ProtocolHandler
from labsuite.labware import deck, pipettes


class ContextHandler(ProtocolHandler):

    """
    ContextHandler runs all the stuff on the virtual robot in the background
    and makes relevant data available.
    """

    _deck = None
    _instruments = None  # Axis as keys; Pipette object as vals.
    _calibration = None

    def setup(self):
        self._deck = deck.Deck()
        self._instruments = {}
        self._calibration = {}

    def add_instrument(self, axis, name):
        # We only have pipettes now so this is pipette-specific.
        self._instruments[axis] = pipettes.load_instrument(name)

    def get_instrument(self, axis=None, volume=None):
        if axis:
            if axis not in self._instruments:
                raise KeyError(
                    "No instrument assigned to {} axis.".format(axis)
                )
            else:
                return self._instruments[axis]
        if volume:
            for k, i in self._instruments.items():
                if i.supports_volume(volume):
                    return i

        raise KeyError(
            "No instrument found to support a volume of {}µl."
            .format(volume)
        )

    def add_container(self, slot, container_name):
        self._deck.add_module(slot, container_name)

    def normalize_axis(self, axis):
        """
        Returns an axis by axis, after normalizing axis input.

        If axis is none, the first instrument axis if only one instrument is
        attached to the protocol.

        If no axis is provided, or if the axis isn't valid, it raises a
        KeyError.
        """
        if axis is None:
            ks = list(self._instruments)
            if len(ks) is 1:
                return ks[0]
            else:
                raise KeyError("Instrument axis must be specified.")
        axis = axis.upper()
        if axis not in self._instruments:
            raise KeyError("Can't find instrument for axis {}.".format(axis))
        return axis

    def get_axis_calibration(self, axis=None):
        """
        Initializes and returns calibration for a particular axis.
        """
        axis = self.normalize_axis(axis)
        if axis not in self._calibration:
            self._calibration[axis] = {}
        return self._calibration[axis]

    def calibrate(self, pos, axis=None, x=None, y=None, z=None, top=None, bottom=None):
        axis = self.normalize_axis(axis)
        cal = self.get_axis_calibration(axis)
        if pos not in cal:
            cal[pos] = {}
        pos_cal = cal[pos]
        # Roll in all the new calibration changes.
        if x is not None:
            pos_cal['x'] = x
        if y is not None:
            pos_cal['y'] = y
        if z is not None:
            pos_cal['z'] = z
        if top is not None:
            pos_cal['top'] = top
        if bottom is not None:
            pos_cal['bottom'] = bottom

    def calibrate_instrument(self, axis, top=None, blowout=None, droptip=None):
        cal = self.get_axis_calibration(axis)
        if '_instrument' not in cal:
            cal['_instrument'] = {}
        a_cal = cal['_instrument']
        # Roll in all the new calibration changes.
        if top is not None:
            a_cal['top'] = top
        if blowout is not None:
            a_cal['blowout'] = blowout
        if droptip is not None:
            a_cal['droptip'] = droptip
        self.get_instrument(axis=axis).calibrate(**a_cal)

    def get_coordinates(self, position, axis=None):
        """ Returns the calibrated coordinates for a position. """
        cal = self.get_axis_calibration(axis)
        slot, well = position
        output = {}
        # Calibration for A1 in this container (x, y, top, bottom).
        slot_cal = cal.get((slot), {})
        ({'top': 0, 'bottom': 0, 'x': 0, 'y': 0}).update(slot_cal)
        # Default offset on x, y calculated from container definition.
        ox, oy = self._deck.slot(slot).well(well).coordinates()
        # x, y, top bottom
        well_cal = cal.get((slot, well), {})
        # Use calculated offsets if no custom well calibration provided.
        if 'x' not in well_cal:
            output['x'] = slot_cal['x'] + ox
        if 'y' not in well_cal:
            output['y'] = slot_cal['y'] + oy
        # Merge slot and well calibration
        if 'top' not in well_cal:
            output['top'] = slot_cal['top']
        if 'bottom' not in well_cal:
            output['bottom'] = slot_cal['bottom']
        return output

    def get_volume(self, well):
        slot, well = self._protocol._normalize_address(well)
        return self._deck.slot(slot).well(well).get_volume()

    def get_tip_coordinates(self, size):
        """
        Returns the coordinates of the next available pipette tip for that
        particular size (ie, p10).
        """
        pass

    def transfer(self, start=None, end=None, volume=None, **kwargs):
        start_slot, start_well = start
        end_slot, end_well = end
        start = self._deck.slot(start_slot).well(start_well)
        end = self._deck.slot(end_slot).well(end_well)
        start.transfer(volume, end)

    def transfer_group(self, *args, **kwargs):
        pass

    def distribute(self, *args, **kwargs):
        pass

    def mix(self, *args, **kwargs):
        pass

    def consolidate(self, *args, **kwargs):
        pass
