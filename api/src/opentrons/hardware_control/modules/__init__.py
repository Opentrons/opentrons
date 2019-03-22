import asyncio
import logging
import os
import re
from typing import List, Optional, Tuple

from opentrons.config import IS_ROBOT
from .mod_abc import AbstractModule
# Must import tempdeck and magdeck (and other modules going forward) so they
# actually create the subclasses
from . import update, tempdeck, magdeck, thermocycler  # noqa(W0611)

log = logging.getLogger(__name__)


class UnsupportedModuleError(Exception):
    pass


class AbsentModuleError(Exception):
    pass


# mypy isn’t quite expressive enough to handle what we’re doing here, which
# is get all the class objects that are subclasses of an abstract module
# (strike 1) and call a classmethod on them (strike 2) and actually store
# the class objects (strike 3). So, type: ignore
MODULE_TYPES = {cls.name(): cls
                for cls in AbstractModule.__subclasses__()}  # type: ignore


async def build(
        port: str,
        which: str,
        simulating: bool,
        interrupt_callback) -> AbstractModule:
    return await MODULE_TYPES[which].build(
        port, interrupt_callback=interrupt_callback, simulating=simulating)


def discover() -> List[Tuple[str, str]]:
    """ Scan for connected modules and instantiate handler classes
    """
    if IS_ROBOT and os.path.isdir('/dev/modules'):
        devices = os.listdir('/dev/modules')
    else:
        devices = []

    discovered_modules = []

    module_port_regex = re.compile('|'.join(MODULE_TYPES.keys()), re.I)
    for port in devices:
        match = module_port_regex.search(port)
        if match:
            name = match.group().lower()
            if name not in MODULE_TYPES:
                log.warning("Unexpected module connected: {} on {}"
                            .format(name, port))
                continue
            absolute_port = '/dev/modules/{}'.format(port)
            discovered_modules.append((absolute_port, name))
    log.info('Discovered modules: {}'.format(discovered_modules))

    return discovered_modules


class UpdateError(RuntimeError):
    def __init__(self, msg):
        self.msg = msg


async def update_firmware(
        module: AbstractModule,
        firmware_file: str,
        loop: Optional[asyncio.AbstractEventLoop]) -> AbstractModule:
    """ Update a module.

    If the update succeeds, an Module instance will be returned.

    Otherwise, raises an UpdateError with the reason for the failure.
    """
    simulating = module.is_simulated
    cls = type(module)
    old_port = module.port
    flash_port = await module.prep_for_update()
    callback = module.interrupt_callback
    del module
    after_port, results = await update.update_firmware(flash_port,
                                                       firmware_file,
                                                       loop)
    await asyncio.sleep(1.0)
    new_port = after_port or old_port
    if not results[0]:
        raise UpdateError(results[1])
    return await cls.build(
        port=new_port,
        interrupt_callback=callback,
        simulating=simulating)
