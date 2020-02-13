import logging
from glob import glob
import re
from typing import List, Optional

from opentrons.config import IS_ROBOT, IS_LINUX
# NOTE: Must import all modules so they actually create the subclasses
from . import update, tempdeck, magdeck, thermocycler, types  # noqa(W0611)
from .mod_abc import AbstractModule
from .types import InterruptCallback, ModuleAtPort


log = logging.getLogger(__name__)


# mypy isn’t quite expressive enough to handle what we’re doing here, which
# is get all the class objects that are subclasses of an abstract module
# (strike 1) and call a classmethod on them (strike 2) and actually store
# the class objects (strike 3). So, type: ignore
MODULE_HW_BY_NAME = {cls.name(): cls
                for cls in AbstractModule.__subclasses__()}  # type: ignore

MODULE_PORT_REGEX = re.compile('|'.join(MODULE_HW_BY_NAME.keys()), re.I)


async def build(
        port: str,
        which: str,
        simulating: bool,
        interrupt_callback: InterruptCallback) -> AbstractModule:
    return await MODULE_HW_BY_NAME[which].build(
        port,
        interrupt_callback=interrupt_callback,
        simulating=simulating
    )


def get_module_at_port(port: str) -> Optional[ModuleAtPort]:
    """ Given a port, returns either a ModuleAtPort
        if it is a recognized module, or None if not recognized.
    """
    match = MODULE_PORT_REGEX.search(port)
    if match:
        name = match.group().lower()
        return ModuleAtPort(port=f'/dev/{port}', name=name)
    return None


# TODO: BC 2020-02-13 consolidate this functionality with
# hardware_controller.controller.Controller::_handle_watch_event
# as they do nearly the same thing
def discover() -> List[ModuleAtPort]:
    """ Scan for connected modules and return list of
        tuples of serial ports and device names
    """
    if IS_ROBOT and IS_LINUX:
        devices = glob('/dev/ot_module*')
    else:
        devices = []

    discovered_modules = []

    for port in devices:
        match = MODULE_PORT_REGEX.search(port)
        if match:
            name = match.group().lower()
            if name not in MODULE_HW_BY_NAME:
                log.warning("Unexpected module connected: {} on {}"
                            .format(name, port))
                continue
            discovered_modules.append(ModuleAtPort(port=port, name=name))
    log.debug('Discovered modules: {}'.format(discovered_modules))

    return discovered_modules
