import asyncio
import logging
from typing import Callable, Dict, Tuple, List

from opentrons.hardware_control.types import BoardRevision, DoorState
from .types import gpio_group, GPIOPin

MODULE_LOG = logging.getLogger(__name__)


class SimulatingGPIOCharDev:
    def __init__(self, chip_name: str):
        self._chip = chip_name
        self._board_rev = BoardRevision.UNKNOWN
        self._lines = self._initialize()

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
    def board_rev(self, boardrev: BoardRevision) -> None:
        self._board_rev = boardrev

    def _initialize(self) -> Dict[str, int]:
        lines: Dict[str, int] = {}
        for pin in gpio_group.pins:
            line = pin.by_board_rev(self.board_rev)
            if line is not None:
                lines[pin.name] = line
        self._initialize_values(list(lines.keys()))
        return lines

    def _initialize_values(self, names: List[str]) -> None:
        self._values: Dict[str, int] = {}
        for name in names:
            self._values[name] = 1

    async def setup(self) -> None:
        pass

    def config_by_board_rev(self) -> None:
        self.board_rev = BoardRevision.by_bits(self.read_revision_bits())

    def set_high(self, output_pin: GPIOPin) -> None:
        self._values[output_pin.name] = 1

    def set_low(self, output_pin: GPIOPin) -> None:
        self._values[output_pin.name] = 0

    def set_button_light(
        self, red: bool = False, green: bool = False, blue: bool = False
    ) -> None:
        pass

    def set_rail_lights(self, on: bool = True) -> None:
        pass

    def set_reset_pin(self, on: bool = True) -> None:
        pass

    def set_isp_pin(self, on: bool = True) -> None:
        pass

    def set_halt_pin(self, on: bool = True) -> None:
        pass

    def _read(self, input_pin: GPIOPin) -> int:
        return self._values[input_pin.name]

    def get_button_light(self) -> Tuple[bool, bool, bool]:
        return (
            bool(self._read(gpio_group.red_button)),
            bool(self._read(gpio_group.green_button)),
            bool(self._read(gpio_group.blue_button)),
        )

    def get_rail_lights(self) -> bool:
        return bool(self._read(gpio_group.frame_leds))

    def read_button(self) -> bool:
        # button is normal-HIGH, so invert
        return not bool(self._read(gpio_group.button_input))

    def read_window_switches(self) -> bool:
        return bool(self._read(gpio_group.window_door_sw))

    def read_top_window_switch(self) -> bool:
        return bool(self._read(gpio_group.window_sw_filt))

    def read_front_door_switch(self) -> bool:
        return bool(self._read(gpio_group.door_sw_filt))

    def read_revision_bits(self) -> Tuple[bool, bool]:
        return bool(self._read(gpio_group.rev_0)), bool(self._read(gpio_group.rev_1))

    def get_door_state(self) -> DoorState:
        val = self.read_window_switches()
        if val:
            return DoorState.CLOSED
        else:
            return DoorState.OPEN

    def start_door_switch_watcher(
        self,
        loop: asyncio.AbstractEventLoop,
        update_door_state: Callable[[DoorState], None],
    ) -> None:
        current_door_value = self.read_window_switches()
        if current_door_value == 0:
            update_door_state(DoorState.OPEN)
        else:
            update_door_state(DoorState.CLOSED)

    def release_line(self, pin: GPIOPin) -> None:
        self.lines.pop(pin.name)

    def stop_door_switch_watcher(self, loop: asyncio.AbstractEventLoop) -> None:
        pass
