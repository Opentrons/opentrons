def normalize_position(position):
    """
    Normalizes a coordinate (A1, B12, etc) into a tuple.

    This allows us to pass 'A1' around and seemingly use it as a key
    without relying on constants.

    >>> normalize_position('A1')
    (0, 0)

    >>> normalize_position('A2')
    (0, 1)

    >>> normalize_position('C4')
    (2, 3)

    >>> normalize_position('c4')
    (2, 3)

    You can also pass through a tuple that's already been normalized and get
    the same tuple back again:

    >>> normalize_position((3, 4))
    (3, 4)

    Useful if you want to dynamically construct tuples at a higher level of
    the application.

    """
    # Check and pass through if we've already normalized the tuple.
    if isinstance(position, tuple) and len(position) is 2:
        if isinstance(position[0], int) and isinstance(position[1], int):
            return position
        raise TypeError("Tuple arguments must be integers.")
    # Normalize a string and return a tuple.
    elif isinstance(position, str):
        col = position[0].upper()
        row = position[1:]
        # Normalize column.
        col_num = ord(col) - ord('A')  # Get the col's alphabetical index.
        if col_num < 0 or col_num > 25:
            raise ValueError("Column must be a letter (A-Z).")
        # Normalize row.
        try:
            row_num = int(row) - 1  # We want it zero-indexed.
        except ValueError:
            raise ValueError("Row must be a number.")
        return (col_num, row_num)
    else:
        raise TypeError("Position must be a str or tuple of ints.")


class GridItem():

    parent   = None
    position = None

    def __init__(self, parent, position):
        self.parent = parent
        self.position = position

    @property
    def coordinates(self):
        return self.parent.get_child_coordinates(self.position)


class GridContainer():

    """
    Change these in child implementations if you want to constrain to an
    actual grid.  Good for making sure people don't try to navigate to
    row 9999 and go way out of bounds.
    """
    rows = 0
    cols = 0

    row_spacing = None
    col_spacing = None

    spacing = 0

    """
    Calibration.
    """
    start_x = 0
    start_y = 0
    start_z = 0

    """
    Margin
    """

    a1_x = 0
    a1_y = 0

    """
    Depth, diameter and volume are expected by the old-style containers, so 
    for legacy reasons we have them here.
    """

    depth = 0
    diameter = 0
    volume = 0

    """
    A dict containing tuples of zero-indexed child coordinates.
    We only initialize them when they're accessed because until then, there's
    no way to mutate their (non-existent) state.
    """
    _children = None  # {}

    child_class = GridItem

    """
    We do some Singleton stuff right now for grid offset calculations.
    """
    _instance = None

    def __init__(self, parent=None, **kwargs):
        self.parent = parent
        self._children = {}

    def calibrate(self, x=None, y=None, z=None, **kwargs):
        """
        Generic calibration mechanism. It would be a good idea to override
        this in child classes just to provide better documentation about
        where the calibration point for a particular module should be.
        """
        self.start_x = x
        self.start_y = y
        self.start_z = z

    def get_child_coordinates(self, position):
        """
        Get the x, y, z coords for a child well.

        If things are properly calibrated, this should be absolute.
        """
        col, row = self._normalize_position(position)
        offset_x = (self.col_spacing or self.spacing) * col
        offset_y = (self.row_spacing or self.spacing) * row
        return (offset_x + self.start_x, offset_y + self.start_y, self.start_z)

    def get_child(self, position):
        key = self._normalize_position(position)
        if key not in self._children:
            child = self.init_child(position)
            self._children[key] = child
        return self._children[key]

    def init_child(self, position):
        return self.child_class(self, position)

    def init_child_collection(self, positions):
        return self.collection_class(self, positions)

    def _normalize_position(self, position):
        """
        Normalizes a position (A2, B5, etc) and does a sanity check to ensure
        that the given coordinates are within bounds of the grid.
        """
        col, row = normalize_position(position)
        if self.rows is None:
            raise Exception("No maximum row number provided.")
        if self.cols is None:
            raise Exception("No maximum column number provided.")
        if self.rows and (row+1 > self.rows):  # Normalized row is zero-indexed
            raise KeyError(
                "Row #{} out of range (max is {}).".format(row, self.rows)
            )
        if self.cols and col+1 > self.cols:  # Normalized col is zero-indexed
            raise KeyError(
                "Column {} out of range (max is {})."
                .format(chr(col+ord('A')), chr(self.cols-1+ord('A')))
            )
        return (col, row)

    @classmethod
    def _get_instance(cls):
        if not cls._instance or not isinstance(cls._instance, cls):
            cls._instance = cls()
        return cls._instance

    @classmethod
    def calculate_offset(cls, position):
        """
        Returns a tuple containing (x, y, z) of the given position on this
        container, without calibration.
        """
        return cls._get_instance().get_child_coordinates(position)
