""" Utility functions and classes for the hardware controller"""
import functools
import inspect
import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from . import types, adapters, API, HardwareAPILike

mod_log = logging.getLogger(__name__)


def _handle_loop_exception(loop: asyncio.AbstractEventLoop,
                           context: Dict[str, Any]):
    mod_log.error(f"Caught exception: {context['exception']}:"
                  f" {context['message']}")


def use_or_initialize_loop(loop: Optional[asyncio.AbstractEventLoop]
                           ) -> asyncio.AbstractEventLoop:
    checked_loop = loop or asyncio.get_event_loop()
    checked_loop.set_exception_handler(_handle_loop_exception)
    return checked_loop


def log_call(func):
    if inspect.iscoroutinefunction(func):
        @functools.wraps(func)
        async def _log_call_inner(*args, **kwargs):
            args[0]._log.debug(func.__name__)
            return await func(*args, **kwargs)
    else:
        @functools.wraps(func)
        def _log_call_inner(*args, **kwargs):
            args[0]._log.debug(func.__name__)
            return func(*args, **kwargs)
    return _log_call_inner


class PauseManager():
    """ This centralizes the runtime control of hardware that allows
    atomic actions to be "paused" and subsequently "resumed"
    """

    def __init__(self,
                 loop: asyncio.AbstractEventLoop = None,
                 is_simulating: bool) -> None:
        if None is loop:
            self._loop = asyncio.get_event_loop()
        else:
            self._loop = loop
        self._is_running_flag = asyncio.Event(self._loop)
        self._is_simulating = is_simulating

    async def pausable(self, decorated_obj: Callable) -> Callable:
        """ Decorator. Apply to Hardware Control methods or attributes to indicate
        they should be held and released by pauses and resumes respectively.
        """
        @functools.wraps(decorated_obj)
        async def _hold_if_paused(*args, **kwargs):
            if not self._is_simulating:
                await self._is_running_flag.wait()
            return decorated_obj(*args, **kwargs)

      return _hold_if_paused

    def pause(self):
        self._is_running_flag.clear()

    def resume(self):
        self._is_running_flag.set()
