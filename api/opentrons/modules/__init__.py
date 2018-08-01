import os
import logging
from opentrons import robot, labware
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from opentrons.drivers.temp_deck import TempDeck as TempDeckDriver

log = logging.getLogger(__name__)


class UnsupportedModuleError(Exception):
    pass


def load(name, slot):
    if name in SUPPORTED_MODULES.keys():
        lw = labware.load(name, slot)
        _cls = SUPPORTED_MODULES.get(name)
        mod = _cls(lw)
    else:
        raise UnsupportedModuleError("{} is not a valid module".format(name))
    return mod


def discover_devices(module_prefix):
    if os.environ.get('RUNNING_ON_PI'):
        devices = os.listdir('/dev/modules')
    else:
        devices = []
    matches = filter(
        lambda x: x.endswith('_{}'.format(module_prefix)), devices)
    res = list(map(lambda x: '/dev/modules/{}'.format(x), matches))
    log.debug('Discovered devices for prefix {}: {}'.format(
        module_prefix, res))
    return res


class MagDeck:
    """
    Under development. API subject to change without a version bump
    """
    def __init__(self, lw):
        self.labware = lw
        self.driver = MagDeckDriver()
        self.connect()
        self._engaged = False
        self._device_info = self.driver.get_device_info()

    def calibrate(self):
        """
        Calibration involves probing for top plate to get the plate height
        """
        if not robot.is_simulating():
            self.driver.probe_plate()
            # return if successful or not?
            self._engaged = False

    def engage(self):
        """
        Move the magnet to plate top - 1 mm
        """
        if not robot.is_simulating():
            self.driver.move(self.driver.plate_height - 1.0)
            self._engaged = True

    def disengage(self):
        """
        Home the magnet
        """
        if not robot.is_simulating():
            self.driver.home()
            self._engaged = False

    def connect(self):
        """
        Connect to the 'MagDeck' port
        Planned change- will connect to the correct port in case of multiple
        MagDecks
        """
        if not robot.is_simulating():
            ports = discover_devices('magdeck')
            # Connect to the first module. Need more advanced selector to
            # support more than one of the same type of module
            port = ports[0] if len(ports) > 0 else None
            self.driver.connect(port)

    def disconnect(self):
        """
        Disconnect the serial connection
        """
        if not robot.is_simulating():
            self.driver.disconnect()

    @property
    def device_info(self):
        """
        Returns a dict:
        {
                'serial': '1aa11bb22',
                'model': '1aa11bb22',
                'version': '1aa11bb22'
        }
        """
        return self._device_info

    @property
    def status(self):
        """
        Returns a string: 'engaged'/'disengaged'
        """
        return 'engaged' if self._engaged else 'disengaged'


class TempDeck:
    """
    Under development. API subject to change without a version bump
    """
    def __init__(self, lw):
        self.labware = lw
        self.driver = TempDeckDriver()
        self.connect()
        self._device_info = self.driver.get_device_info()

    def set_temperature(self, celsius):
        """
        Set temperature in degree Celsius
        Range: -9 to 99 degree Celsius.
        The range is limited by the 2-digit temperature display. Any input
        outside of this range will be clipped to the nearest limit
        """
        if not robot.is_simulating():
            self.driver.set_temperature(celsius)

    def deactivate(self):
        """
        Stop heating/cooling and turn off the fan
        """
        if not robot.is_simulating():
            self.driver.disengage()

    def _wait_for_temp(self):
        """
        This method exits only if set temperature has reached.Subject to change
        """
        if not robot.is_simulating():
            while self.status != 'holding at target':
                pass

    def connect(self):
        """
        Connect to the 'TempDeck' port
        Planned change- will connect to the correct port in case of multiple
        TempDecks
        """
        if not robot.is_simulating():
            ports = discover_devices('tempdeck')
            # Connect to the first module. Need more advanced selector to
            # support more than one of the same type of module
            port = ports[0] if len(ports) > 0 else None
            self.driver.connect(port)

    def disconnect(self):
        """
        Disconnect the serial connection
        """
        if not robot.is_simulating():
            self.driver.disconnect()

    @property
    def device_info(self):
        """
        Returns a dict:
        {
                'serial': '1aa11bb22',
                'model': '1aa11bb22',
                'version': '1aa11bb22'
        }
        """
        return self._device_info

    @property
    def temperature(self):
        """
        Current temperature in degree celsius
        """
        self.driver.update_temperature()
        return self.driver.temperature

    @property
    def target(self):
        """
        Target temperature in degree celsius.
        Returns None if no target set
        """
        self.driver.update_temperature()
        return self.driver.target

    @property
    def status(self):
        """
        Returns a string: 'heating'/'cooling'/'holding at target'/'idle'
        """
        return self.driver.status


SUPPORTED_MODULES = {'magdeck': MagDeck, 'tempdeck': TempDeck}
