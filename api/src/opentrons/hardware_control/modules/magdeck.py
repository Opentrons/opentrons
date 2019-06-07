import asyncio
from typing import Union
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from . import update, mod_abc

LABWARE_ENGAGE_HEIGHT = {'biorad-hardshell-96-PCR': 18}    # mm
MAX_ENGAGE_HEIGHT = 45  # mm from home position


class MissingDevicePortError(Exception):
    pass


class SimulatingDriver:
    def __init__(self):
        self._port = None
        self._height = 0

    def probe_plate(self):
        pass

    def home(self):
        pass

    def move(self, location):
        self._height = location

    def get_device_info(self):
        return {'serial': 'dummySerial',
                'model': 'dummyModel',
                'version': 'dummyVersion'}

    def connect(self, port):
        pass

    def disconnect(self):
        pass

    def enter_programming_mode(self):
        pass

    @property
    def plate_height(self):
        return self._height


class MagDeck(mod_abc.AbstractModule):
    """
    Under development. API subject to change
    """
    @classmethod
    async def build(cls,
                    port,
                    interrupt_callback,
                    simulating=False,
                    loop: asyncio.AbstractEventLoop = None):
        # MagDeck does not currently use interrupts, so the callback is not
        # passed on
        mod = cls(port, simulating, loop)
        await mod._connect()
        return mod

    @classmethod
    def name(cls) -> str:
        return 'magdeck'

    @classmethod
    def display_name(cls) -> str:
        return 'Magnetic Deck'

    def __init__(self,
                 port,
                 simulating,
                 loop: asyncio.AbstractEventLoop = None):
        self._engaged = False
        self._port = port
        if simulating:
            self._driver: Union['SimulatingDriver', 'MagDeckDriver'] \
                = SimulatingDriver()
        else:
            self._driver: Union['SimulatingDriver', 'MagDeckDriver'] \
                = MagDeckDriver()

        if None is loop:
            self._loop = asyncio.get_event_loop()
        else:
            self._loop = loop

        self._device_info = None

    def calibrate(self):
        """
        Calibration involves probing for top plate to get the plate height
        """
        self._driver.probe_plate()
        # return if successful or not?
        self._engaged = False

    def engage(self, height):
        """
        Move the magnet to a specific height, in mm from home position
        """
        if height > MAX_ENGAGE_HEIGHT or height < 0:
            raise ValueError('Invalid engage height. Should be 0 to {}'.format(
                MAX_ENGAGE_HEIGHT))
        self._driver.move(height)
        self._engaged = True

    def deactivate(self):
        """
        Home the magnet
        """
        self._driver.home()
        self._engaged = False

    @property
    def device_info(self):
        """
        Returns a dict:
            { 'serial': 'abc123', 'model': '8675309', 'version': '9001' }
        """
        return self._device_info

    @property
    def status(self):
        return 'engaged' if self._engaged else 'disengaged'

    @property
    def live_data(self):
        return {
            'status': self.status,
            'data': {
                'engaged': self._engaged
            }
        }

    @property
    def port(self):
        return self._port

    @property
    def is_simulated(self):
        return isinstance(self._driver, SimulatingDriver)

    @property
    def interrupt_callback(self):
        return lambda x: None

    @property
    def loop(self):
        return self._loop

    def set_loop(self, loop):
        self._loop = loop

    # Internal Methods

    async def _connect(self):
        """
        Connect to the serial port
        """
        self._driver.connect(self._port)
        self._device_info = self._driver.get_device_info()

    def _disconnect(self):
        """
        Disconnect from the serial port
        """
        if self._driver:
            self._driver.disconnect()

    def __del__(self):
        self._disconnect()

    async def prep_for_update(self) -> str:
        new_port = await update.enter_bootloader(self._driver,
                                                 self.device_info['model'])
        return new_port or self.port
