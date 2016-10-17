import math
import numbers
from collections import OrderedDict
from opentrons_sdk.util.vector import Vector

import re


def unpack_location(location):
    coordinates = None
    placeable = None
    if isinstance(location, Placeable):
        coordinates = location.from_center(x=0, y=0, z=1)
        placeable = location
    elif isinstance(location, tuple):
        placeable, coordinates = location
    else:
        raise ValueError(
            'Location should be (Placeable, (x, y, z)) or Placeable'
        )
    return (placeable, Vector(coordinates))


class Placeable(object):

    def __init__(self, parent=None, properties=None):
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
        if isinstance(name, int) or isinstance(name, slice):
            return self.get_children_list()[name]
        else:
            return self.get_child_by_name(name)

    def __str__(self):
        if not self.parent:
            return '<{}>'.format(self.__class__.__name__)
        return '<{} {}>'.format(
            self.__class__.__name__, self.get_name())

    def __iter__(self):
        return iter(self.children_by_reference.keys())

    def __len__(self):
        return len(self.children_by_name)

    def __bool__(self):
        return True

    def __next__(self):
        if not self.get_parent():
            raise Exception('Must have a parent')

        children = self.parent.get_children_list()
        my_loc = children.index(self)
        return children[my_loc + 1]

    def get_name(self):
        if self.parent is None:
            return None

        return self.parent.children_by_reference[self]

    def get_children_list(self):
        # TODO: refactor?
        return list(self.children_by_reference.keys())

    def get_path(self, reference=None):
        return list(reversed([item.get_name()
                    for item in self.get_trace(reference)
                    if item.get_name() is not None]))

    def get_trace(self, reference=None):
        trace = [self]
        parent = self.get_parent()
        while parent:
            trace.append(parent)
            if reference == parent:
                break
            parent = parent.get_parent()

        if reference is not None and reference not in trace:
            raise Exception('Reference is not in Ancestry')
        return trace

    def coordinates(self, reference=None):
        if reference == self:
            return Vector(0, 0, 0)

        if not self.parent:
            return Vector(0, 0, 0)

        if not reference:
            return self.parent.get_child_coordinates(self)

        return self.parent.coordinates(reference) + self.coordinates()

    def get_child_coordinates(self, child):
        if not child.parent == self:
            raise ValueError('{} is not a parent of {}'.format(self, child))

        if isinstance(child, Placeable):
            return child._coordinates

        if child not in self.children_by_name:
            raise ValueError('Child {} not found'.format(child))

        return self.children_by_name[child]._coordinates

    def add(self, child, name=None, coordinates=Vector(0, 0, 0)):
        if not name:
            name = str(child)
        if name in self.children_by_name:
            raise Exception('Child with the name {} already exists'
                            .format(name))

        child._coordinates = Vector(coordinates)
        child.parent = self
        self.children_by_name[name] = child
        self.children_by_reference[child] = name

    def get_deck(self):
        parent = self.parent

        if not parent:
            return self

        found = False
        while not found:
            if parent is None:
                break
            if isinstance(parent, Deck):
                found = True
                break
            parent = parent.parent

        return parent

    def remove_child(self, name):
        child = self.children_by_name[name]
        del self.children_by_name[name]
        del self.children_by_reference[child]

    def get_parent(self):
        return self.parent

    def get_children(self):
        return self.children

    def get_child_by_name(self, name):
        return self.children_by_name[name]

    def size(self):
        return Vector(
            self.x_size(),
            self.y_size(),
            self.z_size()
        )

    def x_size(self):
        return self.properties['width']

    def y_size(self):
        return self.properties['length']

    def z_size(self):
        return self.properties['height']

    def get_all_children(self):
        my_children = self.get_children_list()
        children = []
        children.extend(my_children)
        for child in my_children:
            children.extend(child.get_all_children())
        return children

    def max_dimensions(self, reference):
        if reference in self._max_dimensions:
            return self._max_dimensions[reference]

        children = [
            (
                child,
                child.from_center(x=1, y=1, z=1, reference=reference)
            )
            for child in self.get_all_children()]

        res = [max(children, key=lambda a: a[1][axis])
               for axis in range(3)]
        self._max_dimensions[reference] = res

        return res

    def from_polar(self, r, theta, h):
        center = self.size() / 2.0

        r = r * center['x']

        return center + Vector(r * math.cos(theta),
                               r * math.sin(theta),
                               center['z'] * h)

    def center(self, reference=None):
        return self.from_center(x=0.0, y=0.0, z=0.0, reference=reference)

    def from_cartesian(self, x, y, z):
        center = self.size() / 2.0
        return center + center * Vector(x, y, z)

    def from_center(self, x=None, y=None, z=None, r=None,
                    theta=None, h=None, reference=None):
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
    def containers(self) -> list:
        containers = []
        for slot in self:
            for container in slot:
                containers.append(container)
        return containers

    def has_container(self, query):
        return query in self.containers()


class Well(Placeable):
    pass


class Slot(Placeable):
    pass


class Container(Placeable):
    def __init__(self, *args, **kwargs):
        super(Container, self).__init__(*args, **kwargs)
        self.grid = None
        self.grid_transposed = None

    def invalidate_grid(self):
        self.grid = None
        self.grid_transposed = None

    def calculate_grid(self):
        if self.grid is None:
            self.grid = self.get_wellseries(self.get_grid())

        if self.grid_transposed is None:
            self.grid_transposed = self.get_wellseries(
                self.transpose(
                    self.get_grid()))

    def get_grid(self):
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
        res = OrderedDict()
        for row, cols in rows.items():
            for col, cell in cols.items():
                if col not in res:
                    res[col] = OrderedDict()
                res[col][row] = cell
        return res

    def get_wellseries(self, matrix):
        res = OrderedDict()
        for row, cells in matrix.items():
            if row not in res:
                res[row] = OrderedDict()
            for col, cell in cells.items():
                res[row][col] = self.children_by_name[
                    ''.join(reversed(cell))
                ]
            res[row] = WellSeries(res[row])
        return WellSeries(res)

    @property
    def rows(self):
        self.calculate_grid()
        return self.grid

    @property
    def columns(self):
        self.calculate_grid()
        return self.grid_transposed

    @property
    def cols(self):
        return self.columns

    def well(self, name):
        return self.get_child_by_name(name)

    def wells(self):
        return self.get_children()


class WellSeries(Placeable):
    def __init__(self, items):
        self.items = items
        self.values = list(self.items.values())
        self.offset = 0

    def set_offset(self, offset):
        self.offset = offset

    def __iter__(self):
        return iter(self.values)

    def __str__(self):
        return '<Series: {}>'.format(
            ' '.join([str(well) for well in self.values]))

    def __getitem__(self, index):
        if isinstance(index, str):
            return self.items[index]
        else:
            return list(self.values)[index]

    def __getattr__(self, name):
        return getattr(self.values[self.offset], name)
