import asyncio
from typing import Mapping, Optional

from ..execution_manager import ExecutionManager
from ..modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from .peripheral_abc import AbstractPeripheral
from .types import PeripheralType
from opentrons.drivers.barcode_scanner import (
    AbstractBarcodeScannerDriver,
    BarcodeSimulatorDriver,
    RTScanner,
)
from opentrons.drivers.rpi_drivers.types import USBPort


class BarcodeScanner(AbstractPeripheral):
    PERIPHERAL_TYPE = PeripheralType.BARCODE_SCANNER

    @classmethod
    async def build(
        cls,
        port: str,
        usb_port: USBPort,
        hw_control_loop: asyncio.AbstractEventLoop,
        execution_manager: ExecutionManager,
        disconnected_callback: ModuleDisconnectedCallback,
        error_callback: ModuleErrorCallback,
        poll_interval_seconds: float | None = None,
        simulating: bool = False,
        sim_model: Optional[str] = None,
        sim_serial_number: Optional[str] = None,
    ) -> "BarcodeScanner":
        """Build a barcode scanner object."""
        if simulating:
            driver: AbstractBarcodeScannerDriver = BarcodeSimulatorDriver()
        else:
            driver = await RTScanner.create()

        return BarcodeScanner(
            port,
            usb_port,
            hw_control_loop,
            execution_manager,
            disconnected_callback,
            error_callback,
            driver,
        )

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        hw_control_loop: asyncio.AbstractEventLoop,
        execution_manager: ExecutionManager,
        disconnected_callback: ModuleDisconnectedCallback,
        error_callback: ModuleErrorCallback,
        driver: AbstractBarcodeScannerDriver,
    ) -> None:
        super().__init__(
            port=port,
            usb_port=usb_port,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
            error_callback=error_callback,
        )
        self._driver = driver

    async def deactivate(self, must_be_running: bool = True) -> None:
        """Deactivate the module.

        Contains an override to the `wait_for_is_running` step in cases where the
        module must be deactivated regardless of context."""
        await self._driver.disconnect()

    @property
    def status(self) -> str:
        """Return some string describing status."""
        return f"{'Not' if self._driver.is_connected() else ''} Connected"

    @property
    def device_info(self) -> Mapping[str, str]:
        """Return a dict of the module's static information (serial, etc)"""
        return self._driver.get_device_info().to_dict()

    @property
    def is_simulated(self) -> bool:
        """True if >this is a simulated module."""
        return isinstance(self._driver, BarcodeSimulatorDriver)

    def model(self) -> str:
        """A name for this specific module, matching module defs"""
        return self.device_info["product_name"]

    @classmethod
    def name(cls) -> str:
        """A shortname used for matching usb ports, among other things"""
        return "barcodescanner"

    async def scan_barcode(self) -> Optional[str]:
        """Attempt to scan a barcode."""
        return await self._driver.scan_barcode()
