from collections import OrderedDict


class Placeable(object):

    def __init__(self, parent=None):
        self.name = None
        self.children = OrderedDict()
        self.parent = parent

    def __getitem__(self, name):
        if isinstance(name, int):
            return list(self.children.keys())[name]
        else:
            return self.get_child_by_name(name)

    def __iter__(self):
        return iter(self.children.keys())

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

    def get_child_by_name(self, name):
        for child, child_info in self.get_children().items():
            if child_info['name'] == name:
                return child


class Deck(Placeable):
    def get_containers(self):
        return self.get_children()

    def get_container(self):
        pass


class Slot(Placeable):
    def add(self, child, name='slot', coordinates=(0, 0, 0)):
        super().add(child, name, coordinates)


class Container(Placeable):
    def well(self, name):
        return self.get_child_by_name(name)

    def wells(self):
        return self.get_children().keys


class Well(Placeable):
    def __init__(self, properties=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.properties = properties
