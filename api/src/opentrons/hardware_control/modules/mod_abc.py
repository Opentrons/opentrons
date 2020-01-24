import abc
import asyncio
from pkg_resources import parse_version
from typing import Dict, Callable, Any, Tuple, Awaitable

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
                    loop: asyncio.AbstractEventLoop = None) -> 'AbstractModule':
        """ Modules should always be created using this factory.

        This lets the (perhaps blocking) work of connecting to and initializing
        a module be in a place that can be async.
        """
        pass

    @abc.abstractmethod
    def __init__(self,
                 port: str,
                 simulating: bool = False,
                 loop: asyncio.AbstractEventLoop = None) -> 'AbstractModule':
        self._port = port
        if None is loop:
            self._loop = asyncio.get_event_loop()
        else:
            self._loop = loop
        self._device_info = None
        self._available_update_path = update.get_bundled_fw(self.name())

    @abc.abstractmethod
    def deactivate(self):
        """ Deactivate the module. """
        pass

    @abc.abstractmethod
    def has_available_update(self) -> bool:
        """ Return whether a newer firmware file is available """
        raw_device_version = self.device_info.get('version', None)
        if raw_device_version and self._available_update_path:
            device_version = parse_version(raw_device_version)
            available_version = parse_version(self._available_update_path)
            return available_version > device_version
        else:
            return False

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
