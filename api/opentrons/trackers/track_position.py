import numpy


# Starting with 2D just because I know it...
# Double check the real meaning of pose
# Also not dealing with roation at all

class Pose(object):
    def __init__(self, x, y, z):
        self._pose = numpy.identity(3)
        self.x = x
        self.y = y
        #self.z = z
    def __repr__(self):
        return repr(self._pose)

    @property
    def x(self):
        return self._pose[0][2]
    @x.setter
    def x(self, val):
        self._pose[0][2] = val

    @property
    def y(self):
        return self._pose[1][2]
    @y.setter
    def y(self, val):
        self._pose[1][2] = val

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
        pose = Pose(x, y, z)
        self[obj] = pose

    def remove_object(self, obj):
        del self[obj]

    def get_object_position(self, obj):
        return self[obj]




    # Only if we'll need to do special parsing
    # like building the POS object in track_object
    def add_object_to_track(self, object, position):
        pass
