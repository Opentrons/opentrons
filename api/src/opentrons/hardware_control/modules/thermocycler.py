import asyncio
from . import mod_abc
from typing import Union
from opentrons.drivers.thermocycler.driver import (
    Thermocycler as ThermocyclerDriver, ThermocyclerError)


class SimulatingDriver:
    def __init__(self):
        self._target_temp = None
        self._ramp_rate = None
        self._hold_time = None
        self._active = False
        self._port = None
        self._lid_status = 'open'

    async def open(self):
        if self._active:
            raise ThermocyclerError(
                'Cannot open Thermocycler while it is active')
        self._lid_status = 'open'
        return self._lid_status

    async def close(self):
        self._lid_status = 'closed'
        return self._lid_status

    @property
    def status(self):
        return 'holding at target' if self._active else 'idle'

    @property
    def lid_status(self):
        return self._lid_status

    @property
    def ramp_rate(self):
        return self._ramp_rate

    @property
    def hold_time(self):
        # Simulating driver acts as if cycles end immediately
        return 0

    @property
    def temperature(self):
        return self._target_temp

    @property
    def target(self):
        return self._target_temp

    async def connect(self, port):
        self._port = port

    def disconnect(self):
        self._port = None

    async def set_temperature(self,
                              temp: float,
                              hold_time: float,
                              ramp_rate: float) -> None:
        self._target_temp = temp
        self._hold_time = hold_time
        self._ramp_rate = ramp_rate
        self._active = True

    async def deactivate(self):
        self._target_temp = None
        self._ramp_rate = None
        self._hold_time = None
        self._active = None

    async def get_device_info(self):
        return {'serial': 'dummySerial',
                'model': 'dummyModel',
                'version': 'dummyVersion'}


class Thermocycler(mod_abc.AbstractModule):
    """
    Under development. API subject to change without a version bump
    """
    @classmethod
    async def build(cls,
                    port,
                    interrupt_callback,
                    simulating=False,
                    loop: asyncio.AbstractEventLoop = None):
        """Build and connect to a Thermocycler
        """

        mod = cls(port, interrupt_callback, simulating, loop)
        await mod._connect()
        return mod

    @classmethod
    def name(cls):
        return 'thermocycler'

    @classmethod
    def display_name(cls):
        return 'Thermocycler'

    def __init__(self,
                 port,
                 interrupt_callback=None,
                 simulating=False,
                 loop: asyncio.AbstractEventLoop = None) -> None:
        self._interrupt_cb = interrupt_callback
        if simulating:
            self._driver: Union['SimulatingDriver', 'ThermocyclerDriver'] \
                = SimulatingDriver()
        else:
            self._driver: Union['SimulatingDriver', 'ThermocyclerDriver'] \
                = ThermocyclerDriver(interrupt_callback)

        if None is loop:
            self._loop = asyncio.get_event_loop()
        else:
            self._loop = loop

        self._port = port
        self._device_info = None
        self._poller = None

    async def deactivate(self):
        await self._driver.deactivate()

    async def open(self) -> str:
        """ Open the lid if it is closed"""
        # TODO add temperature protection if over 70 C
        return await self._driver.open()

    async def close(self) -> str:
        """ Close the lid if it is open"""
        return await self._driver.close()

    async def set_temperature(self, temp, hold_time=None, ramp_rate=None):
        await self._driver.set_temperature(
            temp=temp, hold_time=hold_time, ramp_rate=ramp_rate)

    async def wait_for_temp(self):
        """
        This method only exists if set temperature has been reached.

        Subject to change without a version bump.
        """
        while self.status != 'holding at target':
            await asyncio.sleep(0.1)

    @property
    def lid_status(self):
        return self._driver.lid_status

    @property
    def ramp_rate(self):
        return self._driver.ramp_rate

    @property
    def hold_time(self):
        # Simulating driver acts as if cycles end immediately
        return 0

    @property
    def temperature(self):
        return self._driver.temperature

    @property
    def target(self):
        return self._driver.target

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
                'lid': self._driver.lid_status,
                'currentTemp': self.temperature,
                'targetTemp': self.target,
                'holdTime': self.hold_time,
                'rampRate': self.ramp_rate
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

    @property
    def loop(self):
        return self._loop

    @loop.setter
    def loop(self, newLoop):
        self._loop = newLoop

    async def _connect(self):
        await self._driver.connect(self._port)
        self._device_info = await self._driver.get_device_info()

    @property
    def port(self):
        return self._port

    async def prep_for_update(self):
        pass
