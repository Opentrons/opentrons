import math
import numbers
from collections import OrderedDict


def unpack_location(location):
    coordinates = None
    placeable = None
    if isinstance(location, Placeable):
        coordinates = location.center()
        placeable = location
    elif isinstance(location, tuple):
        placeable, coordinates = location
    else:
        raise ValueError(
            'Location should be (Placeable, (x, y, z)) or Placeable'
        )
    return (placeable, coordinates)


class Placeable(object):

    def __init__(self, parent=None, properties=None):
        self.children = OrderedDict()
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

        # TODO: perhaps add checking width/length to verification
        # assert 'width' in properties
        # assert 'length' in properties

    def __getitem__(self, name):
        if isinstance(name, int):
            return self.get_children_list()[name]
        else:
            return self.get_child_by_name(name)

    def __str__(self):
        if not self.parent:
            return '<{}>'.format(self.__class__.__name__)
        return '<{} {}>'.format(self.__class__.__name__, self.get_name())

    def __iter__(self):
        return iter(v['instance'] for k, v in self.children.items())

    def __len__(self):
        return len(self.children)

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

        for name, data in self.parent.children.items():
            if data['instance'] == self:
                return name

    def get_children_list(self):
        return list([v['instance'] for k, v in self.children.items()])

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
        if not self.parent:
            return (0, 0, 0)

        if not reference:
            return self.parent.get_child_coordinates(self)

        trace = self.get_trace(reference)

        x, y, z = 0, 0, 0
        for i in trace:
            i_x, i_y, i_z = i.coordinates()
            x += i_x
            y += i_y
            z += i_z
        return (x, y, z)

    def get_child_coordinates(self, child):
        if isinstance(child, Placeable):
            for k, v in self.children.items():
                if v['instance'] == child:
                    return v['coordinates']

        # if not instance of Placeable, assume name
        if child in self.children:
            return self.children[child]['coordinates']

    def add(self, child, name, coordinates):
        if name in self.children:
            raise Exception('Child with the name {} already exists'
                            .format(name))

        child.parent = self
        self.children[name] = {'instance': child, 'coordinates': coordinates}

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
        del self.children[name]

    def get_parent(self):
        return self.parent

    def get_children(self):
        return self.children

    def get_child_by_name(self, name):
        return self.children[name]['instance']

    # axis_length is here to avoid confision with
    # height, width, depth
    def x_length(self):
        return self.properties['width']

    # axis_length is here to avoid confision with
    # height, width, depth
    def y_length(self):
        return self.properties['length']

    # TODO: add support for H
    def from_polar(self, r, theta, h):
        x = self.x_length() / 2.0
        y = self.y_length() / 2.0
        r = x
        return (x + r * math.cos(-theta),
                y + r * math.sin(-theta),
                h)

    def center(self, reference=None):
        return self.from_center(x=0.0, y=0.0, z=0.0, reference=reference)

    # TODO: add support for relative Z coordinates
    def from_cartesian(self, x, y, z):
        x_center = (self.x_length() / 2.0)
        y_center = (self.y_length() / 2.0)

        return (x_center + x_center * x,
                y_center + y_center * y,
                z)

    def from_center(self, x=None, y=None, z=None, r=None,
                    theta=None, h=None, reference=None):
        coords_to_endpoint = None
        if all([isinstance(i, numbers.Number) for i in (x, y, z)]):
            coords_to_endpoint = self.from_cartesian(x, y, z)

        if all([isinstance(i, numbers.Number) for i in (r, theta, h)]):
            coords_to_endpoint = self.from_polar(r, theta, h)

        deck = self.get_deck()

        coords_to_reference = (0, 0, 0)
        if reference:
            coords_to_reference = self.coordinates(reference)

        res = tuple(a + b for a, b in
                    zip(coords_to_reference, coords_to_endpoint))

        return res


class Deck(Placeable):
    def containers(self) -> list:
        containers = []
        for slot in self:
            for container in slot:
                containers.append(container)
        return containers

    def has_container(self, query):
        return query in self.containers()


class Slot(Placeable):
    def add(self, child, name='slot', coordinates=(0, 0, 0)):
        super().add(child, name, coordinates)


class Container(Placeable):
    def well(self, name):
        return self.get_child_by_name(name)

    def wells(self):
        return self.get_children()


class Well(Placeable):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

