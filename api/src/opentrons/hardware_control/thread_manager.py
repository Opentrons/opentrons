""" Manager for the :py:class:`.hardware_control.API` thread.
"""
import threading
import logging
import asyncio
from . import API
from .types import Axis, HardwareAPILike

MODULE_LOG = logging.getLogger(__name__)


class HardwareThreadManager(HardwareAPILike):
    """ A wrapper to make every call into :py:class:`.hardware_control.API`
    execute within the same thread.

    Example
    -------
    .. code-block::
    >>> import opentrons.hardware_control as hc
    >>> from opentrons.hardware_control import thread_manager
    >>> builder = hc.API.build_hardware_simulator
    >>> api_single_thread = thread_manager.HardwareThreadManager(builder)
    >>> await api_single_thread.home()
    """

    def __init__(self, builder, *args, **kwargs) -> None:
        """ Build the HardwareThreadManager.

        :param builder: The API function to use
        """
        self._loop = None
        self._api = None
        self._thread = threading.Thread(target=self._build_api_and_start_loop,
                                        name='Hardware control thread', args=(builder, *args), kwargs=kwargs)
        self._thread.start()

    def _build_api_and_start_loop(self, builder):
        self._loop = asyncio.new_event_loop()
        self._api = builder(self._loop)
        MODULE_LOG.info(f'BUILT AND STARTED LOOP = ')
        self._loop.run_forever()
        self._loop.close()

    def __repr__(self):
        return '<HardwareThreadManager>'

    def __del__(self):
        try:
            self._thread.join()
        except Exception as e:
            log.exception(f'Exception while cleaning up'
                          f'Hardware Thread Manager: {e}')

    @staticmethod
    async def call_coroutine_threadsafe(loop, coro, *args, **kwargs):
        fut = loop.call_coroutine_threadsafe(coro(*args, **kwargs))
        wrapped = asyncio.wrap_future(fut)
        return await fut.result()

    def __getattr__(self, attr_name):
        # loop = self._loop
        if asyncio.iscoroutinefunction(attr_name):
            # Return coroutine result of async function
            # executed in managed thread to calling thread
            return functools.partial(self.call_coroutine_threadsafe,
                                     object.__getattribute__(self, '_loop'),
                                     attr_name)
        # elif attr_name == '_loop':
        #     return loop

        api = object.__getattribute__(self, '_api')
        return getattr(api, attr_name)
