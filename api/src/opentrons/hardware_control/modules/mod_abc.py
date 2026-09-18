import abc
import asyncio
import logging
import re
from typing import Any, Callable, ClassVar, Coroutine, Optional, TypeVar

from packaging.version import InvalidVersion, Version, parse

from ..abstract_device import AbstractDevice
from ..execution_manager import ExecutionManager
from .types import (
    BundledFirmware,
    HopperDoorState,
    LiveData,
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    ModuleStateSummary,
    ModuleType,
    UploadFunction,
)
from opentrons.config import IS_ROBOT, ROBOT_FIRMWARE_DIR
from opentrons.drivers.rpi_drivers.types import USBPort

mod_log = logging.getLogger(__name__)

TaskPayload = TypeVar("TaskPayload")


def parse_fw_version(version: str) -> Version:
    try:
        device_version = parse(version)
        # This is a patch for older versions of packaging - they would try and parse old
        # kidns of versions and return a LegacyVersion object. We can't check for that
        # explicitly because they removed it in modern versions of packaging.
        if not isinstance(device_version, Version):
            raise InvalidVersion()
    except InvalidVersion:
        device_version = parse("v0.0.0")
    return device_version


class AbstractModule(AbstractDevice):
    """Defines the common methods of a module."""

    MODULE_TYPE: ClassVar[ModuleType]

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
    ) -> "AbstractModule":
        """Modules should always be created using this factory.

        This lets the (perhaps blocking) work of connecting to and initializing
        a module be in a place that can be async.
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
        self._bundled_fw: Optional[BundledFirmware] = self.get_bundled_fw()
        self._disconnected_callback = disconnected_callback
        self._updating = False
        self._error_callback = error_callback

    @staticmethod
    def sort_key(inst: "AbstractModule") -> int:
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

    @property
    def updating(self) -> bool:
        """The device is updating is True."""
        return self._updating

    def disconnected_callback(self) -> None:
        """Called from within the module object to signify the object is no longer connected"""
        if self._disconnected_callback is not None:
            self._disconnected_callback(self.model(), self.port, self.serial_number)

    def error_callback(self, exc: Exception) -> None:
        """Called from within the module object when an asynchronous hardware error occurrs."""
        self._error_callback(exc, self.model(), self.port, self.serial_number)

    def inject_async_gcode_response(
        self,
        gcode_response: str,
        command: str,
    ) -> None:
        """Inject a firmware-style async G-code error for module testing."""
        raise NotImplementedError(
            f"inject_async_gcode_response is not supported by {self.model()}"
        )

    def get_bundled_fw(self) -> Optional[BundledFirmware]:
        """Get absolute path to bundled version of module fw if available."""
        if not IS_ROBOT:
            return None
        file_prefix = self.firmware_prefix()

        MODULE_FW_RE = re.compile(f"^{file_prefix}@v(.*)[.](hex|bin|byoup)$")
        for fw_resource in ROBOT_FIRMWARE_DIR.iterdir():  # type: ignore
            matches = MODULE_FW_RE.search(fw_resource.name)
            if matches:
                return BundledFirmware(version=matches.group(1), path=fw_resource)

        mod_log.info(f"no available fw file found for: {file_prefix}")
        return None

    def has_available_update(self) -> bool:
        """Return whether a newer firmware file is available"""
        if self.device_info and self._bundled_fw:
            device_version = parse_fw_version(self.device_info["version"])
            available_version = parse_fw_version(self._bundled_fw.version)
            return available_version > device_version
        return False

    async def wait_for_is_running(self) -> None:
        if not self.is_simulated and self._execution_manager is not None:
            await self._execution_manager.wait_for_is_running()

    def make_cancellable(self, task: "asyncio.Task[TaskPayload]") -> None:
        if self._execution_manager is not None:
            self._execution_manager.register_cancellable_task(task)

    @property
    @abc.abstractmethod
    def live_data(self) -> LiveData:
        """Return a dict of the module's dynamic information"""
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

    @property
    def hopper_door_state(self) -> Optional[HopperDoorState]:
        """Return a Flex Stacker Hopper Module Door State"""
        pass

    @abc.abstractmethod
    async def prep_for_update(self) -> str:
        """Prepare for an update.

        By the time this coroutine completes, the hardware should be ready
        to take an update. This implicitly tears down the module instance;
        it does not need to be either working or recoverable after this
        coroutine completes.

        :returns str: The port we're running on.
        """
        pass

    @property
    def bundled_fw(self) -> Optional[BundledFirmware]:
        return self._bundled_fw

    @abc.abstractmethod
    def firmware_prefix(self) -> str:
        """The prefix used for looking up firmware"""
        pass

    @abc.abstractmethod
    def bootloader(self) -> UploadFunction:
        """Method used to upload file to this module's bootloader."""
        pass

    async def move_port(self, port: str, usb_port: USBPort) -> None:
        pass

    async def attempt_reconnect(self) -> None:
        """Attempt to reestablish connections."""
        pass

    async def run_task_fault_tolerant(
        self,
        task_function: Callable[[], Coroutine[Any, Any, None]],
        debounce_count: int = 4,
    ) -> None:
        """Convenience function for module actions where we have to wait for some action to happen.
        This will end up calling the task function multiple times in the event of a failure.
        """
        while debounce_count > 0:
            try:
                t = self._loop.create_task(task_function())
                self.make_cancellable(t)
                await t
            except BaseException:
                mod_log.exception(
                    f"error in fault tolerant module call debounce {debounce_count}"
                )
                debounce_count -= 1
                await asyncio.sleep(1)
                if debounce_count == 0:
                    # out of retries
                    raise
            else:
                # success
                return

    async def get_state_summary(self) -> ModuleStateSummary:
        """Get a summary of module data friendly to remote calls."""
        return ModuleStateSummary(
            model=self.model(),
            usb_port=self.usb_port,
            has_available_update=self.has_available_update(),
            device_info={k: v for k, v in self.device_info.items()},
            live_data=self.live_data,
            serial_number=self.serial_number,
        )
