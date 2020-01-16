import abc
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
                    interrupt_callback,
                    simulating: bool = False) -> 'AbstractModule':
        """ Modules should always be created using this factory.

        This lets the (perhaps blocking) work of connecting to and initializing
        a module be in a place that can be async.
        """
        pass

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
    def has_available_update(self) -> bool:
        """ Return whether a newer firmware file is available """
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
