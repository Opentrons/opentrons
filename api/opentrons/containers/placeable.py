import itertools
import math
import numbers
from collections import OrderedDict
from opentrons.util.vector import Vector

import re
import functools


def unpack_location(location):
    """
    Returns (:Placeable:, :Vector:) tuple

    If :location: is :Placeable: it will get converted to
    (:Placeable:, :Vector: corresponting to the top)
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


def humanize_location(location):
    well, _ = unpack_location(location)
    return repr(well)


class Placeable(object):
    """
    This class represents every item on the deck:
    :Container:, :Slot:, :Well:.

    It maintains the hierarchy and provides means to:
    * traverse
    * retrieve items by name
    * calculate coordinates in different reference systems
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
        self._coordinates = Vector(0, 0, 0)
        self._max_dimensions = {}

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
        return ''.join([str(i) for i in reversed(self.get_trace())])

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

    def chain(self, *args):
        """
        Returns an itertools.chain built from this Placeable's children list
        and appending any passed lists with *args
        """
        return itertools.chain(self.get_children_list(), *args)

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
        Returns a list of parents up to :reference:, including reference
        If :reference: is *None* root is assumed
        Closest ancestor goes first
        """
        def get_next_parent():
            item = self
            while item:
                yield item
                if item == reference:
                    break
                item = item.parent

        trace = list(get_next_parent())

        if reference is not None and reference not in trace:
            raise Exception(
                'Reference {} is not in Ancestry'.format(reference))

        return trace

    def coordinates(self, reference=None):
        """
        Returns the coordinates of a :Placeable: relative to :reference:
        """
        coordinates = [i._coordinates for i in self.get_trace(reference)]
        return functools.reduce(lambda a, b: a + b, coordinates)

    def add(self, child, name=None, coordinates=Vector(0, 0, 0)):
        """
        Adds child to the :Placeable:, storing it's :name: and :coordinates:

        This method is used to add :Well:s to the :Container:,
        add :Slot:s to :Deck:, etc
        """
        if not name:
            name = str(child)

        if name in self.children_by_name:
            del self.children_by_name[name]

        child._coordinates = Vector(coordinates)
        child.parent = self
        self.children_by_name[name] = child
        self.children_by_reference[child] = name

    def get_deck(self):
        """
        Returns parent :Deck: of a :Placeable:
        """
        trace = self.get_trace()

        # Find decks in trace, prepend with [None] in case nothing was found
        res = [None] + [item for item in trace if isinstance(item, Deck)]

        # Pop last (and hopefully only Deck) or None if there is no deck
        return res.pop()

    def remove_child(self, name):
        """
        Removes child by :name:
        """
        child = self.children_by_name[name]
        del self.children_by_name[name]
        del self.children_by_reference[child]

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

    def max_volume(self):
        """
        Returns placeable's maximum liquid volume in uL
        """
        return self.properties['total-liquid-volume']

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

    def max_dimensions(self, reference):
        """
        Returns maximum (x,y,z) coordinates for all children in the
        container in the *reference* coordinate system
        >>> plate.max_dimensions(reference=deck)
        """

        # Our placeables are considered immuteable, hence we are caching
        # max dimensions for a given reference to calculate it only once
        if reference in self._max_dimensions:
            return self._max_dimensions[reference]

        if not self.has_children():
            return (0, 0, 0)

        # Collect all furthermost child coordinates
        child_coordinates = [
            child.from_center(x=1, y=1, z=1, reference=reference)
            for child in self.get_all_children()]

        # find furthermost x, y and z
        res = tuple([
            max(
                child_coordinates,
                key=lambda coordinates: coordinates[axis]
            )[axis]
            for axis in range(3)])

        # Cache it
        self._max_dimensions[reference] = res

        return res

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
        Converts cartesian coordiantes within a placeable into a :Vector:

        The origin is assumed to be in the center of a Placeable

        :x:, :y:, :z: is between -1.0 and 1.0, relative to max X, Y, Z
        """
        center = self.size() / 2.0
        return center + center * Vector(x, y, z)

    def center(self, reference=None):
        """
        Returns :Vector: of the center for a :Placeable: relative
        to the :reference: :Placeable:

        Uses self as a :reference: if *None* is given
        """
        return self.from_center(x=0.0, y=0.0, z=0.0, reference=reference)

    def bottom(self, z=0, radius=0, degrees=0, reference=None):
        """
        Returns (:Placeable, :Vector:) tuple where :Vector:
        corresponds to the bottom of a :Placeable:

        If :reference: :Placeable: is provided, returns
        the :Vector: within :reference: coordinate system
        """
        coordinates = self.from_center(
            r=radius,
            theta=(degrees / 180) * math.pi,
            h=-1,
            reference=reference)
        return (self, coordinates + (0, 0, z))

    def top(self, z=0, radius=0, degrees=0, reference=None):
        """
        Returns (:Placeable, :Vector:) tuple where :Vector:
        corresponds to the top of a :Placeable:

        If :reference: :Placeable: is provided, returns
        the :Vector: within :reference: coordinate system
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
        Accepts a set of (:x:, :y:, :z:) ratios for Cartesian or
        (:r:, :theta:, :h:) rations/angle for Polar and returns
        :Vector: using :reference: as origin
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
    def containers(self) -> dict:
        """
        Returns all containers on a deck as a name:placeable dict
        """
        containers = OrderedDict()
        for slot in self:
            for container in slot:
                containers[container.get_name()] = container
        return containers

    def has_container(self, container_instance):
        """
        Returns *True* if :Deck: has a container :container_instance:
        """
        return container_instance in self.containers().values()


class Well(Placeable):
    """
    Class representing a Well
    """
    pass


class Slot(Placeable):
    """
    Class representing a Slot
    """
    pass


class Container(Placeable):
    """
    Class representing a container, also implements grid behavior
    """
    def __init__(self, *args, **kwargs):
        super(Container, self).__init__(*args, **kwargs)
        self.grid = None
        self.grid_transposed = None

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
        rows = OrderedDict()
        index_pattern = r'^([A-Za-z]+)([0-9]+)$'
        for name in self.children_by_name:
            match = re.match(index_pattern, name)
            if match:
                col, row = match.groups(0)
                if row not in rows:
                    rows[row] = OrderedDict()
                rows[row][col] = (row, col)

        return rows

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
        for row, cells in matrix.items():
            if row not in res:
                res[row] = OrderedDict()
            for col, cell in cells.items():
                res[row][col] = self.children_by_name[
                    ''.join(reversed(cell))
                ]
            res[row] = WellSeries(res[row], name=row)
        return WellSeries(res)

    @property
    def rows(self):
        """
        Rows can be accessed as:
        >>> plate.rows[0]
        >>> plate.rows['1']

        Wells can be accessed as:
        >>> plate.rows[0][0]
        >>> plate.rows['1']['A']
        """
        self.calculate_grid()
        return self.grid

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
        return self.grid_transposed

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

        if len(new_wells) is 1:
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
            return self.rows(y)
        elif y is None and isinstance(x, int):
            return self.cols(x)
        elif isinstance(x, int) and isinstance(y, int):
            i = (y * len(self.cols)) + x
            return self.wells(i)
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
