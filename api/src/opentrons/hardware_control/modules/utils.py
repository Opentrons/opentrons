import asyncio
import logging
from typing import Dict, Optional, Type

from opentrons.drivers.rpi_drivers.types import USBPort

from ..execution_manager import ExecutionManager

from .types import ModuleType
from .mod_abc import AbstractModule
from .tempdeck import TempDeck
from .magdeck import MagDeck
from .thermocycler import Thermocycler
from .heater_shaker import HeaterShaker


log = logging.getLogger(__name__)


# TODO (lc 05-12-2021) This is pretty gross. We should think
# of a better way to do this.
MODULE_TYPE_BY_NAME = {
    MagDeck.name(): MagDeck.MODULE_TYPE,
    TempDeck.name(): TempDeck.MODULE_TYPE,
    Thermocycler.name(): Thermocycler.MODULE_TYPE,
    HeaterShaker.name(): HeaterShaker.MODULE_TYPE,
}

_MODULE_CLS_BY_TYPE: Dict[ModuleType, Type[AbstractModule]] = {
    MagDeck.MODULE_TYPE: MagDeck,
    TempDeck.MODULE_TYPE: TempDeck,
    Thermocycler.MODULE_TYPE: Thermocycler,
    HeaterShaker.MODULE_TYPE: HeaterShaker,
}


async def build(
    port: str,
    type: ModuleType,
    simulating: bool,
    usb_port: USBPort,
    hw_control_loop: asyncio.AbstractEventLoop,
    execution_manager: ExecutionManager,
    sim_model: Optional[str] = None,
) -> AbstractModule:
    return await _MODULE_CLS_BY_TYPE[type].build(
        port=port,
        usb_port=usb_port,
        simulating=simulating,
        hw_control_loop=hw_control_loop,
        execution_manager=execution_manager,
        sim_model=sim_model,
    )
