import asyncio
import logging
from typing import Dict, Optional, Type

from ..execution_manager import ExecutionManager
from .absorbance_reader import AbsorbanceReader
from .flex_stacker import FlexStacker
from .heater_shaker import HeaterShaker
from .magdeck import MagDeck
from .mod_abc import AbstractModule
from .tempdeck import TempDeck
from .thermocycler import Thermocycler
from .types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    ModuleType,
    SpeedStatus,
)
from .vacuum_module import VacuumModule
from opentrons.drivers.rpi_drivers.types import USBPort

log = logging.getLogger(__name__)


# TODO (lc 05-12-2021) This is pretty gross. We should think
# of a better way to do this.
MODULE_TYPE_BY_NAME = {
    MagDeck.name(): MagDeck.MODULE_TYPE,
    TempDeck.name(): TempDeck.MODULE_TYPE,
    Thermocycler.name(): Thermocycler.MODULE_TYPE,
    HeaterShaker.name(): HeaterShaker.MODULE_TYPE,
    AbsorbanceReader.name(): AbsorbanceReader.MODULE_TYPE,
    FlexStacker.name(): FlexStacker.MODULE_TYPE,
    VacuumModule.name(): VacuumModule.MODULE_TYPE,
}

_MODULE_CLS_BY_TYPE: Dict[ModuleType, Type[AbstractModule]] = {
    MagDeck.MODULE_TYPE: MagDeck,
    TempDeck.MODULE_TYPE: TempDeck,
    Thermocycler.MODULE_TYPE: Thermocycler,
    HeaterShaker.MODULE_TYPE: HeaterShaker,
    AbsorbanceReader.MODULE_TYPE: AbsorbanceReader,
    FlexStacker.MODULE_TYPE: FlexStacker,
    VacuumModule.MODULE_TYPE: VacuumModule,
}


async def build(
    port: str,
    type: ModuleType,
    simulating: bool,
    usb_port: USBPort,
    hw_control_loop: asyncio.AbstractEventLoop,
    execution_manager: ExecutionManager,
    disconnected_callback: ModuleDisconnectedCallback,
    error_callback: ModuleErrorCallback,
    sim_model: Optional[str] = None,
    sim_serial_number: Optional[str] = None,
) -> AbstractModule:
    return await _MODULE_CLS_BY_TYPE[type].build(
        port=port,
        usb_port=usb_port,
        simulating=simulating,
        hw_control_loop=hw_control_loop,
        execution_manager=execution_manager,
        disconnected_callback=disconnected_callback,
        error_callback=error_callback,
        sim_model=sim_model,
        sim_serial_number=sim_serial_number,
    )


async def disable_module(module: AbstractModule) -> None:
    """Async function to deactivate a module immediately, for error recovery."""
    if isinstance(module, HeaterShaker):
        await module.deactivate_heater(must_be_running=False)
        if module.speed_status != SpeedStatus.IDLE:
            await module.deactivate_shaker(must_be_running=False)
    else:
        await module.deactivate(must_be_running=False)
