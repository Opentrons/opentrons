import numpy as np
from collections import namedtuple, UserDict
from typing import Dict, List
from functools import partial
from numpy.linalg import inv
from functools import reduce

ROOT = 'root'


class Point(namedtuple('Point', 'x y z')):
    def __str__(self):
        return str([*self])


def translate(point) -> np.ndarray:
    x, y, z = point
    return np.array([
        [1.0, 0.0, 0.0, x],
        [0.0, 1.0, 0.0, y],
        [0.0, 0.0, 1.0, z],
        [0.0, 0.0, 0.0, 1.0]
    ])


class Node(namedtuple('Node', 'parent children transform')):
    def add(self, child):
        return self._replace(children=self.children + [child])

    def remove(self, child):
        children = self.children.copy()
        children.remove(child)
        return self._replace(children=children)

    def update(self, transform: np.ndarray):
        res = self._replace(transform=transform)
        return res

    def __eq__(self, operand):
        *values1, transform1 = self
        *values2, transform2 = operand
        return all([v1 == v2 for v1, v2 in zip(values1, values2)]) and \
            (transform1 == transform2).all()


def init():
    return add({}, ROOT, parent=None)


def add(
        state: Dict[object, Node],
        obj,
        parent=ROOT,
        point=Point(0, 0, 0),
        transform=np.identity(4)) -> Dict[object, Node]:

    state = bind(state)

    if parent is not None:
        state[parent] = state[parent].add(obj)

    assert obj not in state, 'object is already being tracked'

    state[obj] = Node(
        parent=parent,
        children=[],
        transform=transform.dot(inv(translate(point)))
    )

    return state


def remove(state, obj):
    state = state.copy()
    nodes = descendants(state, obj) + [(obj, 0)]

    # remove object references from their parent's children
    for child, *_ in nodes:
        parent = state[child].parent
        if parent in state:
            state[parent] = state[parent].remove(child)
        del state[child]
    return state


def update(state, obj, point: Point, transform=np.identity(4)):
    state = state.copy()
    state[obj] = state[obj].update(
        transform.dot(inv(translate(point)))
    )
    return state


def descendants(state, obj, level=0):
    """ Returns a flattened list tuples of DFS traversal of subtree
    from object that contains descendant object and it's depth """
    return sum([
        [(child, level)] + descendants(state, child, level + 1)
        for child in state[obj].children
    ], [])


def ascend(state, obj, root=None) -> List[Node]:
    if obj is root:
        return []
    parent = state[obj].parent
    return [obj] + ascend(state, obj=parent, root=root)


def forward(state, obj, root=None):
    return reduce(
        lambda a, b: a.dot(b),
        [
            state[key].transform
            for key in reversed(ascend(state, obj=obj, root=root))
        ],
        np.identity(4)
    )


def reverse(state, obj, root=None):
    return inv(reduce(
        lambda a, b: a.dot(b),
        [
            state[key].transform
            for key in ascend(state, obj=obj, root=root)
        ],
        np.identity(4)
    ))


def absolute(state, obj, root=None):
    """absolute position of an object in a sub-tree of a root"""
    return reverse(state, obj, root).dot((0, 0, 0, 1))[:-1]


def relative(state, src, dst, root=None):
    """Relative vector from src (source) to dst (destination)
    in root's subtree. if root is none — in the entire tree"""
    x, y, z = absolute(state, obj=src, root=root)
    return forward(state, dst, root=root).dot((x, y, z, 1))[:-1]


def max_z(state, root):
    return max([
        Point(*absolute(state, obj=obj, root=root)).z
        for obj, _ in descendants(state, root)
    ])


def stringify(state, root=None):
    if root is None:
        root = ascend(state, next(iter(state)))[-1]

    info = [
        (obj, level, get(state, obj), relative(state, src=obj, dst=root))
        for obj, level in [(root, 0)] + descendants(state, root, level=1)]

    return '\n'.join([
        ' ' * level + '{} {} {}'.format(str(obj), relative, world)
        for obj, level, relative, world in info
    ])


def get(state, obj):
    return relative(state, src=obj, dst=state[obj].parent)


def bind(state):
    state = UserDict(state.copy())
    # add syntax sugar for chaining add operations
    state.add = partial(add, state)

    return state
