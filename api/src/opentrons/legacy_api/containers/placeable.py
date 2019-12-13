import itertools
import math
import numbers
import re
import functools
from typing import List
from collections import OrderedDict

from opentrons.util.vector import Vector


SUPPORTED_MODULES = ['magdeck', 'tempdeck']


def unpack_location(location):
    """
    Returns (:Placeable:, :Vector:) tuple

    If :location: is :Placeable: it will get converted to
    (:Placeable:, :Vector: corresponding to the top)
    """
    coordinates = None
    placeable = None
    if isinstance(location, Placeable):
        placeable, coordinates = location.top()

    elif isinstance(location, tuple):
        placeable, coordinates = location

    else:
        raise ValueError(
            'Location should be (Placeable, (x, y, z)) or Placeable'
        )
    return (placeable, Vector(coordinates))


def location_to_list(loc):
    # might be a location tuple, or list of location tuples
    # like what's returned from well.top()
    if isinstance(loc, tuple):
        loc = unpack_location(loc)[0]
    if isinstance(loc, list):
        if isinstance(loc[0], (WellSeries, list)):
            loc = [well for series in loc for well in series]
        else:
            loc = [
                unpack_location(l)[0]
                for l in loc
            ]

    if isinstance(loc, WellSeries):
        # TODO(artyom, 20171107): this is to handle a case when
        # container.rows('1', '2') returns a WellSeries of WellSeries
        # the data structure should be fixed when WellSeries is phased out
        if isinstance(loc[0], WellSeries):
            loc = [well for series in loc for well in series]
        else:
            loc = list(loc)

    # ensure it returns either list or tuple
    if not (isinstance(loc, list) or isinstance(loc, tuple)):
        loc = [loc]
    return loc


def get_container(location):
    obj, _ = unpack_location(location)

    for obj in obj.get_trace():
        # TODO(artyom 20171003): WellSeries will go away once we start
        # supporting multi-channel properly
        if isinstance(obj, Container) and not isinstance(obj, WellSeries):
            return obj


def humanize_location(location):
    well, _ = unpack_location(location)
    return repr(well)


