import math
import numbers
from collections import OrderedDict


class Placeable(object):

    def __init__(self, parent=None):
        self.children = OrderedDict()
        self.parent = parent

    def __getitem__(self, name):
        if isinstance(name, int):
            return list(self.children.keys())[name]
        else:
            return self.get_child_by_name(name)

    def __str__(self):
        return '<{} {}>'.format(self.__class__.__name__, self.parent.get_name())

    def __iter__(self):
        return iter(self.children.keys())

    def __len__(self):
        return len(self.children)

    def __bool__(self):
        return True

    def __next__(self):
        if not self.get_parent():
            raise Exception('Must have a parent')

        children = list(self.parent.get_children().keys())
        my_loc = children.index(self)
        return children[my_loc + 1]

    def coordinates(self, reference=None):
        if not self.parent:
            return (0, 0, 0)

        if not reference:
            return self.parent.get_child_coordinates(self)

        trace = [self]
        parent = self.get_parent()
        while parent:
            trace.append(parent)
            if reference == parent:
                break
            parent = parent.get_parent()

        if reference not in trace:
            raise Exception('Parent is not in Ancestry')

        x, y, z = 0, 0, 0
        for i in trace:
            i_x, i_y, i_z = i.coordinates()
            x += i_x
            y += i_y
            z += i_z
        return (x, y, z)

    def get_child_coordinates(self, child=None, name=None):
        if child in self.children:
            return self.children[child]['coordinates']

        for child, child_info in self.children.items():
            if child_info['name'] == name:
                return child

    def add(self, child, name, coordinates):
        if child in self.children:
            raise Exception('Child previously added')

        child.parent = self
        self.children[child] = {'name': name, 'coordinates': coordinates}

    def remove_child(self, child):
        del self.children[child]

    def get_parent(self):
        return self.parent

    def get_children(self):
        return self.children

    def get_name(self, child):
        return self.children[child]['name']

    def get_child_by_name(self, name):
        for child, child_info in self.get_children().items():
            if child_info['name'] == name:
                return child


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
    def __init__(self, properties=None, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if properties is None:
            properties = {}

        self.properties = properties

        if 'radius' in properties:
            properties['width'] = properties['radius'] * 2
            properties['length'] = properties['radius'] * 2

        if 'diameter' in properties:
            properties['width'] = properties['diameter']
            properties['length'] = properties['diameter']

        assert 'width' in properties
        assert 'length' in properties

    def find_parent_deck(self):
        parent = self.parent

        found = False
        while not found:
            if parent is None:
                break
            if isinstance(parent, Deck):
                found = True
                break
            parent = parent.parent

        return parent

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

    # TODO: add support for relative Z coordinates
    def from_cartesian(self, x, y, z):
        x_center = (self.x_length() / 2.0)
        y_center = (self.y_length() / 2.0)

        return (x_center + x_center * x,
                y_center + y_center * y,
                z)

    def from_center(self, x=None, y=None, z=None, r=None, theta=None, h=None):
        coords_to_endpoint = None
        if all([isinstance(i, numbers.Number) for i in (x, y, z)]):
            coords_to_endpoint = self.from_cartesian(x, y, z)

        if all([isinstance(i, numbers.Number) for i in (r, theta, h)]):
            coords_to_endpoint = self.from_polar(r, theta, h)

        deck = self.find_parent_deck()
        coords_to_deck = self.coordinates(deck)
        res = tuple(a + b for a, b in zip(coords_to_deck, coords_to_endpoint))
        return res

