import numpy

# not sure if this swinging too far against 'custom vector'
from pyrr import matrix44, vector4



# Double check the real meaning of pose
# Also not dealing with roation at all

DUMMY = 1 # Sometimes added to vectors to maintain matrix values

class Pose(object):
    def __init__(self, x, y, z):
        self._pose = matrix44.create_identity()
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

class PositionTracker(object):
    def __init__(self):
        self._position_dict = {}

    def __getitem__(self, obj):
        try:
            return self._position_dict[id(obj)]
        except KeyError:
            raise KeyError("Position not tracked: {}".format(obj))

    def __setitem__(self, obj, value):
        if not isinstance(value, Pose):
            raise TypeError("{} is not an instance of Pose".format(value))
        self._position_dict[id(obj)] = value

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
        self[obj] = pose

    def track_relative_object(self, new_obj, tracked_obj, x, y, z):
        '''
        Adds an object to the dict of object positions
        given another object and relative positioning

        :param new_obj:     object to be added to position dict
        :param tracked_obj: already tracked object that this object is position relative to
        :param x, y, z: relative translation between the two objects
        :return: None
        '''
        glb_x, glb_y, glb_z, dummy = self[tracked_obj] * [x, y, z, DUMMY]
        self.track_object(new_obj, glb_x, glb_y, glb_z)

    def remove_object(self, obj):
        del self[obj]

    def get_object_position(self, obj):
        return self[obj]

    def adjust_object(self, obj, x, y, z):
        new_coords = self[obj] * vector4.create(x, y, z, DUMMY)
        new_pose   = Pose(*new_coords)
        self[obj]  = new_pose
