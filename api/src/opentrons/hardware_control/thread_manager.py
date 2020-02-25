""" Manager for the :py:class:`.hardware_control.API` thread.
"""
import threading
import logging
import asyncio
import functools
from .types import HardwareAPILike

MODULE_LOG = logging.getLogger(__name__)


class ThreadManager(HardwareAPILike):
    """ A wrapper to make every call into :py:class:`.hardware_control.API`
    execute within the same thread.

    Example
    -------
    .. code-block::
    >>> from opentrons.hardware_control import API, ThreadManager
    >>> api_single_thread = ThreadManager(API.build_hardware_simulator)
    >>> await api_single_thread.home()
    """

    def __init__(self, builder, *args, **kwargs) -> None:
        """ Build the ThreadManager.

        :param builder: The API function to use
        """

        self._loop = None
        self.managed_obj = None
        is_running = threading.Event()
        self._is_running = is_running
        target = object.__getattribute__(self, '_build_and_start_loop')
        thread = threading.Thread(target=target, name='ManagedThread',
                                  args=(builder, *args), kwargs=kwargs,
                                  daemon=True)
        self._thread = thread
        thread.start()
        is_running.wait()

    def _build_and_start_loop(self, builder, *args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self._loop = loop
        self.managed_obj = loop.run_until_complete(builder(*args, loop=loop, **kwargs))
        object.__getattribute__(self, '_is_running').set()
        loop.run_forever()
        loop.close()

    def __repr__(self):
        return '<ThreadManager>'

    def clean_up(self):
        try:
            loop = object.__getattribute__(self, '_loop')
            loop.call_soon_threadsafe(loop.stop)
        except Exception as e:
            pass
        object.__getattribute__(self, '_thread').join()

    def __del__(self):
        self.clean_up()

    @staticmethod
    async def call_coroutine_threadsafe(loop, coro, *args, **kwargs):
        fut = asyncio.run_coroutine_threadsafe(coro(*args, **kwargs), loop)
        wrapped = asyncio.wrap_future(fut)
        return await wrapped

    def __getattribute__(self, attr_name):
        # Almost every attribute retrieved from us will be for people actually
        # looking for an attribute of the hardware API, so check there first.
        managed_obj = object.__getattribute__(self, 'managed_obj')
        loop = object.__getattribute__(self, '_loop')
        try:
            MODULE_LOG.info(f'THREAD MANAGER get attribute: {attr_name}, mo: {managed_obj}')
            attr = getattr(managed_obj, attr_name)
        except AttributeError:
            # Maybe this actually was for us? Let’s find it
            return object.__getattribute__(self, attr_name)

        if asyncio.iscoroutinefunction(attr):
            # Return coroutine result of async function
            # executed in managed thread to calling thread
            return functools.partial(self.call_coroutine_threadsafe,
                                     loop,
                                     attr)
        return attr
