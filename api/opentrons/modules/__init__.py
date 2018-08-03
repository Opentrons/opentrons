import os
import logging
import re
from .magdeck import MagDeck
from .tempdeck import TempDeck
from opentrons import robot, labware
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from opentrons.drivers.temp_deck import TempDeck as TempDeckDriver

log = logging.getLogger(__name__)

SUPPORTED_MODULES = {'magdeck': MagDeck, 'tempdeck': TempDeck}

class UnsupportedModuleError(Exception):
    pass

class AbsentModuleError(Exception):
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

# Note: this function should be assigned to the robot.register_modules member
# it cannot be imported and called directly inside the robot class, because
# of the circular dependency that would create
def discover_and_connect():
    if os.environ.get('RUNNING_ON_PI'):
        devices = os.listdir('/dev/modules')
    else:
        devices = []

    discovered_modules = []

    module_port_regex = re.compile('|'.join(SUPPORTED_MODULES.keys()), re.IGNORECASE)
    for port in devices:
        match = module_port_regex.search(port)
        if match:
            module_class = SUPPORTED_MODULES.get(match.group().lower())
            absolute_port = '/dev/modules/{}'.format(port)
            discovered_modules.append(module_class(port=absolute_port))

    log.debug('Discovered modules: {}'.format(discovered_modules))
    for module in discovered_modules:
        try:
            module.connect()
        except AttributeError:
            log.exception('Failed to connect module')

    return discovered_modules


