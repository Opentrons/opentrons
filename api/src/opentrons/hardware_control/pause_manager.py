import asyncio


class PauseManager():
    """ This class holds onto a flag that is up/set while the hardware
    hardware controller is running and down/cleared when the hardware
    controller is "paused".
    """
    def __init__(self, loop: asyncio.AbstractEventLoop):
        self._is_running = asyncio.Event(loop=loop)
        self._is_running.set()

    def pause(self):
        self._is_running.clear()

    def resume(self):
        self._is_running.set()

    @property
    def is_running(self):
        self._is_running.is_set()

    async def wait_for_is_running(self):
        await self._is_running.wait()
