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

        self.persisted_data = []

        self.calibration_key = "{axis}:{instrument_name}".format(
            axis=self.axis,
            instrument_name=self.name
        )

        # a reference to the placeable set ontop the magbead module
        self.container = container

        self.engaged = False

        persisted_key = '{axis}:{name}'.format(
            axis=self.axis,
            name=self.name)
        self.init_calibrations(key=persisted_key)
        self.load_persisted_data()

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
