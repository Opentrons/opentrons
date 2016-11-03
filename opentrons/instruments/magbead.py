from opentrons.robot.command import Command
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

    def engage(self, enqueue=True):
        def _do():
            self.motor.engage()

        description = "Engaging Magbead at mosfet #{}".format(
            self.motor)
        self.create_command(_do, description, enqueue=enqueue)

        return self

    def disengage(self, enqueue=True):
        def _do():
            self.motor.disengage()

        description = "Engaging Magbead at mosfet #{}".format(
            self.motor)
        self.create_command(_do, description, enqueue=enqueue)

        return self

    def delay(self, seconds, enqueue=True):
        def _do():
            self.motor.wait(seconds)

        description = "Delaying Magbead for {} seconds".format(seconds)
        self.create_command(_do, description, enqueue=enqueue)

        return self
