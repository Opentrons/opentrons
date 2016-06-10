"""
This module is responsbible for taking CSV files (generated from Excel
spreadsheets) and allowing easy access to specific plate definitions and the
string-based contents of well positions on those plates.

So instead of doing all the manual calculation and looking for cell K42
in the spreadsheet because you know it corresponds to the well you're
looking for, you can say:

    plate_map.get_plate('K2').get_well('H12')

Where 'K2' is the spreadsheet cell containing the plate label and
'H12' is the specific well in that plate.

This provides us with a simple, standard format for defining platemaps
for particular protocols, such as FusX.
"""

import csv
from labsuite.labware.grid import normalize_position, humanize_position


class PlateMap():

    _sheet = None  # Sheet
    _plates = None  # {}: keys are start tuples and vals are Plate objects.
    _labels = None  # {}: keys are plate labels, vals are start tuples.
    _rotated = None  # Default for entire platemap, can be overriden.

    def __init__(self, csv_file, rotated=None, **kwargs):
        """
        Loads the provided CSV file location and converts it to a PlateMap.

        Optional kwargs can be passed as named references to the starting
        cells of each plate.

        For example:

            plate = PlateMap('file.csv', my_plate='A5')
            plate.get_plate('my_plate')

        """
        self._plates = {}
        self._labels = kwargs
        self._sheet = Sheet(csv_file)
        self._rotated = rotated

    def get_plate(self, label_cell, **kwargs):
        """
        Takes the 'label cell' of a plate definition and returns a Plate
        object set to that particular starting position within the CSV.

        Then you can use Plate to get the string contents of particular
        wells on that plate within the definition file.

        For example:

            plate_map.get_plate('K2').get_well('H12')

        Where 'K2' is the spreadsheet cell containing the plate label and
        'H12' is the specific well in that plate.
        """

        # If the label_cell is in labels, use that position instead of
        # converting it to a coordinate tuple.
        #
        # Only works for 96 well plates for now.
        if label_cell in self._labels:
            label_cell = self._labels[label_cell]

        # Pass default orientation option.
        if 'rotated' not in kwargs and self._rotated is not None:
            kwargs['rotated'] = self._rotated

        col, row = normalize_position(label_cell)
        start = (col, row)
        if start not in self._plates:
            self._plates[start] = Plate(start, self._sheet, **kwargs)
        return self._plates[start]

    def add_plate(self, label, start, **kwargs):
        """
        Allows adding plates by reference along with config vars.
        """
        start = normalize_position(start)
        self._labels[label] = start
        self._plates[start] = self.get_plate(start, **kwargs)


class Sheet():

    _data = None  # []

    def __init__(self, csv_file):
        self._data = list(csv.reader(open(csv_file)))

    def get_cell(self, position):
        col, row = normalize_position(position)
        return self._data[row][col]


class Plate():

    _start = (None, None)  # Tuple (col, row)
    _sheet = None  # Sheet

    _rows = 0
    _cols = 0

    _rotated = False  # If True, it's in "portrait" mode.

    def __init__(self, start_tuple, plate_map, rows=12, cols=8,
                 rotated=False):
        self._sheet = plate_map
        self._start = start_tuple
        self._rows = rows
        self._cols = cols
        self._rotated = rotated

    def get_well(self, well):
        """
        Returns the contents of the cell of the CSV range attached to this
        particular plate mapping to the given well coordinates.

        For example, well A1 might actually be B36 in the CSV.

        Contents are simply whatever string is stored in the cell of that
        particular location in the Excel-based plate mapping.
        """
        col, row = normalize_position(well)
        scol, srow = self._start
        if (self._rotated):
            cell_col = scol + col + 1
            cell_row = srow + self._rows - row
        else:
            cell_row = srow + col + 1
            cell_col = scol + row + 1

        return self._sheet.get_cell((cell_col, cell_row))

    @property
    def label(self):
        return self._sheet.get_cell(self._start)

    @property
    def map(self):
        """
        Uses the coordinates of label cell to list plate contents by well.
        """
        plate_map = {}
        for col in range(0, self._cols):
            for row in range(0, self._rows):
                pos = (col, row)
                loc = humanize_position(pos)
                data = self.get_well(pos)
                if data:
                    plate_map[loc] = data
        return plate_map

    @property
    def value_map(self):
        """
        A map of well positions and contents, indexed by the contents with
        the key as a value. Just a reverse of the normal map.
        """
        return dict((v, k) for k, v in self.map.items())

    def find_well(self, value):
        """
        Returns the well position on this plate matching a particular value.
        """
        for pos in self.map:
            if self.map[pos].strip() == value:
                return humanize_position(pos)
