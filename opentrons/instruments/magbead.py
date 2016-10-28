from opentrons.robot.command import Command
from opentrons.robot.robot import Robot
from opentrons.instruments.instrument import Instrument


class Magbead(Instrument):

    def __init__(self, name=None, mosfet=0, container=None):
        self.axis = 'M{}'.format(mosfet)

        self.robot = Robot.get_instance()
        self.robot.add_instrument(self.axis, self)
        self.mosfet = self.robot.get_mosfet(mosfet)

        if not name:
            name = self.__class__.__name__
        self.name = name

        # all instruments should hold calibration data, even if not used
        self.calibration_data = {}

        # a reference to the placeable set ontop the magbead module
        self.container = container

    def reset(self):
        pass

    def setup_simulate(self, mode='use_driver'):
        if mode == 'skip_driver':
            self.mosfet.simulate()
        elif mode == 'use_driver':
            self.mosfet.live()

    def teardown_simulate(self):
        self.mosfet.live()

    def create_command(self, do, description=None):

        self.robot.set_connection('simulate')
        self.setup_simulate(mode='skip_driver')
        do()
        self.teardown_simulate()
        self.robot.set_connection('live')

        self.robot.add_command(Command(do=do, description=description))

    def engage(self):
        def _do():
            self.mosfet.engage()

        description = "Engaging Magbead at mosfet #{}".format(
            self.mosfet)
        self.create_command(_do, description)

        return self

    def disengage(self):
        def _do():
            self.mosfet.disengage()

        description = "Engaging Magbead at mosfet #{}".format(
            self.mosfet)
        self.create_command(_do, description)

        return self

    def delay(self, seconds):
        def _do():
            self.mosfet.wait(seconds)

        description = "Delaying Magbead for {} seconds".format(seconds)
        self.create_command(_do, description)

        return self
