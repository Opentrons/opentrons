
# probe_center = {'z': 68.0, 'x': 268.4, 'y': 291.8181} # Ibn
# probe_dimensions = {'length': 47.74, 'width': 38, 'height':63}

probe_center = {'z': 57.81, 'x': 259.8, 'y': 298.875} # Avagadro
probe_dimensions = {'length': 41, 'width': 38.7, 'height':57.81}

#x_left = 240.4500
#x_right = 279.1500
#y_front  X:259.7500 Y:278.3750 Z:225.5000 A:68.8100 B:18.0002 C:18.0002
#y_back   X:259.7500 Y:319.3750 Z:225.5000 A:68.8100 B:18.0002 C:18.0002

class Probe:
    def __init__(self, width, length, height, position_offset, pose_tracker, switch_offset=1):
        self.length, self.width, self.height = length, width, height
        self.switch_offset = switch_offset
        self._offset = position_offset
        self.pose_tracker = pose_tracker

    @property
    def pose(self):
        return self.pose_tracker[self]

    @property
    def left_switch(self):
        return {
            'x': self.pose.x - (self.width / 2),
            'y': self.pose.y - self.switch_offset,
            'z': self.height
        }

    @property
    def right_switch(self):
        return {
            'x': self.pose.x + self.width / 2,
            'y': self.pose.y - self.switch_offset,
            'z': self.pose.z
        }

    @property
    def front_switch(self):
        return {
            'x': self.pose.x - self.switch_offset,
            'y': self.pose.y - self.length / 2,
            'z': self.pose.z
        }


    @property
    def back_switch(self):
        return {
            'x': self.pose.x - self.switch_offset,
            'y': self.pose.y + self.width / 2,
            'z': self.pose.z
        }

    @property
    def top_switch(self):
        return {
            'x': self.pose.x,
            'y': self.pose.y + self.switch_offset,
            'z': self.pose.z
        }


class Base:
    """
    Responsible for:
        - holding the concept of the base of the frame and construction of the probe


    Not responsible for:
        - nothing!
    """
    def __init__(self, pose_tracker):
        self.pose_tracker = pose_tracker
        print(self.pose_tracker)
        self.pose_tracker.create_root_object(self, 0,0,0)
        self._probe = self.setup_probe()

    def setup_probe(self):
        probe = Probe(position_offset=probe_center, pose_tracker = self.pose_tracker, **probe_dimensions)
        self.pose_tracker.track_object(self, probe, **probe._offset)
        print("PROBE: ", probe)
        return probe
