from collections import OrderedDict


class Placeable(object):

    def __init__(self, coordinates=None, parent=None):
        self.name = None
        self.children =  OrderedDict()
        self.parent = parent
        self.coordinates = (0, 0, 50)

    def get_coordinates(self, reference=None):
        if not reference:
            return self.parent.get_child_coordinates(self)

        parents = []
        parent  = self.get_parent()
        while parent:
            parents.append(parent)
            if reference == parent:
                break
            parent = parent.get_parent()

        if reference not in parents:
            raise Exception('Parent is not in Ancestry')

        x, y, z = 0, 0, 0
        for i in parents:
            i_x, i_y, i_z = i.get_coordinates()
            x += i_x
            y += i_y
            z += i_z
        return (x, y, z)

    def get_child_coordinates(self, child=None, name=None):
        if child in self.children:
            return self.children[child]

        for child, child_info in self.children.items():
            if child_info['name'] == name:
                return child

    def add_child(self, child, name, coordinates):
        if child  in self.children:
            raise Exception('Child previously added')

        child.parent = self
        self.children[child] = {'name': name, 'coordinates': coordinates}

    def remove_child(self, child):
        del self.children[child]

    def get_parent(self):
        return self.parent

    def get_children(self):
        return self.children

    def __iter__(self):
        return self.children.keys()

    def __next__(self):
        if not self.get_parent():
            raise Exception('Must have a parent')

        children = list(self.parent.get_children().keys())
        my_loc = children.index(self)
        return children[my_loc + 1]

    def __getitem__(self, name):
        return self.get_child_by_name(name)

    def get_child_by_name(self, name):
        for child, child_info in self.get_children():
            if child_info['name'] == name:
                return child

class Deck(Placeable):
    def get_containers(self):
        return self.get_children()

    def get_container(self):
        pass

class Slot(Placeable):
    pass


class Container(Placeable):
    def well(self, name):
        return self.get_child_by_name(name)

    def wells(self):
        return self.get_children()


class Well(Placeable):
    def __init__(self, properties : dict, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.properties = properties



d = Deck()
s = Slot(name='A1')
c = Container(name='Microplate')

wells = [
    Well(name='A{}'.format(i))
    for i in range(1,13)
]

c.add_children(wells)

s.add_child('A1', c)


