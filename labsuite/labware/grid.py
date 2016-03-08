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


class GridItem():

    parent   = None
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

    """
    Dict containing calibration values; see the GridContainer implementation
    below for more info.
    """
    _calibration = None

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

    def calibrate(self, x=None, y=None, z=None, instrument='primary'):
        """
        Allows for overriding the default coordinates that would be otherwise
        be calculated dynamically by the parent well based on the labware
        specification.

        A use case for this would be attaching a custom depth value for just
        one well because the robot operation knows the well liquid depth is
        slightly different than all the other wells (for example if they're
        using a custom tube not explicitly defined as a component within the
        protocol itself).

        Custom calibration can also theoretically be redefined at particular
        steps in a protocol as the robot is running, though for each of these
        cases we should seek out a more general solution and support it at
        a higher, more dynamic level.

        See the related calibration on the GridContainer class for more
        details.

        This method might go away when we make the GridItems recursive
        GridContainers, but the external interface shouldn't change.
        """

        # Python dictionaries are always passed by reference, meaning changes
        # to 'cal' are also changes to self._calibration[instrument].
        cal = self._get_calibration(instrument)

        if x:
            cal['x'] = x
        if y:
            cal['y'] = y
        if z:
            cal['z'] = z

    def _get_calibration(self, instrument):
        """
        DO NOT USE THIS; it's likely to change dramatically in future
        releases as instruments become first-class citizens within the
        library.
        """
        if not self._calibration:
            self._calibration = {}
        if not self._calibration.get(instrument):
            self._calibration[instrument] = {}

        return self._calibration[instrument]

    def coordinates(self, instrument='primary'):
        px, py, pz = self.parent.get_child_coordinates(self.position)
        # Roll in custom calibration.
        c = self._get_calibration(instrument)
        x = c.get('x', px)
        y = c.get('y', py)
        z = c.get('z', pz)
        return (x, y, z)


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

    Looks like:

    {'primary': { 'x': 1, 'y': 2, 'z': 3 }}

    Where 'primary' is the default axis when not specified. Any arbitrary
    axis label can be specified within the calibration methods.
    """
    _calibration = None

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
        self.parent = parent
        self._children = {}

    def calibrate(self, x=None, y=None, z=None, instrument='primary', **kwargs):
        """
        Saves the absolute coordinates on the deck of the first GridItem
        within a particular container, relative to a given instrument.

        The instrument label defaults to 'primary', but can be set to
        anything. For example, left/right/middle or a/b/c.  In the future,
        this will be validated as an existing instrument on the robot,
        which will not be backwards compatible.

        Keyword arguments are for compatibility with overriding methods.
        """
        # Python dictionaries are always passed by reference.
        cal = self._get_calibration(instrument)

        if x:
            cal['x'] = x
        if y:
            cal['y'] = y
        if z:
            cal['z'] = z

    def _get_calibration(self, instrument):
        """
        Ensures the existence of and returns calibration object for a given
        instrument.

        DO NOT USE THIS; it's likely to change dramatically in future
        releases as instruments become first-class citizens within the
        library.

        Another method that will go away when GridItems become recursive
        GridContainers.
        """
        if not self._calibration:
            self._calibration = {}
        if not self._calibration.get(instrument):
            self._calibration[instrument] = {}

        return self._calibration[instrument]

    def get_child_coordinates(self, position, instrument='primary'):
        """
        Get the x, y, z coords for a child well relative to the given
        instrument (defaults to primary).

        If things are properly calibrated, this should be absolute.
        """
        col, row = self._normalize_position(position)
        calibration = self._get_calibration(instrument)
        start_x = calibration.get('x', 0)
        start_y = calibration.get('y', 0)
        start_z = calibration.get('z', 0)
        w = (self._custom_wells or {}).get((col, row)) or {}
        offset_x = w.get('x') or (self.col_spacing or self.spacing) * col
        offset_y = w.get('y') or (self.row_spacing or self.spacing) * row
        # We don't do any dynamic offset for Z because all our labware is
        # flat at the moment. Edge cases can be handled by manually
        # calibrating specific child positions.
        offset_z = w.get('z') or start_z
        return (offset_x + start_x, offset_y + start_y, offset_z)

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

    def _get_calibration(self, instrument):
        """
        DO NOT USE THIS; it's likely to change dramatically in future
        releases as instruments become first-class citizens within the
        library.
        """
        if not self._calibration:
            self._calibration = {}
        if not self._calibration.get(instrument):
            self._calibration[instrument] = {}

        return self._calibration[instrument]

    @property
    def calibrated(self, instrument='primary'):
        """
        Returns True if the container has been calibrated, False if it
        hasn't.

        Knowing whether or not the container has been calibrated
        is essential for determining whether given coordinates are
        absolute to the deck or relative to the container.
        """
        data = self._get_calibration(instrument)
        return len(data.keys()) > 0

    def calibration(self, instrument='primary'):
        cal = self._get_calibration(instrument)
        x = cal.get('x', 0)
        y = cal.get('y', 0)
        z = cal.get('z', 0)
        return (x, y, z)

    @property
    def name(self):
        return self._name or self.__class__.__name__.lower().replace('_', '.')

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

    @classmethod
    def _position_in_sequence(cls, offset=0):
        """
        Returns a col, row tuple for a position after the given offset.
        """
        col = floor(offset / cls.cols)
        row = offset % cls.cols
        return (col, row)
