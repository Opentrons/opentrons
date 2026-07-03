import abc
import asyncio
from typing import Any, Mapping, Optional

from .execution_manager import ExecutionManager
from .modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from opentrons.drivers.rpi_drivers.types import USBPort


class AbstractDevice(abc.ABC):
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
    ) -> "AbstractDevice":
        """Devices should always be created using this factory.

        This lets the (perhaps blocking) work of connecting to and initializing
        a device be in a place that can be async.
        """

    @property
    @abc.abstractmethod
    def loop(self) -> asyncio.AbstractEventLoop: ...

    @abc.abstractmethod
    def disconnected_callback(self) -> None:
        """Called from within the module object to signify the object is no longer connected"""
        ...

    @abc.abstractmethod
    def error_callback(self, exc: Exception) -> None:
        """Called from within the module object when an asynchronous hardware error occurrs."""
        ...

    @abc.abstractmethod
    async def wait_for_is_running(self) -> None: ...

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
    @abc.abstractmethod
    def port(self) -> str:
        """The virtual port where the module is connected."""
        ...

    @property
    @abc.abstractmethod
    def usb_port(self) -> USBPort:
        """The physical port where the module is connected."""
        ...

    @property
    @abc.abstractmethod
    def serial_number(self) -> Optional[str]:
        """The usb serial number of this device."""
        ...

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

    async def soft_cleanup(self) -> None:
        """Clean up the module instance.

        Clean up, i.e. stop pollers, disconnect serial, etc in preparation for
        object destruction. Normally calls cleanup but a device manager can override this to not
        send a pyro notification if it wants to be fault tolerant.
        """
        await self.cleanup()

    def event_listener(self, event: Any) -> None:
        """Listen for events and update the module state."""
        pass

    async def identify(self, start: bool, color_name: Optional[str] = None) -> None:
        """Identify the module."""
        pass

    def cleanup_persistent(self) -> None:
        """Reset any persistent data on the module that should not exist outside of a run."""
        pass
