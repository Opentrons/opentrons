""" Adapters for the :py:class:`.hardware_control.API` instances.
"""
import asyncio
import copy
import functools
import threading
from typing import List

from .api import API
from .thread_manager import ThreadManager
from .types import Axis, HardwareAPILike


class SynchronousAdapter(HardwareAPILike):
    """ A wrapper to make every call into :py:class:`.hardware_control.API`
    synchronous.

    Example
    -------
    .. code-block::
    >>> import opentrons.hardware_control as hc
    >>> import opentrons.hardware_control.adapters as adapts
    >>> api = hc.API.build_hardware_simulator()
    >>> synch = adapts.SynchronousAdapter(api)
    >>> synch.home()
    """

    @classmethod
    def build(cls, builder, *args, **kwargs) -> 'SynchronousAdapter':
        """ Build a hardware control API and initialize the adapter in one call

        :param builder: the builder method to use (e.g.
                :py:meth:`hardware_control.API.build_hardware_simulator`)
        :param args: Args to forward to the builder method
        :param kwargs: Kwargs to forward to the builder method
        """

        outer_loop = asyncio.new_event_loop()
        no_loop_args = [arg for arg in args
                        if not isinstance(arg, asyncio.AbstractEventLoop)]
        api = ThreadManager(builder, *no_loop_args, **kwargs)
        return cls(api)

    def __init__(self, api: API) -> None:
        """ Build the SynchronousAdapter.

        :param api: The API instance to wrap
        """
        self._api = api

    def __repr__(self):
        return '<SynchronousAdapter>'

    def __del__(self):
        try:
            api = object.__getattribute__(self, '_api')
            inner_loop = api._loop
        except AttributeError:
            pass
        else:
            if inner_loop.is_running():
                inner_loop.call_soon_threadsafe(lambda: inner_loop.stop())

    @staticmethod
    def call_coroutine_sync(loop, to_call, *args, **kwargs):
        print(f'CALL RUN CORO SYNC CALLED {asyncio.run_coroutine_threadsafe(to_call(*args, **kwargs), loop)}')
        fut = asyncio.run_coroutine_threadsafe(to_call(*args, **kwargs), loop)
        print(f'CALL CORO SYNC To CALL {to_call}')
        print(f'CALL CORO SYNC loop {loop}')
        print(f'CALL CORO SYNC loop {loop.my_id}')
        print(f'CALL CORO SYNC . {threading.currentThread().getName()} "')
        return fut.result()

    def __getattribute__(self, attr_name):
        """ Retrieve attributes from our API and wrap coroutines """
        # Almost every attribute retrieved from us will be for people actually
        # looking for an attribute of the hardware API, so check there first.
        api = object.__getattribute__(self, '_api')
        try:
            api_attr = getattr(api, attr_name)
        except AttributeError:
            # Maybe this actually was for us? Let’s find it
            return object.__getattribute__(self, attr_name)

        check = api_attr
        if isinstance(api_attr, functools.partial):
            # if partial func check passed in func
            check = api_attr.func
        try:
            # if decorated func check wrapped func
            check = check.__wrapped__
        except AttributeError:
            pass
        if asyncio.iscoroutinefunction(check):
            # Return a synchronized version of the coroutine
            return functools.partial(self.call_coroutine_sync,
                                     api._loop, api_attr)
        elif asyncio.iscoroutine(check):
            # Catch awaitable properties and reify the future before returning
            fut = asyncio.run_coroutine_threadsafe(check, api._loop)
            return fut.result()

        return api_attr
