import numpy as np
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
    def __init__(self, object, parent=None):
        self.value = object
        self.parent = parent
        self.children = []

    def __repr__(self):
        ret = pprint_tree(self, level=0)
        return ret

    def add_child(self, child_node):
        child_node.parent = self
        self.children.append(child_node)


class Pose(object):
    def __init__(self, x, y, z):
        self._pose = np.identity(4)
        self.x = x
        self.y = y
        self.z = z

    def __repr__(self):
        return repr(self._pose)

    def __eq__(self, other):
        return (self._pose == other._pose).all()

    # TODO: (JG 9/19/17) Revisit this once we start dealing with rotation
    # to make sure we are doing this in the most expected way
    def __mul__(self, other):
        return Pose(*self._pose.dot(other)[:3])

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
    Tracks pose of all objects on deck using a dictionary and a tree.
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

        subscribe(topics.MOVEMENT, self._object_moved)

    def __getitem__(self, obj):
        try:
            return self._pose_dict[obj]
        except KeyError:
            # FIXME:(Jared 09/12) remove WellSeries
            if isinstance(obj, WellSeries):
                return self._pose_dict[obj[0]]
            raise KeyError("Object pose is not tracked: {}".format(obj))

    def __contains__(self, item):
        return item in self._pose_dict

    def __iter__(self):
        return iter(self._pose_dict.items())

    def __setitem__(self, obj, pose):
        if not isinstance(pose, Pose):
            raise TypeError("{} is not an instance of Pose".format(pose))
        self._pose_dict[obj] = pose

    def __str__(self):
        tree_repr = ''
        for root in self._root_nodes:
            pos_context = '\n\n' + repr(root)
            tree_repr += pos_context
        return tree_repr

    def get_objects_in_subtree(self, root):
        '''Returns a list of objects in a subtree using a DFS tree traversal'''
        return flatten([root, [self.get_objects_in_subtree(item)
                               for item in self.get_object_children(root)]])

    def max_z_in_subtree(self, root):
        return max([self[obj].z for obj in
                    self.get_objects_in_subtree(root)])

    def track_object(self, parent, obj, x, y, z):
        '''Adds an object to the dict of object positions'''
        parent_position = self[parent].position
        obj_position = parent_position + [x, y, z]
        object_pose = Pose(*obj_position)
        node = Node(obj)

        self._node_dict[parent].add_child(node)
        self._node_dict[obj] = node
        self._pose_dict[obj] = object_pose

    def create_root_object(self, obj, x, y, z):
        '''Create a root node in the position tree. Though this could be done
        in the track_object() function if no parent is passed, we require
        this to be explicit because creating a new mapping context should
        not be a default behavior'''
        pose = Pose(x, y, z)
        node = Node(obj)
        self[obj] = pose
        self._node_dict[obj] = node
        self._root_nodes.append(node)

    def get_object_children(self, obj):
        '''Returns a list of child objects'''
        node = self._node_dict[obj]
        return [child.value for child in node.children]

    def _translate_object(self, obj_to_trans, x, y, z):
        '''Translates a single object'''
        self[obj_to_trans] *= [x, y, z, 1]

    def translate_object(self, obj_to_trans, x, y, z):
        '''Translates an object and its descendants'''
        self._translate_object(obj_to_trans, x, y, z)
        [self.translate_object(child, x, y, z)
         for child in self.get_object_children(obj_to_trans)]  # recursive

    def _object_moved(self, new_pos_msg: new_pos_msg):
        '''Calculates an object movement as diff between current position
        and previous - translates moved object and its descendants
        by this difference'''
        mover, *new_pos = new_pos_msg
        self.translate_object(mover, *(new_pos - self[mover].position))

    def relative_object_position(self, target_object, reference_object):
        return self[target_object].position - self[reference_object].position

    def clear_all(self):
        self._root_nodes = []
        self._pose_dict = {}
        self._node_dict = {}