from math import floor


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


def humanize_position(position):
    """
    Takes a position as either "A1" or (0, 0) and returns the humanized
    position name, ie "A1".

    This will run an already humanized position back through the normalizer
    and then humanize it again. Inefficient but kind of profound.

    >>> humanize_position((0, 0))
    'A1'

    >>> humanize_position((1, 4))
    'B5'

    >>> humanize_position('K12')
    'K12'
    """
    col, row = normalize_position(position)
    if col > 25:  # Support this later.
        raise ValueError(
            "Column value of {} is out of supported range."
            .format(col)
        )
    return "{}{}".format(chr(col + ord('A')), row + 1)


class GridItem(object):

    parent = None
    position = None

    depth = None
    diameter = None

    """
    We use custom properties to handle situations like tube racks with
    multiple volumes of tubes.

    This problem might be solved more generally in the future by using custom
    components (such as tubes and PCR strips) which can be placed into parent
    grid cells.

    See the initialization method below for more information on how custom
    properties are used.
    """
    _custom_properties = None

    def __init__(self, parent, position, properties=None):
        self.parent = parent
        self.position = position

        properties = properties or {}

        self.depth = properties.get('depth', self.parent.depth)
        self.diameter = properties.get('diameter', self.parent.diameter)

        """
        Some container positions have arbitrary custom properies not
        by all of the wells. For example, a 15/50 tube rack has positions
        for both 15ml and 50ml tubes.
        """
        if properties:
            self._custom_properties = properties

    def coordinates(self, instrument='primary'):
        """
        Returns the coordinates of a position relative to its parent
        container.
        """
        x, y = self.parent.get_child_coordinates(self.position)
        return (x, y)

    @property
    def address(self):
        """
        Returns an address tuple of the address of this particular GridItem.

        The tuple length varies depending on the nesting depth of the item.

        For example, a Deck module at A1 would be [(0, 0)] and the A2 well
        position on that module would be [(0, 0), (0, 1)].
        """
        if self.parent:
            return self.parent.address + [self.position]
        else:
            return [self.position]


class GridContainer(object):

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
    Margin
    """

    a1_x = 0
    a1_y = 0

    """
    Depth, diameter and volume are expected by the old-style containers, so
    for legacy reasons we have them here, even in cases where these values
    don't apply (for example, tips have no real depth, reservoir troughs have
    no diameter).
    """

    depth = 0
    diameter = 0
    volume = 0
    min_vol = 0
    max_vol = 0

    _custom_wells = None
    _name = None

    """
    A dict containing tuples of zero-indexed child coordinates as keys and
    GridItems (or designated child_class instances) as values.

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
        # import pdb; pdb.set_trace()
        self.parent = parent
        self._children = {}

    def __iter__(self):
        return (well for pos, well in sorted(self._children.items()))

    def get_child_coordinates(self, position):
        """
        Get the x, y, z coords for a child well relative to the given
        instrument.
        """
        col, row = self._normalize_position(position)
        w = (self._custom_wells or {}).get((col, row)) or {}
        offset_x = w.get('x') or (self.col_spacing or self.spacing) * col
        offset_y = w.get('y') or (self.row_spacing or self.spacing) * row
        return (offset_x, offset_y)

    def get_child(self, position):
        key = self._normalize_position(position)
        if key not in self._children:
            child = self.init_child(position)
            self._children[key] = child
        return self._children[key]

    def init_child(self, position):
        pos = self._normalize_position(position)
        # Some wells have custom properties specified in their containers
        # config.
        if self._custom_wells:
            props = self._custom_wells.get(pos, None)
        else:
            props = None
        return self.child_class(self, pos, props)

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
        if self.rows and (row + 1 > self.rows):  # row is zero-indexed
            raise KeyError(
                "Row #{} out of range (max is {}).".format(row, self.rows)
            )
        if self.cols and col + 1 > self.cols:  # col is zero-indexed
            raise KeyError(
                "Column {} out of range (max is {})."
                .format(chr(col + ord('A')), chr(self.cols - 1 + ord('A')))
            )
        return (col, row)

    def _position_in_sequence(self, offset=0):
        """
        Returns a col, row tuple for a position after the given offset.
        """
        if offset > self.total_wells:
            raise KeyError(
                "Position at offset {} out of range. Max is {}."
                .format(offset, self.total_wells)
            )
        if offset is 0:
            return (0, 0)
        col = floor(offset / self.rows)
        row = offset % self.rows
        return (col, row)

    @property
    def name(self):
        return self._name or self.__class__.__name__.lower().replace('_', '.')

    @property
    def total_wells(self):
        return self.cols * self.rows

    @property
    def address(self):
        pos = normalize_position(self.position)
        if self.parent:
            return self.parent.address + [pos]
        else:
            return [pos]

    @classmethod
    def _get_instance(cls):
        if not cls._instance or not isinstance(cls._instance, cls):
            cls._instance = cls()
        return cls._instance

    @classmethod
    def coordinates(cls, position):
        """
        Returns a tuple containing (x, y, z) of the given position on this
        container, without calibration.

        Because it's a class method, and the class doesn't contain data on
        particular calibration positions.

        For calibrated positions, which are absolute to the deck, instantiate
        and calibrate a specific container object.
        """
        return cls._get_instance().get_child_coordinates(position)

    @classmethod
    def calculate_offset(cls, position):
        """
        Returns a tuple containing (x, y, z) of the given position on this
        container, without calibration.  (Relative coordinates.)
        """
        return cls.coordinates(position)

    @classmethod
    def _set_custom_wells(cls, wells):
        """
        Provides a mechanism for generating dynamic containers from user
        configuration in which any well can override the default properties
        of wells on the container.

        Wells need to be a dict containing cell coordinates (which will be
        normalized internally) as keys and tuples containing (x, y, z) as
        values.
        """
        normalized = {}
        for pos in wells:
            normalized[normalize_position(pos)] = wells[pos]
        cls._custom_wells = normalized