class Placeable(object):
    """
    This class represents every item on the deck.

    It maintains the hierarchy and provides means to:
    * traverse
    * retrieve items by name
    * calculate coordinates in different reference systems

    It should never be directly created; it is created by the system during
    labware load and when accessing wells.
    """

    def __init__(self, parent=None, properties=None):
        """
        Initiaize placeable.

        :parent: is a parent :Placeable: or :None:
        :properties: is a :dict: that will be stored within
        self.placeable
        """

        # For performance optimization reasons we are tracking children
        # by name and by reference
        self.children_by_name = OrderedDict()
        self.children_by_reference = OrderedDict()
        # A special stash for original names because the children won't
        # have them
        self.child_original_names_by_reference = OrderedDict()
        self._coordinates = Vector(0, 0, 0)

        self.parent = parent

        if properties is None:
            properties = {}

        self.properties = properties

        if 'radius' in properties:
            properties['width'] = properties['radius'] * 2
            properties['length'] = properties['radius'] * 2

        if 'diameter' in properties:
            properties['width'] = properties['diameter']
            properties['length'] = properties['diameter']

        if 'depth' in properties:
            properties['height'] = properties['depth']

        for dimension in ['length', 'width', 'height']:
            if dimension not in properties:
                properties[dimension] = 0

    def __getitem__(self, name):
        """
        Returns placeable by name or index
        If slice is given, returns a list
        """
        if isinstance(name, slice):
            return self.get_children_from_slice(name)
        elif isinstance(name, int):
            return self.get_children_list()[name]
        elif isinstance(name, str):
            return self.get_child_by_name(name)
        else:
            raise TypeError('Expected int, slice or str')

    def __repr__(self):
        """
        Return full path to the :Placeable: for debugging
        """
        return ''.join([str(i) for i in reversed(list(self.get_trace()))])

    def __str__(self):
        if not self.parent:
            return '<{}>'.format(self.__class__.__name__)
        return '<{} {}>'.format(
            self.__class__.__name__, self.get_name())

    def __add__(self, other):
        return WellSeries(
            self.get_children_list() + other.get_children_list()
        )

    def __iter__(self):
        return iter(self.get_children_list())

    def __len__(self):
        return len(self.get_children_list())

    def __bool__(self):
        return True

    def __next__(self):
        """
        Returns next child of :self: parent in the order
        children were added
        """
        if not self.get_parent():
            raise Exception('Must have a parent')

        children = self.parent.get_children_list()
        my_loc = children.index(self)
        return children[my_loc + 1]

    def iter(self):
        """
        Returns an iterable built from this Placeable's children list
        """
        return iter(self.get_children_list())

    def cycle(self):
        """
        Returns an itertools.cycle from this Placeable's children list
        """
        return itertools.cycle(self.get_children_list())

    def get_name(self):
        """
        Returns Placeable's name withing the parent
        """
        if self.parent is None:
            return None

        return self.parent.children_by_reference[self]

    def get_original_name(self):
        """ Returns the placeable's "original name" (i.e. not any
        user-specified overrides
        """
        if self.parent is None:
            return None

        return self.parent.child_original_names_by_reference[self]

    def get_type(self):
        """
        Returns the Placeable's type or class name
        """
        return self.properties.get('type', self.__class__.__name__)

    def get_children_list(self):
        """
        Returns the list of children in the order they were added
        """
        return list(self.children_by_reference.keys())

    def get_path(self, reference=None):
        """
        Returns list of names from :reference: to :self:
        If :reference: is *None* root is assumed
        """
        return list(reversed([item.get_name()
                              for item in self.get_trace(reference)
                              if item.get_name() is not None]))

    def get_trace(self, reference=None):
        """
        Returns a generator of parents up to :reference:, including reference
        If :reference: is *None* root is assumed
        Closest ancestor goes first
        """
        item = self
        while item:
            yield item
            if item == reference:
                return
            item = item.parent

        if reference is not None:
            raise Exception(
                'Reference {} is not in Ancestry'.format(reference))

    def coordinates(self, reference=None):
        """
        Returns the coordinates of a :Placeable: relative to :reference:
        """
        coordinates = [i._coordinates for i in self.get_trace(reference)]
        return functools.reduce(lambda a, b: a + b, coordinates)

    def add(self, child, name=None, coordinates=None, original_name=None):
        """
        Adds child to the :Placeable:, storing it's :name: and :coordinates:

        This method is used to add :Well:s to the :Container:,
        add :Slot:s to :Deck:, etc
        """
        if not name:
            name = str(child)

        if not original_name:
            original_name = name

        if name in self.children_by_name:
            raise RuntimeWarning(
                'Child with name {} already in slot, use custom name'.format(
                    name))

        if coordinates:
            child._coordinates = Vector(coordinates)
        child.parent = self
        self.children_by_name[name] = child
        self.children_by_reference[child] = name
        self.child_original_names_by_reference[child] = original_name

    def get_deck(self):
        """
        Returns parent :Deck: of a :Placeable:
        """
        trace = self.get_trace()

        # Find decks in trace, prepend with [None] in case nothing was found
        res = [None] + [item for item in trace if isinstance(item, Deck)]

        # Pop last (and hopefully only Deck) or None if there is no deck
        return res.pop()

    def get_module(self):
        """
        Returns the module placeable if present
        """
        for md in SUPPORTED_MODULES:
            maybe_module = self.get_child_by_name(md)
            if maybe_module:
                # No probability of a placeable having more than one module
                return maybe_module
        return None

    def get_parent(self):
        """
        Returns parent
        """
        return self.parent

    def get_child_by_name(self, name):
        """
        Retrieves child by name
        """
        return self.children_by_name.get(name)

    def get_index_from_name(self, name):
        """
        Retrieves child's name by index
        """
        return self.get_children_list().index(
            self.get_child_by_name(name))

    def get_children_from_slice(self, s):
        """
        Retrieves list of children within slice
        """
        if isinstance(s.start, str):
            s = slice(
                self.get_index_from_name(s.start), s.stop, s.step)
        if isinstance(s.stop, str):
            s = slice(
                s.start, self.get_index_from_name(s.stop), s.step)
        return WellSeries(self.get_children_list()[s])

    def has_children(self):
        """
        Returns *True* if :Placeable: has children
        """
        return len(self.children_by_reference) > 0

    def size(self):
        """
        Returns :Vector: of the furthermost point of :Placeable:
        including all of it's children
        """
        return Vector(
            self.x_size(),
            self.y_size(),
            self.z_size()
        )

    def magdeck_engage_height(self):
        """
        Returns magnetic module engage height
        """
        return self.properties['magdeck_engage_height']

    def max_volume(self):
        """
        Returns placeable's maximum liquid volume in uL
        """
        try:
            return self.properties['total-liquid-volume']
        except KeyError:
            return None

    def x_size(self):
        """
        Returns placeable's size along X axis
        """
        return self.properties['width']

    def y_size(self):
        """
        Returns placeable's size along Y axis
        """
        return self.properties['length']

    def z_size(self):
        """
        Returns placeable's size along Z axis
        """
        return self.properties['height']

    def get_all_children(self):
        """
        Returns all children recursively
        """
        my_children = self.get_children_list()
        children = []
        children.extend(my_children)
        for child in my_children:
            children.extend(child.get_all_children())
        return children

    def from_polar(self, r, theta, h):
        """
        Converts polar coordiantes within a placeable into a :Vector:

        The origin is assumed to be in the center of a Placeable

        :r: is between -1.0 and 1.0, relative to max X
        :h: is between -1.0 and 1.0, relative to max Z
        """
        center = self.size() / 2.0
        r = r * center['x']

        return center + Vector(r * math.cos(theta),
                               r * math.sin(theta),
                               center['z'] * h)

    def from_cartesian(self, x, y, z):
        """
        Converts cartesian coordinates within a placeable into a :Vector:

        The origin is assumed to be in the center of a Placeable

        :x:, :y:, :z: is between -1.0 and 1.0, relative to max X, Y, Z
        """
        center = self.size() / 2.0
        return center + center * Vector(x, y, z)

    def center(self, reference=None):
        """
        Returns (:py:class:`.Placeable`, :py:class:`.Vector`) tuple where
        the vector points to the center of the placeable, in ``x``, ``y``,
        and ``z``. This can be passed into any :py:class:`.Robot` or
        :py:class:`.Pipette` method ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        :param reference: An optional placeable for the vector to be relative
                          to.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        return self.from_center(x=0.0, y=0.0, z=0.0, reference=reference)

    def bottom(self, z=0, radius=0, degrees=0, reference=None):
        """
        Returns (:py:class:`.Placeable`, :py:class:`.Vector`) tuple where
        the vector points to the bottom of the placeable. This can be passed
        into any :py:class:`.Robot` or :py:class:`.Pipette` method
        ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        The ``radius`` and ``degrees`` arguments are interpreted as
        in :py:meth:`.from_center` (except that ``degrees`` is in degrees, not
        radians). They can be used to specify a further distance from the
        bottom center of the well; for instance, calling
        ``bottom(radius=0.5, degrees=180)`` will move half the radius in the
        180 degree direction from the center of the well.

        The ``z`` argument is a distance in mm to move in z from the bottom,
        and can be used to hover above the bottom. For instance, calling
        ``bottom(z=1)`` will move 1mm above the bottom.

        :param z: Absolute distance in mm to move  in ``z`` from the bottom.
                  Note that unlike the other arguments, this is a distance, not
                  a ratio.
        :param degrees: Direction in which to move ``radius`` from the bottom
                        center.
        :param radius: Ratio of the placeable's radius to move in the direction
                       specified by ``degrees`` from the bottom center.
        :param reference: An optional placeable for the vector to be relative
                          to.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        coordinates = self.from_center(
            r=radius,
            theta=(degrees / 180) * math.pi,
            h=-1,
            reference=reference)
        return (self, coordinates + (0, 0, z))

    def top(self, z=0, radius=0, degrees=0, reference=None):
        """
        Returns (:py:class:`.Placeable`, :py:class:`.Vector`) tuple where
        the vector points to the top of the placeable. This can be passed
        into any :py:class:`.Robot` or :py:class:`.Pipette` method
        ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        The ``radius`` and ``degrees`` arguments are interpreted as
        in :py:meth:`.from_center` (except that ``degrees`` is in degrees, not
        radians). They can be used to specify a further distance from the top
        center of the well; for instance, calling
        ``top(radius=0.5, degrees=180)`` will move half the radius in the 180
        degree direction from the center of the well.

        The ``z`` argument is a distance in mm to move in z from the top, and
        can be used to hover above or below the top. For instance, calling
        ``top(z=-1)`` will move 1mm below the top.

        :param z: Absolute distance in mm to move  in ``z`` from the top. Note
                  that unlike the other arguments, this is a distance, not a
                  ratio.
        :param degrees: Direction in which to move ``radius`` from the top
                        center.
        :param radius: Ratio of the placeable's radius to move in the direction
                       specified by ``degrees`` from the top center.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        coordinates = self.from_center(
            r=radius,
            theta=(degrees / 180) * math.pi,
            h=1,
            reference=reference)
        return (self, coordinates + (0, 0, z))

    def from_center(self, x=None, y=None, z=None, r=None,
                    theta=None, h=None, reference=None):
        """
        Accepts a set of ratios for Cartesian or ratios/angle for Polar
        and returns :py:class:`.Vector` using ``reference`` as origin.

        Though both polar and cartesian arguments are accepted, only one
        set should be used at the same time, and the set selected should be
        entirely used. In addition, all variables in the set should be used.

        For instance, if you want to use cartesian coordinates, you must
        specify all of ``x``, ``y``, and ``z`` as numbers; if you want to
        use polar coordinates, you must specify all of ``theta``, ``r`` and
        ``h`` as numbers.

        While ``theta`` is an absolute angle in radians, the other values are
        actually ratios which are multiplied by the relevant dimensions of the
        placeable on which ``from_center`` is called. For instance, calling
        ``from_center(x=0.5, y=0.5, z=0.5)`` does not mean "500 micromenters
        from the center in each dimension", but "half the x size, half the y
        size, and half the z size from the center". Similarly,
        ``from_center(r=0.5, theta=3.14, h=0.5)`` means "half the radius
        dimension at 180 degrees, and half the height upwards".

        :param x: Ratio of the x dimension of the placeable to move from the
                  center.
        :param y: Ratio of the y dimension of the placeable to move from the
                  center.
        :param z: Ratio of the z dimension of the placeable to move from the
                  center.
        :param r: Ratio of the radius to move from the center.
        :param theta: Angle in radians at which to move the percentage of the
                      radius specified by ``r`` from the center.
        :param h: Percentage of the height to move up in z from the center.
        :param reference: If specified, an origin to add to the offset vector
                          specified by the other arguments.
        :returns: A vector from either the origin or the specified reference.
                  This can be passed into any :py:class:`.Robot` or
                  :py:class:`.Pipette` method ``location`` argument.
        """
        coords_to_endpoint = None
        if all([isinstance(i, numbers.Number) for i in (x, y, z)]):
            coords_to_endpoint = self.from_cartesian(x, y, z)

        if all([isinstance(i, numbers.Number) for i in (r, theta, h)]):
            coords_to_endpoint = self.from_polar(r, theta, h)

        coords_to_reference = Vector(0, 0, 0)
        if reference:
            coords_to_reference = self.coordinates(reference)

        return coords_to_reference + coords_to_endpoint


class Deck(Placeable):
    """
    This class implements behaviour specific to the Deck
    """
    def containers(self) -> list:
        """
        Returns all containers on a deck as a list
        """

        all_containers: List = list()
        for slot in self:
            all_containers += slot.get_children_list()

        for container in all_containers:
            if getattr(container, 'stackable', False):
                all_containers += container.get_children_list()

        return all_containers

    def has_container(self, container_instance):
        """
        Returns *True* if :Deck: has a container :container_instance:
        """
        return container_instance in self.containers()


class Well(Placeable):
    """
    Class representing a Well
    """
    pass


class Slot(Placeable):
    """
    Class representing a Slot
    """
    stackable = True


class Module(Placeable):
    """
    Class representing a module as a child of Slot and parent of Labware
    """
    stackable = True


class Container(Placeable):
    """
    Class representing a container, also implements grid behavior
    """

    def __init__(self, *args, **kwargs):
        super(Container, self).__init__(*args, **kwargs)
        self.grid = None
        self.grid_transposed = None
        self.ordering = None

    def invalidate_grid(self):
        """
        Invalidates pre-calcualted grid structure for rows and colums
        """
        self.grid = None
        self.grid_transposed = None

    def calculate_grid(self):
        """
        Calculates and stores grid structure
        """
        if self.grid is None:
            self.grid = self.get_wellseries(self.get_grid())

        if self.grid_transposed is None:
            self.grid_transposed = self.get_wellseries(
                self.transpose(
                    self.get_grid()))

    def get_grid(self):
        """
        Calculates the grid inferring row/column structure
        from indexes. Currently only Letter+Number names are supported
        """
        columns = OrderedDict()

        index_pattern = r'^([A-Za-z]+)([0-9]+)$'
        for name in self.children_by_name:
            match = re.match(index_pattern, name)
            if match:
                row, col = match.groups(0)
                if col not in columns:
                    columns[col] = OrderedDict()
                columns[col][row] = (row, col)

        return columns

    def transpose(self, rows):
        """
        Transposes the grid to allow for cols
        """
        res = OrderedDict()
        for row, cols in rows.items():
            for col, cell in cols.items():
                if col not in res:
                    res[col] = OrderedDict()
                res[col][row] = cell
        return res

    def get_wellseries(self, matrix):
        """
        Returns the grid as a WellSeries of WellSeries
        """
        res = OrderedDict()
        for col, cells in matrix.items():
            if col not in res:
                res[col] = OrderedDict()
            for row, cell in cells.items():
                res[col][row] = self.children_by_name[
                    ''.join(cell)
                ]
            res[col] = WellSeries(res[col], name=col)
        return WellSeries(res)

    @property
    def rows(self):
        """
        Rows can be accessed as:
        >>> plate.rows[0]
        >>> plate.rows['A']

        Wells can be accessed as:
        >>> plate.rows[0][0]
        >>> plate.rows['A']['1']
        """
        self.calculate_grid()
        return self.grid_transposed

    @property
    def columns(self):
        """
        Columns can be accessed as:
        >>> plate.columns[0]
        >>> plate.columns['1']

        Wells can be accessed as:
        >>> plate.columns[0][0]
        >>> plate.columns['1']['A']
        """
        self.calculate_grid()
        return self.grid

    @property
    def cols(self):
        """
        Columns can be accessed as:
        >>> plate.cols[0]
        >>> plate.cols['1']

        Wells can be accessed as:
        >>> plate.cols[0][0]
        >>> plate.cols['1']['A']
        """
        return self.columns

    def well(self, name=None):
        """
        Returns well by :name:
        """
        return self.__getitem__(name)

    def wells(self, *args, **kwargs):
        """
        Returns child Well or list of child Wells
        """

        if len(args) and isinstance(args[0], list):
            args = args[0]

        new_wells = None
        if not args and not kwargs:
            new_wells = WellSeries(self.get_children_list())
        elif len(args) > 1:
            new_wells = WellSeries([self.well(n) for n in args])
        elif 'x' in kwargs or 'y' in kwargs:
            new_wells = self._parse_wells_x_y(*args, **kwargs)
        else:
            new_wells = self._parse_wells_to_and_length(*args, **kwargs)

        if len(new_wells) == 1:
            return new_wells[0]
        return new_wells

    def __call__(self, *args, **kwargs):
        """
        Passes all arguments to Wells() and returns result
        """
        return self.wells(*args, **kwargs)

    def get(self, *args, **kwargs):
        """
        Passes all arguments to Wells() and returns result
        """
        return self.wells(*args, **kwargs)

    def get_children_list(self):
        return super(Container, self).get_children_list()

    def _parse_wells_to_and_length(self, *args, **kwargs):
        start = args[0] if len(args) else 0
        stop = kwargs.get('to', None)
        step = kwargs.get('step', 1)
        length = kwargs.get('length', 1)

        wrapped_wells = [
            w
            for i in range(3)
            for w in self.get_children_list()
        ]
        total_kids = len(self.get_children_list())

        if isinstance(start, str):
            start = self.get_index_from_name(start)
        if stop is not None:
            if isinstance(stop, str):
                stop = self.get_index_from_name(stop)
            if stop > start:
                stop += 1
                step = step * -1 if step < 0 else step
            elif stop < start:
                stop -= 1
                step = step * -1 if step > 0 else step
            return WellSeries(
                wrapped_wells[start + total_kids:stop + total_kids:step])
        else:
            if length < 0:
                length *= -1
                step = step * -1 if step > 0 else step
            return WellSeries(
                wrapped_wells[start + total_kids::step][:length])

    def _parse_wells_x_y(self, *args, **kwargs):
        x = kwargs.get('x', None)
        y = kwargs.get('y', None)
        if x is None and isinstance(y, int):
            return self.rows[y]
        elif y is None and isinstance(x, int):
            return self.cols[x]
        elif isinstance(x, int) and isinstance(y, int):
            return self.cols[x][y]
        else:
            raise ValueError('Placeable.wells(x=, y=) expects ints')


class WellSeries(Container):
    """
    :WellSeries: represents a series of wells to make
    accessing rows and columns easier. You can access
    wells using index, providing name, index or slice

    :WellSeries: mimics :Placeable:'s behaviour, delegating
    all :Placeable: calls to the 0th well by default.

    Default well index can be overriden using :set_offset:
    """

    def __init__(self, wells, name=None):
        if isinstance(wells, dict):
            self.items = wells
            self.values = list(wells.values())
        else:
            self.items = {w.get_name(): w for w in wells}
            self.values = wells
        self.offset = 0
        self.name = name

    def set_offset(self, offset):
        """
        Set index of a well that will be used to mimic :Placeable:
        """
        self.offset = offset

    def __repr__(self):
        """
        Return full path to the :Placeable: for debugging
        """
        return str(self)

    def __str__(self):
        return '<{0}: {1}>'.format(
            self.__class__.__name__,
            ''.join([str(well) for well in self.values]))

    def __getattr__(self, name):
        # getstate/setstate are used by pickle and are not implemented by
        # downstream objects (Wells) therefore raise attribute error
        if name in ('__getstate__', '__setstate__'):
            raise AttributeError()
        return getattr(self.values[self.offset], name)

    def get_name(self):
        if self.name is None:
            return str(self)
        return str(self.name)

    def get_name_by_instance(self, well):
        for name, value in self.items.items():
            if value is well:
                return name
        return None

    def get_children_list(self):
        return list(self.values)

    def get_child_by_name(self, name):
        return self.items.get(name)
