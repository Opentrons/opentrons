import numpy as np
from collections import namedtuple
from typing import Dict, List


class Point(namedtuple('Point', 'x y z')):
    def __str__(self):
        return str([*self])


def translate(point: Point) -> np.ndarray:
    return np.array([
        [1.0, 0.0, 0.0, point.x],
        [0.0, 1.0, 0.0, point.y],
        [0.0, 0.0, 1.0, point.z],
        [0.0, 0.0, 0.0,     1.0]
    ])


def scale(cx, cy, cz) -> np.ndarray:
    return np.array([
        [ cx, 0.0, 0.0,   0],  # noqa
        [0.0,  cy, 0.0,   0],
        [0.0, 0.0,  cz,   0],
        [0.0, 0.0, 0.0, 1.0]
    ])


def rotate(theta: float) -> np.ndarray:
    from math import sin, cos
    return np.array([
        [cos(theta), -sin(theta), 0.0,   0],
        [sin(theta),  cos(theta), 0.0,   0],
        [       0.0,         0.0, 1.0,   0],  # noqa
        [       0.0,         0.0, 0.0, 1.0]   # noqa
    ])


class Node(namedtuple('Node', 'parent children transform')):
    def add(self, child):
        return self._replace(children=self.children + [child])

    def remove(self, child):
        children = self.children.copy()
        children.remove(child)
        return self._replace(children=children)

    def update(self, transform):
        res = self._replace(transform=transform)
        return res

    def __eq__(self, operand):
        *values1, transform1 = self
        *values2, transform2 = operand
        return all([v1 == v2 for v1, v2 in zip(values1, values2)]) and \
            (transform1 == transform2).all()


def add(
        state: Dict[object, Node],
        obj,
        parent=None,
        point=Point(0, 0, 0),
        transform=np.identity(4)) -> Dict[object, Node]:

    state = state.copy()

    if parent is None:
        assert not state, 'root node already exists — only one allowed'
    else:
        state[parent] = state[parent].add(obj)

    assert obj not in state
    t = transform.dot(translate(point))
    state[obj] = Node(parent=parent, children=[], transform=t)

    return state


def remove(state, obj):
    state = state.copy()
    nodes = children(state, obj) + [(obj, 0)]

    # remove object references from their parent's children
    for child, *_ in nodes:
        parent = state[child].parent
        if parent in state:
            state[parent] = state[parent].remove(child)
        del state[child]
    return state


def update(state, obj, point, transform=np.identity(4)):
    state = state.copy()
    state[obj] = state[obj].update(
        transform.dot(translate(point))
    )
    return state


def children(state, obj, level=0):
    """ Returns a flattened list tuples of DFS traversal of subtree
    from object that contains descendant object and it's depth """
    return sum([
        [(child, level)] + children(state, child, level+1)
        for child in state[obj].children
    ], [])


def ascend(state, obj) -> List[Node]:
    parent = state[obj].parent
    if parent is None:
        return [obj]
    return [obj] + ascend(state, parent)


def absolute(state, obj, operator=np.dot, ref=(0, 0, 0)):
    from functools import reduce
    return reduce(
        lambda a, b: operator(b, a),
        [
            state[key].transform
            for key in ascend(state, obj)
        ],
        list(ref) + [1.0]
    )[:-1]


def relative(state, src, dst):
    """Relative vector from src (source) to dst (destination)"""
    from numpy.linalg import inv
    ref = absolute(state, dst)
    return absolute(state, src, operator=lambda a, b: inv(a).dot(b), ref=ref)


def max_z(state, root):
    return max([
        Point(*relative(state, src=root, dst=obj)).z
        for obj, _ in children(state, root)
    ])


def stringify(state, root=None):
    if root is None:
        root = ascend(state, next(iter(state)))[-1]

    info = [
        (obj, level, get(state, obj), absolute(state, obj))
        for obj, level in [(root, 0)] + children(state, root, level=1)]

    return '\n'.join([
        ' ' * level + '{} {} {}'.format(str(obj), relative, world)
        for obj, level, relative, world in info
    ])


def get(state, obj):
    x, y, z, *_ = state[obj].transform.dot((0.0, 0.0, 0.0, 1.0))
    return Point(x, y, z)
