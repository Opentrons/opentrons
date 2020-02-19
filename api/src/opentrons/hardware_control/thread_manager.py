""" Manager for the :py:class:`.hardware_control.API` thread.
"""
import threading
import logging
import asyncio
import functools
import inspect
from typing import Callable, Awaitable, Any
from .types import HardwareAPILike

MODULE_LOG = logging.getLogger(__name__)

class ThreadManager():
    """ A wrapper to make every call into a given class
        (e.g. :py:class:`.hardware_control.API`)
        execute within the same thread.

    Example
    -------
    .. code-block::
    >>> from opentrons.hardware_control import API, ThreadManager
    >>> api_single_thread = ThreadManager(API.build_hardware_simulator)
    >>> await api_single_thread.home()
    """

    def __init__(self,
                builder: Callable[..., Awaitable[Any]],
                *args, **kwargs) -> None:
        """ Build the ThreadManager.

        :param builder: The async builder function
                        to call within managed thread
        """

        self._loop = None
        self._built_obj = None
        self._is_running = threading.Event()
        self._thread = threading.Thread(target=self._build_and_wrap,
                                        name='Hardware thread',
                                        args=(builder, *args),
                                        kwargs=kwargs)
        self._thread.start()
        self._is_running.wait()


    async def _build_with_loop(self, builder, *args, **kwargs):
        loop = asyncio.new_event_loop()
        self._loop = loop
        return await builder(*args, loop=loop, **kwargs)

    def _build_and_wrap(self, builder, *args, **kwargs):
        try:
            outer_loop = asyncio.get_event_loop()
        except RuntimeError:
            outer_loop = asyncio.new_event_loop()
        self._built_obj = outer_loop.run_until_complete(
            self._build_with_loop(builder, *args, **kwargs)
        )

        def _filter(member):
            # return not inspect.isbuiltin(member)
            return True

        for mname, mobj in inspect.getmembers(self._built_obj, _filter):
            if not mname.startswith('__') :
                value = mobj
                print(f'self is : {self}, bo : {self._built_obj}, mname: {mname}')
                if asyncio.iscoroutinefunction(value):
                    # fix threadsafe version of async function
                    # to execute in managed thread from calling thread
                    value = functools.partial(self._call_coroutine_threadsafe,
                                            self._loop,
                                            value)
                self.__setattr__(mname, value)

        self._is_running.set()
        self._loop.run_forever()
        self._loop.close()

    @staticmethod
    async def _call_coroutine_threadsafe(loop, coro_func, *args, **kwargs):
        fut = asyncio.run_coroutine_threadsafe(coro_func(*args, **kwargs),
                                                loop)
        wrapped = asyncio.wrap_future(fut)
        print(f'\nCALL CORO threadsafe: {wrapped}, loop: {loop}\n')
        return await wrapped


    def __repr__(self):
        return '<ThreadManager>'

    def clean_up(self):
        try:
            self._loop.call_soon_threadsafe(lambda: self._loop.stop())
            self._thread.join()
        except Exception as e:
            MODULE_LOG.exception(f'Exception while cleaning up'
                                 f'Thread Manager: {e}')

    def __del__(self):
        self.clean_up()
