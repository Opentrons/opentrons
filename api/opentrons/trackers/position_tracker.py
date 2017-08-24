import numpy
from opentrons.util.trace import MessageBroker
from opentrons.pubsub_util.topics import MOVEMENT
from opentrons.pubsub_util.messages.movement import moved_msg



class Node(object):
    def __init__(self, object):
        self.children = []
        self.parent = None
        self.value = object

DUMMY = 1 # Sometimes added to vectors to maintain matrix values

class Pose(object):
    def __init__(self, x, y, z):
        self._pose = numpy.identity(4)
        self.x = x
        self.y = y
        self.z = z

    def __repr__(self):
        return repr(self._pose)

    def __eq__(self, other):
        return (self._pose == other._pose).all()

    def __mul__(self, other):
        return self._pose.dot(other)

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
        return (self.x, self.y, self.z)

class PositionTracker(object):
    def __init__(self, broker: MessageBroker):
        self._position_dict = {}
        broker.subscribe(MOVEMENT, self._object_moved)

    def __getitem__(self, obj):
        try:
            return self._position_dict[obj][0]
        except KeyError:
            raise KeyError("Position not tracked: {}".format(obj))

    def __contains__(self, item):
        return item in self._position_dict

    def __setitem__(self, obj, pose):
        if not isinstance(pose, Pose):
            raise TypeError("{} is not an instance of Pose".format(pose))
        print(self._position_dict[obj][0])
        self._position_dict[obj] = (pose, self._position_dict[obj][1])

    def __repr__(self):
        return repr(self._position_dict)

    def track_object(self, obj, x, y, z):
        '''
        Adds an object to the dict of object positions

        :param obj: Object to add to the position dict
        :param x, y, z: global object position
        :return: None
        '''
        pose = Pose(x, y, z)
        node = self._position_dict[parent][1].add_child(obj)
        self._position_dict[obj] = (pose, node)

    def create_root_object(self, obj, x, y, z):
        '''Create a root node in the position tree. This is a node without a parent.
        There is no difference between a root and a child aside from the fact that a root has no parent.
        However, if you are constructing a new mapping context you better know what you're doing!'''
        pose = Pose(x, y, z)
        node = Node(obj)
        self._position_dict[obj] = (pose, node)

    def track_relative_object(self, new_obj, tracked_obj, x, y, z):
        '''
        Adds an object to the dict of object positions
        given another object and relative positioning

        :param new_obj:     object to be added to position dict
        :param tracked_obj: already tracked object that this object is position relative to
        :param x, y, z: relative translation between the two objects
        :return: None
        '''
        glb_x, glb_y, glb_z = self[tracked_obj] * [x, y, z, 1]
        self.track_object(new_obj, glb_x, glb_y, glb_z)

    def get_object_pose(self, obj):
        '''Returns object pose as an instance of the Pose class'''
        return self[obj]

    def get_object_children(self, obj):
        '''Returns a list of child objects'''
        node = self._position_dict[obj][1]
        return [node.value for node in node.children]

    def _translate_object(self, obj_to_trans, x, y, z):
        '''Translates a single object'''
        new_x, new_y, new_z, _ = self[obj_to_trans] * [x, y, z, 1]
        new_pose   = Pose(new_x, new_y, new_z)
        self[obj_to_trans] = new_pose

    def translate_object(self, obj_to_trans, x, y, z):
        '''Translates an object and descendants'''
        self._translate_object(obj_to_trans, x, y, z)
        for child in self.get_object_children(obj_to_trans):
            self.translate_object(child, x, y, z) #recursively translate children

    def _object_moved(self, new_position: moved_msg):
        '''Calculates translation as diff between current position and previous - applies this translation to subtree'''
        moved_object = new_position.moved_object
        old_x, old_y, old_z = self[moved_object].position
        delta_x, delta_y, delta_z = new_position.x - old_x, new_position.y - old_y, new_position.z - old_z
        self.translate_object(moved_object, delta_x, delta_y, delta_z)

