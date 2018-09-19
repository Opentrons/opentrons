class Simulator:
    """ This is a subclass of hardware_control that only simulates the
    hardware actions. It is suitable for use on a dev machine or on
    a robot with no smoothie connected.
    """

    def __init__(self, config, loop):
        self._config = config
        self._loop = loop
