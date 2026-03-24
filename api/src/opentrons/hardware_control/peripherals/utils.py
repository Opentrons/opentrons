import asyncio
from typing import Dict, Optional, Type

from ..execution_manager import ExecutionManager
from ..modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from .barcode_scanner import BarcodeScanner
from .peripheral_abc import AbstractPeripheral
from .types import PeripheralType
from opentrons.drivers.rpi_drivers.types import USBPort

PERIPHERAL_TYPE_BY_NAME: Dict[str, PeripheralType] = {
    BarcodeScanner.name(): BarcodeScanner.PERIPHERAL_TYPE,
}

_PERIPHERAL_CLS_BY_TYPE: Dict[PeripheralType, Type[AbstractPeripheral]] = {
    BarcodeScanner.PERIPHERAL_TYPE: BarcodeScanner,
}


async def build(
    port: str,
    type: PeripheralType,
    simulating: bool,
    usb_port: USBPort,
    hw_control_loop: asyncio.AbstractEventLoop,
    execution_manager: ExecutionManager,
    disconnected_callback: ModuleDisconnectedCallback,
    error_callback: ModuleErrorCallback,
    sim_model: Optional[str] = None,
    sim_serial_number: Optional[str] = None,
) -> AbstractPeripheral:
    return await _PERIPHERAL_CLS_BY_TYPE[type].build(
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
