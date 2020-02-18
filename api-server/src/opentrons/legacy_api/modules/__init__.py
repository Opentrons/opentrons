from glob import glob
import logging
import re
from typing import List, Tuple, Any
from .magdeck import MagDeck
from .tempdeck import TempDeck
from opentrons import config

log = logging.getLogger(__name__)

SUPPORTED_MODULES = {
    'magdeck': MagDeck,
    'magnetic module': MagDeck,
    'tempdeck': TempDeck,
    'temperature module': TempDeck
}


class UnsupportedModuleError(Exception):
    pass


class AbsentModuleError(Exception):
    pass


_mod_robot = None
_mod_labware = None


def provide_singleton(robot):
    global _mod_robot
    _mod_robot = robot


def provide_labware(lw):
    global _mod_labware
    _mod_labware = lw


def load(name, slot):
    module_instance = None
    name = name.lower()
    if name in SUPPORTED_MODULES:
        if _mod_robot.is_simulating():
            labware_instance = _mod_labware.load(name, slot)
            module_class = SUPPORTED_MODULES.get(name)
            module_instance = module_class(
                lw=labware_instance, broker=_mod_robot.broker)
        else:
            # TODO: BC 2018-08-01 this currently loads the first module of
            # that type that is on the robot, in the future we should add
            # support for multiple instances of one module type this
            # accessor would then load the correct disambiguated module
            # instance via the module's serial
            module_instances = _mod_robot.attached_modules.values()
            matching_modules = [
                mod for mod in module_instances if isinstance(
                    mod, SUPPORTED_MODULES.get(name)
                )
            ]
            if matching_modules:
                module_instance = matching_modules[0]
                labware_instance = _mod_labware.load(name, slot)
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
def discover() -> List[Tuple[str, Any]]:
    if config.IS_ROBOT:
        devices = glob('/dev/ot_module*')
    else:
        devices = []

    discovered_modules = []

    module_port_regex = re.compile('|'.join(SUPPORTED_MODULES.keys()), re.I)
    for port in devices:
        match = module_port_regex.search(port)
        if match:
            name = match.group().lower()
            if name not in SUPPORTED_MODULES:
                log.warning("Unexpected module connected: {} on {}"
                            .format(name, port))
                continue
            discovered_modules.append((port, name))
    log.debug('Discovered modules: {}'.format(discovered_modules))

    return discovered_modules
