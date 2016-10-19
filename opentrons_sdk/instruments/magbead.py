from opentrons_sdk.robot.command import Command
from opentrons_sdk.robot.robot import Robot


class Magbead(object):

    def __init__(self, mosfet=0, container=None):
        self.mosfet = mosfet

        self.robot = Robot.get_instance()
        self.robot.add_instrument('M{}'.format(self.mosfet), self)
        self.mosfet = self.robot.get_mosfet(self.mosfet)

        # a reference to the placeable set ontop the magbead module
        self.container = container

    def reset(self):
        pass

    def engage(self):
        def _do():
            self.mosfet.engage()

        description = "Engaging Magbead at mosfet #{}".format(
            self.mosfet)
        self.robot.add_command(
            Command(do=_do, description=description))

        return self

    def disengage(self):
        def _do():
            self.mosfet.disengage()

        description = "Engaging Magbead at mosfet #{}".format(
            self.mosfet)
        self.robot.add_command(
            Command(do=_do, description=description))

        return self

    def delay(self, seconds):
        def _do():
            self.mosfet.wait(seconds)

        description = "Delaying Magbead for {} seconds".format(seconds)
        self.robot.add_command(
            Command(do=_do, description=description))

        return self
