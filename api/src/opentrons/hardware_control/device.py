import asyncio
from typing import Dict, Optional, Union

from . import modules, peripherals
from .abstract_device import AbstractDevice
from .execution_manager import ExecutionManager
from .modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from opentrons.drivers.rpi_drivers.types import USBPort

DeviceType = Union[modules.ModuleType, peripherals.PeripheralType]

DEVICE_TYPE_BY_NAME: Dict[
    str, Union[peripherals.PeripheralType, modules.ModuleType]
] = {
    **modules.MODULE_TYPE_BY_NAME,
    **peripherals.PERIPHERAL_TYPE_BY_NAME,
}


async def build_attached_device(
    port: str,
    type: DeviceType,
    simulating: bool,
    usb_port: USBPort,
    hw_control_loop: asyncio.AbstractEventLoop,
    execution_manager: ExecutionManager,
    disconnected_callback: ModuleDisconnectedCallback,
    error_callback: ModuleErrorCallback,
    sim_model: Optional[str] = None,
    sim_serial_number: Optional[str] = None,
) -> AbstractDevice:
    if isinstance(type, modules.ModuleType):
        return await modules.build(
            port=port,
            type=type,
            usb_port=usb_port,
            simulating=simulating,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
            error_callback=error_callback,
            sim_model=sim_model,
            sim_serial_number=sim_serial_number,
        )
    else:
        return await peripherals.build(
            port=port,
            type=type,
            usb_port=usb_port,
            simulating=simulating,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
            error_callback=error_callback,
            sim_model=sim_model,
            sim_serial_number=sim_serial_number,
        )
