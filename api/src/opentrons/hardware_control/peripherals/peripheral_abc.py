import abc
import asyncio
from typing import Any, ClassVar, Mapping, Optional

from ..execution_manager import ExecutionManager
from ..modules.mod_abc import TaskPayload
from ..modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from .types import PeripheralType
from opentrons.drivers.rpi_drivers.types import USBPort


class AbstractPeripheral(abc.ABC):
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

    @abc.abstractmethod
    async def deactivate(self, must_be_running: bool = True) -> None:
        """Deactivate the module.

        Contains an override to the `wait_for_is_running` step in cases where the
        module must be deactivated regardless of context."""
        pass

    @property
    @abc.abstractmethod
    def status(self) -> str:
        """Return some string describing status."""
        pass

    @property
    @abc.abstractmethod
    def device_info(self) -> Mapping[str, str]:
        """Return a dict of the module's static information (serial, etc)"""
        pass

    @property
    @abc.abstractmethod
    def is_simulated(self) -> bool:
        """True if >this is a simulated module."""
        pass

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

    @abc.abstractmethod
    def model(self) -> str:
        """A name for this specific module, matching module defs"""
        pass

    @classmethod
    @abc.abstractmethod
    def name(cls) -> str:
        """A shortname used for matching usb ports, among other things"""
        pass

    async def cleanup(self) -> None:
        """Clean up the module instance.

        Clean up, i.e. stop pollers, disconnect serial, etc in preparation for
        object destruction.
        """
        pass

    def event_listener(self, event: Any) -> None:
        """Listen for events and update the module state."""
        pass

    async def identify(self, start: bool, color_name: Optional[str] = None) -> None:
        """Identify the module."""
        pass

    def cleanup_persistent(self) -> None:
        """Reset any persistent data on the module that should not exist outside of a run."""
        pass
