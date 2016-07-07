from labsuite.protocol.handlers.interface import ProtocolHandler
from labsuite.labware import deck, pipettes


class ContextHandler(ProtocolHandler):

    """
    ContextHandler runs all the stuff on the virtual robot in the background
    and makes relevant data available.
    """

    _deck = None
    _instruments = None  # Axis as keys; Pipette object as vals.

    def setup(self):
        self._deck = deck.Deck()
        self._instruments = {}

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

    def calibrate_instrument(self, axis, top=None, blowout=None, droptip=None):
        kwargs = {'top': top, 'blowout': blowout, 'droptip': droptip,
                  'axis': axis}
        self.get_instrument(axis=axis).calibrate(**kwargs)

    def add_container(self, slot, container_name):
        self._deck.add_module(slot, container_name)

    def calibrate(self, slot, x=None, y=None, z=None):
        self._deck.calibrate(**{slot: {'x': x, 'y': y, 'z': z}})

    def get_coordinates(self, position):
        """ Returns the calibrated coordinates for a position. """
        slot, well = position
        return self._deck.slot(slot).well(well).coordinates()

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
