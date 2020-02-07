""" Manager for the :py:class:`.hardware_control.API` thread.
"""
import threading
import logging
import asyncio
import functools
from time import sleep
from .types import Axis, HardwareAPILike

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
        self._api = None
        is_running = threading.Event()
        self._is_running = is_running
        MODULE_LOG.info(f'THREAD MANAGER init with builder: {builder} ')
        target = object.__getattribute__(self, '_build_api_and_start_loop')
        thread = threading.Thread(target=target, name='Hardware thread',
                                  args=(builder, *args), kwargs=kwargs)
        self._thread = thread
        thread.start()
        is_running.wait()

    def _build_api_and_start_loop(self, builder, *args, **kwargs):
        loop = asyncio.new_event_loop()
        self._loop = loop
        MODULE_LOG.info(f'MADE LOOP: {loop}, with builder: {builder} ')
        api = builder(*args, loop=loop, **kwargs)
        MODULE_LOG.info(f'BUILT AND STARTED LOOP = {api}')
        self._api = api
        is_running = object.__getattribute__(self, '_is_running')
        is_running.set()
        loop.run_forever()
        loop.close()

    def __repr__(self):
        return '<ThreadManager>'

    def clean_up(self):
        try:
            self._thread.join()
        except Exception as e:
            MODULE_LOG.exception(f'Exception while cleaning up'
                                 f'Hardware Thread Manager: {e}')

    def __del__(self):
        self.clean_up()

    @staticmethod
    async def call_coroutine_threadsafe(loop, coro, *args, **kwargs):
        MODULE_LOG.info(
            f'CCTS: loop: {loop}, coro: {coro}, args: {args}, kwargs: {kwargs}')
        fut = asyncio.run_coroutine_threadsafe(coro(*args, **kwargs), loop)
        wrapped = asyncio.wrap_future(fut)
        return await wrapped

    def __getattribute__(self, attr_name):
        # Almost every attribute retrieved from us will be for people actually
        # looking for an attribute of the hardware API, so check there first.
        api = object.__getattribute__(self, '_api')
        loop = object.__getattribute__(self, '_loop')
        try:
            attr = getattr(api, attr_name)
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
