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
    (3, 4)

    >>> normalize_position('c4')
    (3, 4)

    You can also pass through a tuple that's already been normalized and get
    the same tuple back again:

    >>> normalize_position((3, 4))
    (3, 4)

    Useful if you want to dynamically construct tuples at a higher level of
    the application.

    """
    if isinstance(position, tuple) and len(position) is 2:
        if isinstance(position[0], int) and isinstance(position[1], int):
            return position
        raise TypeError("Tuple arguments must be integers.")
    elif isinstance(position, str):
        row = position[0].upper()
        col = position[1:]
        row_num  = ord(row) - ord('A')  # Get the row's alphabetical index.
        try:
            col_num  = int(col) - 1  # We want it zero-indexed.
        except ValueError:
            raise ValueError("Column must be a number.")
        return (row_num, col_num)
    else:
        raise TypeError("Position must be a str or tuple of ints.")


class GridItem():

    parent   = None
    position = None

    def __init__(self, parent, position):
        self.parent = parent
        self.position = position

    def coordinates(self):
        return self.parent.get_child_coordinates(self.position)


class GridContainer():

    """
    Change these in child implementations if you want to constrain to an
    actual grid.  Good for making sure people don't try to navigate to
    row 9999 and go way out of bounds.
    """
    rows = None
    cols = None

    """
    Calibration.
    """
    start_x = 0
    start_y = 0
    start_z = 0

    """
    A dict containing tuples of zero-indexed child coordinates.
    We only initialize them when they're accessed because until then, there's
    no way to mutate their (non-existent) state.
    """
    _children = None  # {}

    child_class = GridItem

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
        row, col = self._normalize_position(position)
        offset_x = self.spacing * row
        offset_y = self.spacing * col
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
        row_num, col_num = normalize_position(position)
        if self.rows is None:
            raise Exception("No maximum row number provided.")
        if self.cols is None:
            raise Exception("No maximum column number provided.")
        if self.rows and row_num > self.rows - 1:
            raise KeyError(
                "Row {} out of range.".format(row_num)
            )
        if self.cols and col_num > self.cols - 1:
            raise KeyError(
                "Column #{} out of range.".format(col_num)
            )
        return (row_num, col_num)
