from labsuite.util.log import debug
from labsuite.protocol.handlers import ProtocolHandler
import labsuite.drivers.motor as motor_drivers


class MotorControlHandler(ProtocolHandler):

    _driver = None
    _pipette_motors = None  # {axis: PipetteMotor}

    def setup(self):
        self._pipette_motors = {}

    def set_driver(self, driver):
        self._driver = driver

    def connect(self, port):
        """
        Connects the MotorControlHandler to a serial port.

        If a device connection is set, then any dummy or alternate motor
        drivers are replaced with the serial driver.
        """
        self.set_driver(motor_drivers.OpenTrons())
        self._driver.connect(device=port)

    def simulate(self):
        self._driver = motor_drivers.MoveLogger()
        return self._driver

    def disconnect(self):
        self._driver.disconnect()

    def transfer(self, start=None, end=None, volume=None, **kwargs):
        self.move_volume(start, end, volume)

    def move_volume(self, start, end, volume):
        pipette = self.get_pipette(volume=volume)
        self.move_to_well(start)
        pipette.plunge(volume)
        self.move_into_well(start)
        pipette.release()
        self.move_to_well(end)
        self.move_into_well(end)
        pipette.blowout()
        self.move_up()
        pipette.release()

    def pickup_tip(self):
        pass

    def dispose_tip(self):
        pass

    def move_to_well(self, well):
        self.move_motors(z=0)  # Move up so we don't hit things.
        coords = self._context.get_coordinates(well)
        self.move_motors(x=coords['x'], y=coords['y'])
        self.move_motors(z=coords['top'])

    def move_into_well(self, well):
        coords = self._context.get_coordinates(well)
        self.move_motors(x=coords['x'], y=coords['y'])
        self.move_motors(z=coords['bottom'])

    def move_up(self):
        self.move_motors(z=0)

    def depress_plunger(self, volume):
        axis, depth = self._context.get_plunge(volume=volume)
        self.move_motors(**{axis: depth})

    def get_pipette(self, volume=None, axis=None):
        """
        Returns a closure object that allows for the plunge, release, and
        blowout of a certain pipette and volume.
        """
        pipette = self._context.get_instrument(volume=volume, axis=axis)
        axis = pipette.axis
        if axis not in self._pipette_motors:
            self._pipette_motors[axis] = PipetteMotor(pipette, self)
        return self._pipette_motors[axis]

    def move_motors(self, **kwargs):
        debug("MotorHandler", "Moving: {}".format(kwargs))
        self._driver.move(**kwargs)


class PipetteMotor():

        def __init__(self, pipette, motor):
            self.pipette = pipette
            self.motor = motor

        def plunge(self, volume):
            depth = self.pipette.plunge_depth(volume)
            self.move(depth)

        def release(self):
            self.move(0)

        def blowout(self):
            self.move(self.pipette.blowout)

        def move(self, position):
            axis = self.axis
            self.motor.move_motors(**{axis: position})

        @property
        def axis(self):
            return self.pipette.axis
