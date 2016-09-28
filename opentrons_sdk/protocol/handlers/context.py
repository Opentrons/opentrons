from opentrons_sdk.protocol.handlers import ProtocolHandler
from opentrons_sdk.containers import legacy_containers, placeable


class ContextHandler(ProtocolHandler):

    """
    ContextHandler runs all the stuff on the virtual robot in the background
    and makes relevant data available.
    """

    _deck = None
    _instruments = None  # Axis as keys; Pipette object as vals.

    # Calibration is organized by axis.
    #
    # {
    #   'a': {'_axis': {top, bottom, blowout}, (0,0): {x, y, top, bottom}}
    # }
    _calibration = None

    def setup(self):
        self._deck = placeable.Deck()
        self.setup_deck()

        self._instruments = {}
        self._calibration = {}


    def get_deck_slot_types(self):
        return 'acrylic_slots'

    def get_slot_offsets(self):
        """
        col_offset
        - from bottom left corner of A to bottom corner of B

        row_offset
        - from bottom left corner of 1 to bottom corner of 2

        TODO: figure out actual X and Y offsets (from origin)
        """
        SLOT_OFFSETS = {
            '3d_printed_slots': {
                'x_offset': 10,
                'y_offset': 10,
                'col_offset': 91,
                'row_offset': 134.5
            },
            'acrylic_slots': {
                'x_offset': 10,
                'y_offset': 10,
                'col_offset': 96.25,
                'row_offset': 133.3
            }

        }
        slot_settings = SLOT_OFFSETS.get(self.get_deck_slot_types())
        row_offset = slot_settings.get('row_offset')
        col_offset = slot_settings.get('col_offset')
        x_offset = slot_settings.get('x_offset')
        y_offset = slot_settings.get('y_offset')
        return (row_offset, col_offset, x_offset, y_offset)

    def get_max_robot_rows(self):
        # TODO: dynamically figure out robot rows
        return 3

    def setup_deck(self):
        robot_rows = self.get_max_robot_rows()
        row_offset, col_offset, x_offset, y_offset = self.get_slot_offsets()

        for col_index, col in enumerate('EDCBA'):
            for row_index, row in enumerate(range(robot_rows, 0, -1)):
                slot = placeable.Slot()
                slot_coordinates = (
                    (row_offset * row_index) + x_offset,
                    (col_offset * col_index) + y_offset,
                    0  # TODO: should z always be zero?
                )
                slot_name = "{}{}".format(col, row)
                self._deck.add(slot, slot_name, (slot_coordinates))

    def get_deck(self):
        return self._deck

    def add_instrument(self, axis, instrument=None):
        axis = axis.upper()
        # We only have pipettes now so this is pipette-specific.
        self._instruments[axis] = instrument
        self._instruments[axis]._axis = axis

    def get_instruments(self):
        """
        :returns: sorted list of (axis, instrument)
        """
        return sorted(self._instruments.items())

    def add_container(self, slot, container_name):
        container = legacy_containers.get_legacy_container(container_name)
        self._deck[slot].add(container, container_name)
        return container

    def get_containers(self):
        return self._deck.containers()
