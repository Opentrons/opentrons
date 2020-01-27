import abc
import asyncio
import logging
import re
import os
from pathlib import Path
from pkg_resources import parse_version
from typing import Dict, Callable, Any, Tuple, Awaitable, Optional
from opentrons.config import CONFIG

mod_log = logging.getLogger(__name__)

InterruptCallback = Callable[[str], None]
UploadFunction = Callable[[str, str, Dict[str, Any]],
                          Awaitable[Tuple[bool, str]]]


class AbstractModule(abc.ABC):
    """ Defines the common methods of a module. """

    @classmethod
    @abc.abstractmethod
    async def build(cls,
                    port: str,
                    interrupt_callback: InterruptCallback,
                    simulating: bool = False,
                    loop: asyncio.AbstractEventLoop = None) \
            -> 'AbstractModule':
        """ Modules should always be created using this factory.

        This lets the (perhaps blocking) work of connecting to and initializing
        a module be in a place that can be async.
        """
        pass

    @abc.abstractmethod
    def __init__(self,
                 port: str,
                 simulating: bool = False,
                 loop: asyncio.AbstractEventLoop = None) -> None:
        self._port = port
        if None is loop:
            self._loop = asyncio.get_event_loop()
        else:
            self._loop = loop
        self._device_info = None
        self._available_update_version: Optional[str] = None
        self._available_update_path = self.get_bundled_fw()
        return None

    def get_bundled_fw(self) -> Optional[Path]:
        """ Get absolute path to bundled version of module fw if available. """
        name_to_fw_file_prefix = {
            "tempdeck": "temperature-module", "magdeck": "magnetic-module"}
        name = self.name()
        file_prefix = name_to_fw_file_prefix.get(name, name)
        MODULE_FW_RE = re.compile(f'{file_prefix}@v(.*)\.(hex|bin)')
        fw_dir = CONFIG['robot_firmware_dir']
        fw_resources = [fw_dir / item for item in os.listdir(fw_dir)]
        for fw_resource in fw_resources:
            matches = MODULE_FW_RE.search(str(fw_resource))
            if matches:
                self._available_update_version = matches.group(1)
                return fw_resource

        mod_log.info(f"no available fw file found for: {file_prefix}")
        return None

    def has_available_update(self) -> bool:
        """ Return whether a newer firmware file is available """
        if self._device_info is not None:
            raw_device_version = self._device_info.get('version', None)
            if raw_device_version and self._available_update_version:
                device_version = parse_version(raw_device_version)
                available_version = parse_version(
                    self._available_update_version)
                return available_version > device_version
        return False

    @abc.abstractmethod
    def deactivate(self):
        """ Deactivate the module. """
        pass

    @property
    @abc.abstractmethod
    def status(self) -> str:
        """ Return some string describing status. """
        pass

    @property
    @abc.abstractmethod
    def device_info(self) -> Dict[str, str]:
        """ Return a dict of the module's static information (serial, etc)"""
        pass

    @property
    @abc.abstractmethod
    def live_data(self) -> Dict[str, str]:
        """ Return a dict of the module's dynamic information """
        pass

    @property
    @abc.abstractmethod
    def is_simulated(self) -> bool:
        """ True if >this is a simulated module. """
        pass

    @property
    @abc.abstractmethod
    def port(self) -> str:
        """ The port where the module is connected. """
        pass

    @abc.abstractmethod
    async def prep_for_update(self) -> str:
        """ Prepare for an update.

        By the time this coroutine completes, the hardware should be ready
        to take an update. This implicitly tears down the module instance;
        it does not need to be either working or recoverable after this
        coroutine completes.

        :returns str: The port we're running on.
        """
        pass

    @property
    @abc.abstractmethod
    def interrupt_callback(self) -> InterruptCallback:
        pass

    @classmethod
    @abc.abstractmethod
    def name(cls) -> str:
        """ A name for this kind of module. """
        pass

    @classmethod
    @abc.abstractmethod
    def display_name(cls) -> str:
        """ A user-facing name for this kind of module. """
        pass

    @classmethod
    @abc.abstractmethod
    def bootloader(cls) -> UploadFunction:
        """ Method used to upload file to this module's bootloader. """
        pass
