import abc
import asyncio
from typing import ClassVar, Optional

from ..abstract_device import AbstractDevice
from ..execution_manager import ExecutionManager
from ..modules.mod_abc import TaskPayload
from ..modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from .types import PeripheralType
from opentrons.drivers.rpi_drivers.types import USBPort


class AbstractPeripheral(AbstractDevice):
    PERIPHERAL_TYPE: ClassVar[PeripheralType]

    @classmethod
    @abc.abstractmethod
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
    ) -> "AbstractPeripheral":
        """Peripherals should always be created using this factory.

        This lets the (perhaps blocking) work of connecting to and initializing
        a peripheral be in a place that can be async.
        """

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        hw_control_loop: asyncio.AbstractEventLoop,
        execution_manager: ExecutionManager,
        disconnected_callback: ModuleDisconnectedCallback,
        error_callback: ModuleErrorCallback,
    ) -> None:
        self._port = port
        self._usb_port = usb_port
        self._loop = hw_control_loop
        self._execution_manager = execution_manager
        self._disconnected_callback = disconnected_callback
        self._error_callback = error_callback

    @staticmethod
    def sort_key(inst: "AbstractPeripheral") -> int:
        usb_port = inst.usb_port

        primary_port = usb_port.port_number

        if usb_port.hub_port is not None:
            secondary_port = usb_port.hub_port
        else:
            secondary_port = 0

        return primary_port * 1000 + secondary_port

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        return self._loop

    def disconnected_callback(self) -> None:
        """Called from within the module object to signify the object is no longer connected"""
        if self._disconnected_callback is not None:
            self._disconnected_callback(self.model(), self.port, self.serial_number)

    def error_callback(self, exc: Exception) -> None:
        """Called from within the module object when an asynchronous hardware error occurrs."""
        self._error_callback(exc, self.model(), self.port, self.serial_number)

    async def wait_for_is_running(self) -> None:
        if not self.is_simulated and self._execution_manager is not None:
            await self._execution_manager.wait_for_is_running()

    def make_cancellable(self, task: "asyncio.Task[TaskPayload]") -> None:
        if self._execution_manager is not None:
            self._execution_manager.register_cancellable_task(task)

    @property
    def port(self) -> str:
        """The virtual port where the module is connected."""
        return self._port

    @property
    def usb_port(self) -> USBPort:
        """The physical port where the module is connected."""
        return self._usb_port

    @property
    def serial_number(self) -> Optional[str]:
        """The usb serial number of this device."""
        return self.device_info.get("serial")
