""" Top level Manager that gates execution of all
ancestors of the :py:class:`.hardware_control.API`
It centralizes the runtime control of hardware that allows
atomic actions to be "paused" and subsequently "resumed"
"""
import asyncio
import logging
import functools

MODULE_LOG = logging.getLogger(__name__)


class PauseManager():
    def __init__(self, loop: asyncio.AbstractEventLoop, is_simulating: bool):
        self._run_flag = asyncio.Event(loop=loop)
        self._run_flag.set()
        self._is_simulating = is_simulating

    async def hold_while_paused(self):
        if self._is_simulating:
            return True
        else:
            return await self._run_flag.wait()

    def pause(self):
        self._run_flag.clear()

    def resume(self):
        self._run_flag.set()

    def is_paused(self):
        self._run_flag.is_set()


def pausable(func):
    """ Decorator. Apply to Hardware Control methods or attributes to indicate
    they should be held and released by pauses and resumes respectively.
    """
    @functools.wraps(func)
    async def pausable_wrapped_obj(*args, **kwargs):
        self = args[0]
        try:
            await self.pause_manager.hold_while_paused()
        except AttributeError as e:
            MODULE_LOG.exception(f'Pausable cannot decorate function without'
                                 f'reference to pause_manager: {e}')
        return func(*args, **kwargs)
    return pausable_wrapped_obj
