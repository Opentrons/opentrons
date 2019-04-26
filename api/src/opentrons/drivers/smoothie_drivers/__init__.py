class SmoothieDriver(object):

    def __init__(self):
        pass


class VirtualSmoothie(object):

    def __init__(self):
        pass


class SimulatingDriver:
    def __init__(self):
        self._steps_per_mm = {}

    def home(self):
        pass

    def update_pipette_config(self, axis, data):
        '''
        Updates the following configs for a given pipette mount based on
        the detected pipette type:
        - homing positions M365.0
        - Max Travel M365.1
        - endstop debounce M365.2 (NOT for zprobe debounce)
        - retract from endstop distance M365.3
        '''
        pass

    @property
    def current(self):
        return self._current_settings

    @property
    def speed(self):
        pass

    @property
    def steps_per_mm(self):
        return self._steps_per_mm

    @steps_per_mm.setter
    def steps_per_mm(self, axis, mm):
        # Keep track of any updates to the steps per mm per axis
        self._steps_per_mm[axis] = mm

    def update_steps_per_mm(self, data):
        pass
