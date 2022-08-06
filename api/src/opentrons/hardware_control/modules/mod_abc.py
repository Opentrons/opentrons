import abc
import asyncio
import logging
import re
from pkg_resources import parse_version
from typing import Mapping, Optional, cast, TypeVar
from opentrons.config import IS_ROBOT, ROBOT_FIRMWARE_DIR
from opentrons.hardware_control.util import use_or_initialize_loop
from opentrons.drivers.rpi_drivers.types import USBPort
from ..execution_manager import ExecutionManager
from .types import BundledFirmware, UploadFunction, LiveData

mod_log = logging.getLogger(__name__)

TaskPayload = TypeVar("TaskPayload")


class AbstractModule(abc.ABC):
    """Defines the common methods of a module."""

    @classmethod
    @abc.abstractmethod
    async def build(
        cls,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        simulating: bool = False,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        sim_model: Optional[str] = None,
        **kwargs: float,
    ) -> "AbstractModule":
        """Modules should always be created using this factory.

        This lets the (perhaps blocking) work of connecting to and initializing
        a module be in a place that can be async.
        """
        pass

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        simulating: bool = False,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        sim_model: Optional[str] = None,
    ) -> None:
        self._port = port
        self._usb_port = usb_port
        self._loop = use_or_initialize_loop(loop)
        self._execution_manager = execution_manager
        self._bundled_fw: Optional[BundledFirmware] = self.get_bundled_fw()

    @staticmethod
    def sort_key(inst: "AbstractModule") -> int:
        usb_port = inst.usb_port

        if usb_port.hub is not None:
            primary_port = usb_port.hub
            secondary_port = usb_port.port_number
        else:
            primary_port = usb_port.port_number
            secondary_port = 0

        return primary_port * 1000 + secondary_port

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        return self._loop

    def get_bundled_fw(self) -> Optional[BundledFirmware]:
        """Get absolute path to bundled version of module fw if available."""
        if not IS_ROBOT:
            return None
        name_to_fw_file_prefix = {
            "tempdeck": "temperature-module",
            "magdeck": "magnetic-module",
            "heatershaker": "heater-shaker",
        }
        name = self.name()
        file_prefix = name_to_fw_file_prefix.get(name, name)

        MODULE_FW_RE = re.compile(f"^{file_prefix}@v(.*)[.](hex|bin)$")
        for fw_resource in ROBOT_FIRMWARE_DIR.iterdir():  # type: ignore
            matches = MODULE_FW_RE.search(fw_resource.name)
            if matches:
                return BundledFirmware(version=matches.group(1), path=fw_resource)

        mod_log.info(f"no available fw file found for: {file_prefix}")
        return None

    def has_available_update(self) -> bool:
        """Return whether a newer firmware file is available"""
        if self.device_info and self._bundled_fw:
            device_version = parse_version(self.device_info["version"])
            available_version = parse_version(self._bundled_fw.version)
            return cast(bool, available_version > device_version)
        return False

    async def wait_for_is_running(self) -> None:
        if not self.is_simulated:
            await self._execution_manager.wait_for_is_running()

    def make_cancellable(self, task: "asyncio.Task[TaskPayload]") -> None:
        self._execution_manager.register_cancellable_task(task)

    @abc.abstractmethod
    async def deactivate(self) -> None:
        """Deactivate the module."""
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
    def live_data(self) -> LiveData:
        """Return a dict of the module's dynamic information"""
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
    def model(self) -> str:
        """A name for this specific module, matching module defs"""
        pass

    @classmethod
    @abc.abstractmethod
    def name(cls) -> str:
        """A shortname used for looking up firmware, among other things"""
        pass

    @abc.abstractmethod
    def bootloader(self) -> UploadFunction:
        """Method used to upload file to this module's bootloader."""
        pass

    async def cleanup(self) -> None:
        """Clean up the module instance.

        Clean up, i.e. stop pollers, disconnect serial, etc in preparation for
        object destruction.
        """
        pass
