from typing_extensions import Final


HOMED_POSITION: Final = {
    'X': 418.0,
    'Y': 353.0,
    'Z': 218.0,
    'A': 218.0,
    'B': 19.0,
    'C': 19.0
}
Y_BOUND_OVERRIDE: Final = 370


class SmoothieDriver(object):

    def __init__(self):
        pass


class VirtualSmoothie(object):

    def __init__(self):
        pass


class SimulatingDriver:
    def __init__(self):
        self._steps_per_mm = {}

    def home(self, axis):
        pass

    def _smoothie_reset(self):
        pass

    def read_pipette_id(self, mount):
        pass

    def read_pipette_model(self, mount):
        pass

    def write_pipette_id(self, mount, id):
        pass

    def write_pipette_model(self, mount, model):
        pass

    def _send_command(self, command, timeout=None):
        pass

    def turn_on_blue_button_light(self):
        pass

    def turn_on_red_button_light(self):
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
        pass

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

    def configure_splits_for(self, config):
        pass

    def set_dwelling_current(self, settings):
        pass

    def set_acceleration(self, settings):
        pass

    @property
    def homed_position(self):
        return HOMED_POSITION.copy()

    @property
    def axis_bounds(self):
        position = HOMED_POSITION.copy()
        position['Y'] = Y_BOUND_OVERRIDE
        return position
