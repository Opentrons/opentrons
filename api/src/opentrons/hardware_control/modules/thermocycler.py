from . import mod_abc
from opentrons.drivers.thermocycler.driver import (
    Thermocycler as ThermocyclerDriver, ThermocyclerError)


class SimulatingDriver:
    def __init__(self):
        self._target_temp = None
        self._ramp_rate = None
        self._active = False
        self._port = None
        self._lid_status = 'open'

    def open(self):
        if self._active:
            raise ThermocyclerError(
                'Cannot open Thermocycler while it is active')
        self._lid_status = 'open'

    def close(self):
        self._lid_status = 'closed'

    @property
    def status(self):
        return 'holding at target' if self._active else 'idle'

    @property
    def lid_status(self):
        return self._lid_status

    def connect(self, port):
        self._port = port

    def disconnect(self):
        self._port = None

    def deactivate(self):
        self._target_temp = None
        self._ramp_rate = None
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
    def build(cls, port, interrupt_callback, simulating=False):
        """Build and connect to a Thermocycler
        """
        mod = cls(port, interrupt_callback, simulating)
        mod._connect()
        return mod

    @classmethod
    def name(cls):
        return 'thermocycler'

    @classmethod
    def display_name(cls):
        return 'Thermocycler'

    def __init__(self, port, interrupt_callback, simulating):
        self._interrupt_cb = interrupt_callback
        if simulating:
            self._driver = SimulatingDriver()
        else:
            self._driver = ThermocyclerDriver(interrupt_callback)
        self._port = port
        self._device_info = None
        self._poller = None

    def deactivate(self):
        self._driver.deactivate()

    def open(self):
        """ Open the lid if it is closed"""
        # TODO add temperature protection if over 70 C
        if self._driver.lid_status == 'closed':
            self._driver.open()

    def close(self):
        """ Close the lid if it is open"""
        if self._driver.lid_status == 'open':
            self._driver.close()

    @property
    def lid_status(self):
        return self._driver.lid_status

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
                'lid': self._driver.lid_status
            }
        }

    @property
    def is_simulated(self):
        return isinstance(self._driver, SimulatingDriver)

    @property
    def interrupt_callback(self):
        """ Fetch the current interrupt callback

        Exposes the interrupt callback used with the TCPoller, so it can be re-
        hooked in the new module instance after a firmware update.
        """
        return self._interrupt_cb

    def _connect(self):
        self._driver.connect(self._port)
        self._device_info = self._driver.get_device_info()

    @property
    def port(self):
        return self._port

    async def prep_for_update(self):
        pass
