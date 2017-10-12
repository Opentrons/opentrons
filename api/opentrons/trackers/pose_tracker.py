import numpy as np
from functools import reduce
from typing import Dict, List

from opentrons.containers.placeable import WellSeries
from opentrons.trackers.move_msgs import new_pos_msg
from opentrons.broker import topics, subscribe


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
    def __init__(self, x: float, y: float, z: float) -> None:
        self._pose = np.identity(4)
        self._pose[0][3] = x
        self._pose[1][3] = y
        self._pose[2][3] = z

    def __repr__(self):
        return repr(self._pose)

    def __eq__(self, other):
        return (self._pose == other._pose).all()

    # TODO: (JG 9/19/17) Revisit this once we start dealing with rotation
    # to make sure we are doing this in the most expected way
    def __mul__(self, other):
        if not isinstance(other, Pose):
            other_pose = Pose(*other[:3])
        else:
            other_pose = other

        return Pose(*self._pose.dot(other_pose._pose).T[3][:3])

    @property
    def x(self):
        return self._pose[0][3]

    @x.setter
    def x(self, val):
        self._pose[0][3] = val

    @property
    def y(self):
        return self._pose[1][3]

    @y.setter
    def y(self, val):
        self._pose[1][3] = val

    @property
    def z(self):
        return self._pose[2][3]

    @z.setter
    def z(self, val):
        self._pose[2][3] = val

    @property
    def position(self):
        return np.array([self.x, self.y, self.z])


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
        print('POSE TRACKER CREATED')
        self._root_nodes = []
        self._pose_dict = {}
        self._node_dict = {}

        subscribe(topics.MOVEMENT, self._on_move_position)

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

    def track_object(self, parent, obj, x, y, z):
        '''Adds an object to the dict of object positions'''
        relative_object_pose = Pose(x=x, y=y, z=z)
        node = Node(obj)

        self._node_dict[parent].add_child(node)
        self._node_dict[obj] = node
        self._pose_dict[obj] = relative_object_pose

    def create_root_object(self, obj, x, y, z):
        '''Create a root node in the position tree. Though this could be done
        in the track_object() function if no parent is passed, we require
        this to be explicit because creating a new mapping context should
        not be a default behavior'''
        pose = Pose(x, y, z)
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

    def translate_object(self, obj, x, y, z):
        '''Translates a single object'''
        new_pose = self.relative(obj) * [x, y, z, 1]
        self._pose_dict[obj] = new_pose

    def _on_move_position(self, new_pos_msg: new_pos_msg):
        '''Calculates an object movement as diff between current position
        and previous - translates moved object by the difference'''
        mover, *new_pos = new_pos_msg
        self.translate_object(mover, *(new_pos - self._pose_dict[mover].position))

    def relative_object_position(self, target_object, reference_object):
        return self._pose_dict[target_object].position - self._pose_dict[reference_object].position

    def clear_all(self):
        self._root_nodes = []
        self._pose_dict = {}
        self._node_dict = {}