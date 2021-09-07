import asyncio
import logging

from opentrons.drivers.rpi_drivers.types import USBPort

# NOTE: Must import all modules so they actually create the subclasses
from . import update, tempdeck, magdeck, thermocycler, types  # noqa: F401
from .mod_abc import AbstractModule
from ..execution_manager import ExecutionManager
from .types import InterruptCallback


log = logging.getLogger(__name__)

# TODO (lc 05-12-2021) This is pretty gross. We should think
# of a better way to do this.
MODULE_HW_BY_NAME = {cls.name(): cls for cls in AbstractModule.__subclasses__()}


async def build(
    port: str,
    which: str,
    simulating: bool,
    usb_port: USBPort,
    interrupt_callback: InterruptCallback,
    loop: asyncio.AbstractEventLoop,
    execution_manager: ExecutionManager,
    sim_model: str = None,
) -> AbstractModule:
    return await MODULE_HW_BY_NAME[which].build(
        port,
        usb_port,
        interrupt_callback=interrupt_callback,
        simulating=simulating,
        loop=loop,
        execution_manager=execution_manager,
        sim_model=sim_model,
    )
