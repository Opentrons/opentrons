"""Button control logic.

This module has to be fairly flexible to support both ProtocolEngine
and RPC-based protocol runs. This can be replaced / updated to be more
engine-specific whenever RPC is dropped.
"""
import asyncio
import logging
from typing import Set

from opentrons.hardware_control import API as HardwareAPI, ButtonWatcher, ButtonEvent
from opentrons.protocol_engine import ProtocolEngine
from .protocol_runner import ProtocolRunner

log = logging.getLogger(__name__)


class ButtonController:
    """Interface to control a protocol run via button presses."""

    def __init__(self, hardware_api: HardwareAPI) -> None:
        """Initialize the ButtonController with access to the HardwareAPI."""
        self._button_watcher = ButtonWatcher(gpio=hardware_api._backend.gpio_chardev)

    async def control(
        self,
        protocol_runner: ProtocolRunner,
        protocol_engine: ProtocolEngine,
    ) -> None:
        """Control a given ProtocolRunner and ProtocolEngine via hardware buttons."""
        get_stop_requested = protocol_engine.state_view.commands.get_stop_requested

        log.info("HEY: controlling run with button")

        while not get_stop_requested():
            log.info("HEY: getting next button event")
            event = await self._get_next_event(protocol_engine)
            log.info("HEY: got it", event)

            if event == ButtonEvent.HOLD:
                await self._handle_hold(protocol_runner, protocol_engine)
            else:
                self._handle_press(protocol_runner, protocol_engine)

    async def _get_next_event(self, protocol_engine: ProtocolEngine) -> ButtonEvent:
        get_stop_requested = protocol_engine.state_view.commands.get_stop_requested

        watch_button = asyncio.create_task(self._button_watcher.watch())
        watch_stop = asyncio.create_task(protocol_engine.wait_for(get_stop_requested))

        tasks: Set[asyncio.Task] = {watch_button, watch_stop}
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

        if watch_stop in done:
            watch_button.cancel()
        else:
            watch_stop.cancel()

        await asyncio.gather(*tasks, return_exceptions=True)

        return await watch_button

    async def _handle_hold(
        self,
        protocol_runner: ProtocolRunner,
        protocol_engine: ProtocolEngine,
    ) -> None:
        if not protocol_engine.state_view.commands.get_stop_requested():
            await protocol_runner.stop()

    def _handle_press(
        self,
        protocol_runner: ProtocolRunner,
        protocol_engine: ProtocolEngine,
    ) -> None:
        if not protocol_engine.state_view.commands.get_stop_requested():
            if protocol_engine.state_view.commands.get_is_running():
                log.info("HEY: pausing runner")
                protocol_runner.pause()
            else:
                log.info("HEY: playing runner")
                protocol_runner.play()
