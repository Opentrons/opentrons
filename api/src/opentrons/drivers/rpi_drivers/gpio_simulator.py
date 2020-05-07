import asyncio
import logging
from typing import Dict, Tuple

from opentrons.hardware_control.types import (
    BoardRevision, DoorState, HardwareAPILike)
from .types import gpio_list, GPIOPin, GpioQueueEvents

MODULE_LOG = logging.getLogger(__name__)


class SimulatingGPIOCharDev:
    def __init__(self, chip_name: str):
        self._chip = chip_name
        self._lines = self._initialize()
        self._board_rev = BoardRevision.UNKNOWN

    @property
    def chip(self) -> str:
        return self._chip

    @property
    def lines(self) -> Dict[str, int]:
        return self._lines

    @property
    def board_rev(self) -> BoardRevision:
        return self._board_rev

    @board_rev.setter
    def board_rev(self, boardrev: BoardRevision):
        self._board_rev = boardrev

    def _initialize(self) -> Dict[str, int]:
        lines = {}
        for pin in gpio_list:
            lines[pin.name] = pin.by_board_rev(self.board_rev)
        self._initialize_values(list(lines.keys()))
        return lines

    def _initialize_values(self, names):
        self._values: Dict[str, int] = {}
        for name in names:
            self._values[name] = 1

    async def setup(self):
        pass

    def config_by_board_rev(self):
        self._board_rev = BoardRevision.by_bits(
            self.read_revision_bits())

    def set_high(self, output_pin: GPIOPin):
        self._values[output_pin.name] = 1

    def set_low(self, output_pin: GPIOPin):
        self._values[output_pin.name] = 0

    def set_button_light(self,
                         red: bool = False,
                         green: bool = False,
                         blue: bool = False):
        pass

    def set_rail_lights(self, on: bool = True):
        pass

    def set_reset_pin(self, on: bool = True):
        pass

    def set_isp_pin(self, on: bool = True):
        pass

    def set_halt_pin(self, on: bool = True):
        pass

    def _read(self, input_pin: GPIOPin) -> int:
        return self._values[input_pin.name]

    def get_button_light(self) -> Tuple[bool, bool, bool]:
        return (bool(self._read(gpio_list.red_button)),
                bool(self._read(gpio_list.green_button)),
                bool(self._read(gpio_list.blue_button)))

    def get_rail_lights(self) -> bool:
        return bool(self._read(gpio_list.frame_leds))

    def read_button(self) -> bool:
        # button is normal-HIGH, so invert
        return not bool(self._read(gpio_list.button_input))

    def read_window_switches(self) -> bool:
        return bool(self._read(gpio_list.window_door_sw))

    def read_top_window_switch(self) -> bool:
        return bool(self._read(gpio_list.window_sw_filt))

    def read_front_door_switch(self) -> bool:
        return bool(self._read(gpio_list.door_sw_filt))

    def read_revision_bits(self) -> Tuple[bool, bool]:
        return (bool(self._read(gpio_list.rev_0)),
                bool(self._read(gpio_list.rev_1)))

    def get_door_switches_fd(self) -> int:
        return 101

    def get_door_state(self) -> DoorState:
        return DoorState.CLOSED

    async def _watch_door_switch_event(
            self,
            event_queue: asyncio.Queue,
            api: HardwareAPILike):
        ev = await event_queue.get()
        if ev == GpioQueueEvents.EVENT_RECEIVED:
            door_state = self.get_door_state()
            api.door_state = door_state
            MODULE_LOG.info(
                f'Updating the window switch status: {api.door_state}')
        elif ev == GpioQueueEvents.QUIT:
            return
        else:
            raise RuntimeError("Event queue has received an unknown item")

    async def monitor_door_switch_state(
            self, loop: asyncio.AbstractEventLoop,
            api: HardwareAPILike):
        event_queue: asyncio.Queue = asyncio.Queue()
        while True:
            await self._watch_door_switch_event(event_queue, api)

    def release_line(self, pin: GPIOPin):
        self.lines.pop(pin.name)
