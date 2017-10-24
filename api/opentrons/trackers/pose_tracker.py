import numpy as np
from functools import reduce
from typing import Dict, List

from opentrons.containers.placeable import WellSeries
from opentrons.trackers.move_msgs import new_pos_msg
from opentrons.broker import topics, subscribe

from numpy import dot, array
from numpy.linalg import inv


def flatten(S):
    if S == []:
        return S
    if isinstance(S[0], list):
        return flatten(S[0]) + flatten(S[1:])
    return S[:1] + flatten(S[1:])


def pprint_tree(node, level):
    ret = '\t' * level + repr(node.value) + '\n'
    for child in node.children:
        ret += pprint_tree(child, level + 1)
    return ret


class Node(object):
    def __init__(self, obj, parent=None):
        self.value = obj
        self.parent = parent
        self.children = []

    def __repr__(self):
        ret = pprint_tree(self, level=0)
        return ret

    def add_child(self, child_node):
        child_node.parent = self
        self.children.append(child_node)


class Pose(object):
    zero = np.array([0, 0, 0, 1])

    def __init__(
        self,
        x: float,
        y: float,
        z: float,
        transform: np.ndarray=np.identity(4)
    ) -> None:
        self._transform = transform
        self._pose = array([
            [1.0, 0.0, 0.0,   x],
            [0.0, 1.0, 0.0,   y],
            [0.0, 0.0, 1.0,   z],
            [0.0, 0.0, 0.0, 1.0]
        ])

    def __repr__(self):
        return repr(self._pose) + '\n' + repr(self._transform)

    def __eq__(self, other):
        return (self.T == other.T).all()

    def __mul__(self, other):
        if not isinstance(other, Pose):
            other = Pose(*other[:3])

        return Pose(x=0, y=0, z=0, transform=self.T.dot(other.T))

    @property
    def x(self):
        return self.position[0]

    @x.setter
    def x(self, val):
        self._pose[0][3] = val

    @property
    def y(self):
        return self.position[1]

    @y.setter
    def y(self, val):
        self._pose[1][3] = val

    @property
    def z(self):
        return self.position[2]

    @z.setter
    def z(self, val):
        self._pose[2][3] = val

    @property
    def T(self):
        return dot(self._pose, self._transform)

    @property
    def position(self):
        return tuple(dot(self.T, Pose.zero)[:-1])


class PoseTracker(object):
    '''
    Tracks pose of all objects on deck using a dictionary and a tree. A pose is a transformation matrix that contains
    the position and rotation information for one object relative to another.
    _pose_dict is a dict that maps objects to poses (np arrays)
    _node_dict is a dict that maps objects to their nodes
        in the tree. The tree holds relationships between objects.
        an object is a child of another if, when that objects moves,
        its child does as well.
    '''
    pose_tracker_singleton = None #FIXME: [JG & Andy | 9/27] HACKY SINGLETON

    def __init__(self):
        self._root_nodes = []
        self._pose_dict = {}
        self._node_dict = {}

    def relative(self, obj) -> Pose:
        '''
        :param obj: an object whose Pose is tracked
        :return: a Pose representing the relative Pose from the object's parent to itself
        '''
        return self._pose_dict[obj]

    def absolute(self, obj) -> Pose:
        '''
        :param obj: an object whose Pose is tracked
        :return: a Pose representing the absolute Pose in the global coordinate system
        '''
        if isinstance(obj, WellSeries):
            ancestor_poses = self._get_transform_sequence(obj[0])  # type: List[Pose]
        else:
            ancestor_poses = self._get_transform_sequence(obj)  # type: List[Pose]

        def reduce_fn(parent: Pose, child: Pose) -> Pose:
            return parent * child

        return reduce(reduce_fn, ancestor_poses)

    def __getitem__(self, obj) -> Pose:
        return self.absolute(obj)

    def __contains__(self, item):
        return item in self._pose_dict

    def __iter__(self):
        return iter(self._pose_dict.items())

    def __str__(self):
        tree_repr = ''
        for root in self._root_nodes:
            pos_context = '\n\n' + repr(root)
            tree_repr += pos_context
        return tree_repr

    def max_z_in_subtree(self, root):
        return max([self.absolute(obj).z for obj in
                    self.get_objects_in_subtree(root)])

    def track_object(self, parent, obj, x, y, z, transform=np.identity(4)):
        '''Adds an object to the dict of object positions'''
        relative_object_pose = Pose(x=x, y=y, z=z, transform=transform)
        node = Node(obj)

        self._node_dict[parent].add_child(node)
        self._node_dict[obj] = node
        self._pose_dict[obj] = relative_object_pose

    def create_root_object(self, obj, x, y, z, transform=np.identity(4)):
        '''Create a root node in the position tree. Though this could be done
        in the track_object() function if no parent is passed, we require
        this to be explicit because creating a new mapping context should
        not be a default behavior'''
        pose = Pose(x, y, z, transform=transform)
        node = Node(obj)
        self._pose_dict[obj] = pose
        self._node_dict[obj] = node
        self._root_nodes.append(node)

    def get_objects_in_subtree(self, root):
        return flatten([root, [self.get_objects_in_subtree(item)
                               for item in self.get_object_children(root)]])

    def _get_transform_sequence(self, root) -> List[Pose]:
        '''Returns a list of objects in a subtree using a DFS tree traversal'''
        root_node = self._node_dict[root]
        if root_node.parent is None:
            return [self.relative(root)]
        return flatten([self._get_transform_sequence(root_node.parent.value), self.relative(root)])

    def get_object_children(self, obj):
        '''Returns a list of child objects'''
        node = self._node_dict[obj]
        return [child.value for child in node.children]

    def translate_object(self, obj, x, y, z, transform=np.identity(4)):
        '''Translates a single object'''
        new_pose = self.relative(obj) * Pose(x, y, z, transform)
        self._pose_dict[obj] = new_pose

    def relative_object_position(self, reference_object, target_object):
        """
        Returns a World Coordinates vector such as, when added
        to world coordinates of reference_object returns world coordinates
        of target_object
        """
        def reverse_transform(poses):
            return reduce(
                lambda p1, p2: p1.dot(p2),
                [inv(pose._transform).dot(pose._pose) for pose in poses]
            ).dot((0, 0, 0, 1))[:-1]

        target = self._get_transform_sequence(target_object)
        reference = self._get_transform_sequence(reference_object)

        return tuple(reverse_transform(target) - reverse_transform(reference))

    def clear_all(self):
        self._root_nodes = []
        self._pose_dict = {}
        self._node_dict = {}
