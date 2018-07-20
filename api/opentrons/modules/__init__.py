import os
import logging
from opentrons import robot, labware
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver


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
        devices = os.listdir('/dev')
    else:
        devices = []
    matches = filter(
        lambda x: x.startswith('tty{}'.format(module_prefix)), devices)
    res = list(map(lambda x: '/dev/{}'.format(x), matches))
    log.debug('Discovered devices for prefix {}: {}'.format(
        module_prefix, res))
    return res


class MagDeck:
    '''
    Under development. API subject to change
    '''
    def __init__(self, lw):
        self.labware = lw
        self.driver = MagDeckDriver()
        self.connect()
        self._engaged = False
        self._device_info = self.driver.get_device_info()

    def calibrate(self):
        '''
        Calibration involves probing for top plate to get the plate height
        '''
        if not robot.is_simulating():
            self.driver.probe_plate()
            # return if successful or not?
            self._engaged = False

    def engage(self):
        '''
        Move the magnet to plate top - 1 mm
        '''
        if not robot.is_simulating():
            self.driver.move(self.driver.plate_height - 1.0)
            self._engaged = True

    def disengage(self):
        '''
        Home the magnet
        '''
        if not robot.is_simulating():
            self.driver.home()
            self._engaged = False

    def disconnect(self):
        '''
        Disconnect the serial connection
        '''
        if not robot.is_simulating():
            self.driver.disconnect()

    def connect(self):
        '''
        Connect to the 'MagDeck' port
        Planned change- will connect to the correct port in case of multiple
        MagDecks
        '''
        if not robot.is_simulating():
            ports = discover_devices('MagDeck')
            # Connect to the first module. Need more advanced selector to
            # support more than one of the same type of module
            port = ports[0] if len(ports) > 0 else None
            self.driver.connect(port)

    @property
    def device_info(self):
        return self._device_info

    @property
    def status(self):
        return 'engaged' if self._engaged else 'disengaged'


SUPPORTED_MODULES = {'magdeck': MagDeck}
