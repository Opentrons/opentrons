import os
import logging
import re
from opentrons.modules.magdeck import MagDeck
from opentrons.modules.tempdeck import TempDeck
from opentrons import robot, labware

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
    module_instance = None
    if name in SUPPORTED_MODULES:
        if robot.is_simulating():
            labware_instance = labware.load(name, slot)
            module_class = SUPPORTED_MODULES.get(name)
            module_instance = module_class(lw=labware_instance)
        else:
            # TODO: BC 2018-08-01 this currently loads the first module of
            # that type that is on the robot, in the future we should add
            # support for multiple instances of one module type this
            # accessor would then load the correct disambiguated module
            # instance (via nickname?)
            matching_modules = [
                module for module in robot.modules if isinstance(
                    module, SUPPORTED_MODULES.get(name)
                )
            ]
            if matching_modules:
                module_instance = matching_modules[0]
                labware_instance = labware.load(name, slot)
                module_instance.labware = labware_instance
            else:
                raise AbsentModuleError(
                    "no module of name {} is currently connected".format(name)
                )
    else:
        raise UnsupportedModuleError("{} is not a valid module".format(name))

    return module_instance


# Note: this function should be called outside the robot class, because
# of the circular dependency that it would create if imported into robot.py
def discover_and_connect():
    if os.environ.get('RUNNING_ON_PI') and os.path.isdir('/dev/modules'):
        devices = os.listdir('/dev/modules')
    else:
        devices = []

    discovered_modules = []

    module_port_regex = re.compile('|'.join(SUPPORTED_MODULES.keys()), re.I)
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
