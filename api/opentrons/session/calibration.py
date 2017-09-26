PIPETTE_CHANGE_POSITION = (50, 50, 50)


class CalibrationManager:
    def __init__(self, robot, loop=None):
        self._loop = loop
        self._robot = robot

    def tip_probe(self, instrument):
        raise NotImplemented()

    def move_to_front(self, instrument):
        # instrument.move_to(PIPETTE_CHANGE_POSITION)
        raise NotImplemented()

    def move_to(self, instrument, obj):
        # instrument.move_to(obj[0])
        raise NotImplemented()

    def jog(self, instrument, coordinates):
        # instrument.jog(coordinates)
        raise NotImplemented()

    def update_container_offset(self):
        raise NotImplemented()
