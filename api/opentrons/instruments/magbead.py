from opentrons.instruments.instrument import Instrument
from opentrons import commands


class Magbead(Instrument):
    """
    Through this class you can can:
        * Control the Magbead module to :meth:`engage` or :meth:`disengage`
    """

    def __init__(self, robot, name=None, mosfet=0, container=None):
        self.axis = 'M{}'.format(mosfet)
        self.mosfet_index = mosfet
        self.robot = robot

        self.robot.add_instrument(self.axis, self)

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

    def engage(self):
        """
        Move the Magbead platform upwards,
        bringing the magnetic field close to the wells

        """
        self.engaged = True

        # @commands.publish.before(command=commands.magbead.engage)
        def _engage(motor):
            motor.engage()

        _engage(self.motor)
        return self

    def disengage(self):
        """
        Move the Magbead platform downwards,
        lowering the magnetic field away to the wells

        """
        self.engaged = False

        # @commands.publish.before(command=commands.magbead.disengage)
        def _disengage(motor):
            motor.disengage()

        _disengage(self.motor)
        return self

    # @commands.publish.before(command=commands.magbead.delay)
    def delay(self, seconds=0, minutes=0):
        """
        Pause the robot for a given number of seconds

        Parameters
        ----------
        seconds : int or float
            The number of seconds to delay

        """
        minutes += int(seconds / 60)
        seconds = int(seconds % 60)
        seconds += (minutes * 60)
        self.motor.wait(seconds)
        return self

    @property
    def motor(self):
        return self.robot.get_mosfet(self.mosfet_index)
