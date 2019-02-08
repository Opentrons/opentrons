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
    def build(cls, port, simulating=False):
        mod = cls(port, simulating)
        mod._connect()
        return mod

    @classmethod
    def name(cls) -> str:
        return 'magdeck'

    @classmethod
    def display_name(cls) -> str:
        return 'Magnetic Deck'

    def __init__(self, port, simulating):
        self._engaged = False
        self._port = port
        if simulating:
            self._driver = SimulatingDriver()
        else:
            self._driver = MagDeckDriver()
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

    # Internal Methods

    def _connect(self):
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
