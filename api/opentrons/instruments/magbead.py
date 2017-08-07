from opentrons.instruments.instrument import Instrument


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
        self.motor.engage()
        _description = "Engaging Magbead at mosfet #{}".format(self.motor)
        self.robot.add_command(_description)
        return self

    def disengage(self):
        """
        Move the Magbead platform downwards,
        lowering the magnetic field away to the wells

        """
        self.engaged = False
        self.motor.disengage()
        _description = "Engaging Magbead at mosfet #{}".format(self.motor)
        self.robot.add_command(_description)
        return self

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
        _description = "Delaying {} minutes and {} seconds".format(
            minutes, seconds)
        self.robot.add_command(_description)
        seconds += (minutes * 60)
        self.motor.wait(seconds)
        return self

    @property
    def motor(self):
        return self.robot.get_mosfet(self.mosfet_index)
