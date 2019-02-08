import asyncio
from . import mod_abc


class SimulatingDriver:
    def __init__(self):
        self._target_temp = None
        self._ramp_rate = None
        self._hold_time = None
        self._active = False
        self._port = None

    def set_temperature(self, temp, hold_time, ramp_rate):
        self._target_temp = temp
        self._hold_time = hold_time
        self._ramp_rate = ramp_rate
        self._active = True

    @property
    def ramp_rate(self):
        return self._ramp_rate

    @property
    def hold_time(self):
        return self._hold_time

    @property
    def temperature(self):
        return self._target_temp

    @property
    def target(self):
        return self._target_temp

    @property
    def status(self):
        return 'holding at target' if self._active else 'idle'

    def connect(self, port):
        self._port = port

    def disconnect(self):
        self._port = None

    def deactivate(self):
        self._target_temp = None
        self._ramp_rate = None
        self._hold_time = None
        self._active = None

    def get_device_info(self):
        return {'serial': 'dummySerial',
                'model': 'dummyModel',
                'version': 'dummyVersion'}


class Thermocycler(mod_abc.AbstractModule):
    """
    Under development. API subject to change without a version bump
    """
    @classmethod
    def build(cls, port, simulating=False):
        """Build and connect to a Thermocycler
        """
        mod = cls(port, simulating)
        mod._connect()
        return mod

    @classmethod
    def name(cls):
        return 'thermocycler'

    @classmethod
    def display_name(cls):
        return 'Thermocycler'

    def __init__(self, port, simulating):
        if simulating:
            self._driver = SimulatingDriver()
        else:
            # self._driver = ThermocyclerDriver()
            self._driver = None
        self._port = port
        self._device_info = None
        self._poller = None

    def set_temperature(self, temp, hold_time, ramp_rate):
        self._driver.set_temperature(
            temp=temp, hold_time=hold_time, ramp_rate=ramp_rate)

    def deactivate(self):
        self._driver.deactivate()

    async def wait_for_temp(self):
        """
        This method exits only if set temperature has been reached.

        Subject to change without a version bump.
        """
        while self.status != 'holding at target':
            await asyncio.sleep(0.1)

    @property
    def status(self):
        return self._driver.status

    @property
    def device_info(self):
        return self._device_info

    @property
    def live_data(self):
        return {
            'status': self.status,
            'data': {
                'currentTemp': self.temperature,
                'targetTemp': self.target,
                'holdTime': self.hold_time,
                'rampRate': self.ramp_rate
            }
        }

    @property
    def temperature(self):
        return self._driver.temperature

    @property
    def target(self):
        return self._driver.target

    @property
    def hold_time(self):
        return self._driver.hold_time

    @property
    def ramp_rate(self):
        return self._driver.ramp_rate

    @property
    def is_simulated(self):
        return isinstance(self._driver, SimulatingDriver)

    def _connect(self):
        self._driver.connect(self._port)
        self._device_info = self._driver.get_device_info()

    @property
    def port(self):
        return self._port

    async def prep_for_update(self):
        pass
