import functools
import itertools
from collections import namedtuple, UserDict
from typing import Dict, List

import numpy as np  # type: ignore
from numpy.linalg import inv  # type: ignore

ROOT = 'root'


class Point(namedtuple('Point', 'x y z')):
    def __str__(self):
        return str([*self])


def translate(point) -> np.ndarray:
    x, y, z = point
    return np.array([
        [1.0, 0.0, 0.0,   x],
        [0.0, 1.0, 0.0,   y],
        [0.0, 0.0, 1.0,   z],
        [0.0, 0.0, 0.0, 1.0]
    ])


def extract_transform(matrix) -> np.ndarray:
    """Extract transformation elements from a matrix"""
    return matrix * np.array([
        [1, 1, 1, 0],
        [1, 1, 1, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 1],
    ])


def inverse(matrix) -> np.ndarray:
    return inv(matrix)


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

    if isinstance(transform, list):
        transform = np.array(transform)

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


def has_children(state, obj):
    return True if len(descendants(state, obj)) > 0 else False


def ascend(state, start, finish=ROOT) -> List[Node]:
    if start is finish:
        return [finish]
    return [start] + ascend(state, start=state[start].parent, finish=finish)


def change_base(state, point=Point(0, 0, 0), src=ROOT, dst=ROOT):
    """
    Transforms point from source coordinate system to destination.
    Point(0, 0, 0) means the origin of the source.
    """
    def fold(objects):
        return functools.reduce(
            lambda a, b: a.dot(b),
            [state[key].transform for key in objects],
            np.identity(4)
        )

    up, down = ascend(state, src), list(reversed(ascend(state, dst)))

    # Find common prefix. Last item is common root
    root = [n1 for n1, n2 in zip(reversed(up), down) if n1 is n2].pop()

    # Nodes up to root, EXCLUDING root
    up = list(itertools.takewhile(lambda node: node is not root, up))

    # Nodes down from root, EXCLUDING root
    down = list(itertools.dropwhile(lambda node: node is not root, down))[1:]

    # Point in root's coordinate system
    point_in_root = inv(fold(up)).dot((*point, 1))

    # Return point in destination's coordinate system
    return fold(down).dot(point_in_root)[:-1]


def absolute(state, obj):
    """
    Get the (x, y, z) position of an object relative to origin of the pose tree
    """
    return change_base(state, src=obj)


def max_z(state, root):
    test = [
        (obj, Point(*change_base(state, src=obj, dst=root)).z)
        for obj, _ in descendants(state, root)
    ]

    # from pprint import pprint
    # pprint(test, indent=2)
    m = max([i[1] for i in test])
    return m


def stringify(state, root=None):
    if root is None:
        root = ascend(state, next(iter(state)))[-1]

    info = [
        (obj, level, change_base(state, src=obj, dst=root))
        for obj, level in [(root, 0)] + descendants(state, root, level=1)]

    return '\n'.join([
        ' ' * level + '{} {}'.format(str(obj), world)
        for obj, level, world in info
    ])


def bind(state):
    state = UserDict(state.copy())
    # add syntax sugar for chaining add operations
    state.add = functools.partial(add, state)

    return state
