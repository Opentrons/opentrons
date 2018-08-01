import os
import logging
import re
from opentrons import robot, labware
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver

log = logging.getLogger(__name__)

SUPPORTED_MODULES = {'magdeck': MagDeck}

class UnsupportedModuleError(Exception):
    pass
class AbsentModuleError(Exception):
    pass

class MissingDevicePortError(Exception):
    pass


def load(name, slot):
    # TODO: if robot.is_simulating create class without setting up
    # it will be out of scope and gc'ed at end of simulation exec
    # if not simnulating grab from list of modules on robot

    if name in SUPPORTED_MODULES:
        if robot.is_simulating():
            labware_instance = labware.load(name, slot)
            module_class = SUPPORTED_MODULES.get(name)
            return module_class(lw=labware_instance)
        else:
            # TODO: BC 2018-08-01 this currently loads the first module of that type that is on the robot,
            # in the future we should add support for multiple instances of one module type
            # this accessor would then load the correct disambiguated module instance (via nickname?)
            matching_modules = [module for module in robot.modules if isinstance(module, SUPPORTED_MODULES.get(name))]
            if matching_modules:
                return matching_modules[0]
            else:
                raise AbsentModuleError("no module of name {} is currently connected".format(name))
    else:
        raise UnsupportedModuleError("{} is not a valid module".format(name))


def discover_modules():
    if os.environ.get('RUNNING_ON_PI'):
        devices = os.listdir('/dev')
    else:
        devices = []

    discovered_modules = []

    module_port_regex = re.compile('|'.join(SUPPORTED_MODULES.keys()), re.IGNORECASE)
    for port in devices:
        match = module_port_regex.search(port)
        if match:
            module_class = SUPPORTED_MODULES.get(match.group())
            discovered_modules.append(module_class(port=port))

    log.debug('Discovered modules: {}'.format(discovered_modules))
    return discover_modules


class MagDeck:
    '''
    Under development. API subject to change
    '''
    def __init__(self, lw=None, port=None):
        self.labware = lw
        self._port = port
        self._engaged = False
        self._device_info = {}

    def calibrate(self):
        '''
        Calibration involves probing for top plate to get the plate height
        '''
        if self._driver and self._driver.is_connected():
            self._driver.probe_plate()
            # return if successful or not?
            self._engaged = False

    def engage(self):
        '''
        Move the magnet to plate top - 1 mm
        '''
        if self._driver and self._driver.is_connected():
            self._driver.move(self._driver.plate_height - 1.0)
            self._engaged = True

    def disengage(self):
        '''
        Home the magnet
        '''
        if self._driver and self._driver.is_connected():
            self._driver.home()
            self._engaged = False

    @property
    def port(self):
        return self._port

    @property
    def device_info(self):
        return self._device_info

    @property
    def status(self):
        return 'engaged' if self._engaged else 'disengaged'

    ######################
    ## Internal Methods ##
    ######################

    def connect(self):
        '''
        Connect the serial connection
        '''
        if self._port:
            self._driver = MagDeckDriver()
            self._driver.connect(self._port)
            self._device_info = self._driver.get_device_info()
        else:
            # Sanity check:
            # Should never happen, because connect should never be called without a port on Module
            raise MissingDevicePortError("MagDeck couldnt connect to port {}".format(self._port))

    def disconnect(self):
        '''
        Disconnect the serial connection
        '''
        self._driver.disconnect()


