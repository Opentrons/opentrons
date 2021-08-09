"""Watch buttons for press and hold events.

NOTE: This interface currently only watches the front button. It
can/should be extended to also watch the window switches.
"""
from __future__ import annotations

import asyncio
from enum import Enum
from typing import NamedTuple, Optional, Set

from opentrons.drivers.rpi_drivers.dev_types import GPIODriverLike


class ButtonEvent(str, Enum):
    PRESS = "press"
    HOLD = "hold"


class LineEventType(int, Enum):
    """Convenience duplicate of gpiod.RISING_EDGE and gpiod.FALLING_EDGE."""

    RISING_EDGE = 1
    FALLING_EDGE = 2


class LineEvent(NamedTuple):
    """Convenience wrapper of gpiod.LineEvent."""

    type: LineEventType
    sec: int
    nsec: int


class ButtonWatcher:
    """An interface to watch buttons and return interaction events."""

    def __init__(
        self,
        gpio: GPIODriverLike,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        *,
        button_reader: Optional[ButtonReader] = None,
        button_tracker: Optional[ButtonTracker] = None,
    ) -> None:
        self._loop = loop or asyncio.get_running_loop()
        self._button_reader = button_reader or ButtonReader(gpio=gpio, loop=loop)
        self._button_tracker = button_tracker or ButtonTracker(loop=loop)

    async def watch(self) -> ButtonEvent:
        """Watch for the next button event."""
        button_event = None
        button_event_task = self._loop.create_task(self._button_tracker.get_event())

        while button_event is None:
            button_read_task = self._loop.create_task(self._button_reader.read())
            tasks: Set[asyncio.Task] = {button_event_task, button_read_task}

            done, pending = await asyncio.wait(
                tasks,
                return_when=asyncio.FIRST_COMPLETED,
                loop=self._loop,
            )

            if button_event_task in done:
                button_read_task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True, loop=self._loop)
                button_event = button_event_task.result()

            else:
                line_event = button_read_task.result()
                self._button_tracker.track(line_event)

        return button_event


class ButtonTracker:
    """Track `gpiod.LineEvent`s into presses and holds."""

    HOLD_TIME: float = 2.0

    def __init__(
        self,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        self._loop = loop or asyncio.get_running_loop()
        self._pressed: asyncio.Event = asyncio.Event()
        self._released: asyncio.Event = asyncio.Event()

    def track(self, line_event: LineEvent) -> None:
        """Debounce line events into usable button events."""
        next_type = line_event.type

        if next_type == LineEventType.FALLING_EDGE:
            self._pressed.set()
        else:
            self._released.set()

    async def get_event(self) -> ButtonEvent:
        await self._pressed.wait()

        release_task = self._loop.create_task(self._wait_for_release())
        hold_task = self._loop.create_task(self._wait_for_hold())
        tasks: Set[asyncio.Task] = {release_task, hold_task}

        done, pending = await asyncio.wait(
            tasks,
            return_when=asyncio.FIRST_COMPLETED,
            loop=self._loop,
        )

        if hold_task in done:
            button_event = ButtonEvent.HOLD
            release_task.cancel()
        else:
            button_event = ButtonEvent.PRESS
            hold_task.cancel()

        await asyncio.gather(*tasks, return_exceptions=True, loop=self._loop)
        self._pressed.clear()
        self._released.clear()
        return button_event

    async def _wait_for_release(self) -> None:
        await self._released.wait()

    async def _wait_for_hold(self) -> None:
        await asyncio.sleep(self.HOLD_TIME, loop=self._loop)


class ButtonReader:
    """An interface to read button events."""

    def __init__(
        self,
        gpio: GPIODriverLike,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        """Initialize the ButtonReader."""
        self._gpio = gpio
        self._loop = loop or asyncio.get_running_loop()

    async def read(self) -> LineEvent:
        button_line = self._gpio.lines["button_input"]
        file_descriptor = button_line.event_get_fd()  # type: ignore[attr-defined]
        ready_event = asyncio.Event()

        self._loop.add_reader(file_descriptor, ready_event.set)

        try:
            await ready_event.wait()
            event = button_line.event_read()  # type: ignore[attr-defined]
            return LineEvent(type=event.type, sec=event.sec, nsec=event.nsec)
        finally:
            self._loop.remove_reader(file_descriptor)
