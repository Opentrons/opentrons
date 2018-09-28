from typing import Dict


class Simulator:
    """ This is a subclass of hardware_control that only simulates the
    hardware actions. It is suitable for use on a dev machine or on
    a robot with no smoothie connected.
    """

    def __init__(self, config, loop):
        self._config = config
        self._loop = loop

    def move(self, target_position: Dict[str, float]):
        pass

    def home(self):
        # driver_3_0-> HOMED_POSITION
        return {'X': 418, 'Y': 353, 'Z': 218, 'A': 218, 'B': 19, 'C': 19}
