from opentrons.robot.robot import Robot
from opentrons.instruments.instrument import Instrument


class Magbead(Instrument):

    def __init__(self, name=None, mosfet=0, container=None):
        self.axis = 'M{}'.format(mosfet)

        self.robot = Robot.get_instance()
        self.robot.add_instrument(self.axis, self)
        self.motor = self.robot.get_mosfet(mosfet)

        if not name:
            name = self.__class__.__name__
        self.name = name

        # all instruments should hold calibration data, even if not used
        self.calibration_data = {}

        # a reference to the placeable set ontop the magbead module
        self.container = container

        self.engaged = False

    def engage(self, enqueue=True):
        def _setup():
            self.engaged = True

        def _do():
            self.motor.engage()

        _description = "Engaging Magbead at mosfet #{}".format(
            self.motor)
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        return self

    def disengage(self, enqueue=True):
        def _setup():
            self.engaged = False

        def _do():
            self.motor.disengage()

        _description = "Engaging Magbead at mosfet #{}".format(
            self.motor)
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        return self

    def delay(self, seconds, enqueue=True):
        def _setup():
            pass

        def _do():
            self.motor.wait(seconds)

        _description = "Delaying Magbead for {} seconds".format(seconds)
        self.create_command(
            do=_do,
            setup=_setup,
            description=_description,
            enqueue=enqueue)

        return self
