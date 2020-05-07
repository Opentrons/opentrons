import asyncio
from typing import Callable, Dict, Tuple
from typing_extensions import Protocol
from opentrons.hardware_control.types import BoardRevision, DoorState
from .types import GPIOPin


class GPIODriverLike(Protocol):
    """ Interface for the GPIO drivers
    """
    def __init__(self, chip_name: str):
        ...

    @property
    def chip(self) -> str:
        ...

    @property
    def lines(self) -> Dict[str, int]:
        ...

    @property
    def board_rev(self) -> BoardRevision:
        ...

    @board_rev.setter
    def board_rev(self, boardrev: BoardRevision):
        ...

    async def setup(self):
        ...

    def config_by_board_rev(self):
        ...

    def set_high(self, output_pin: GPIOPin):
        ...

    def set_low(self, output_pin: GPIOPin):
        ...

    def set_button_light(self,
                         red: bool = False,
                         green: bool = False,
                         blue: bool = False):
        ...

    def set_rail_lights(self, on: bool = True):
        ...

    def set_reset_pin(self, on: bool = True):
        ...

    def set_isp_pin(self, on: bool = True):
        ...

    def set_halt_pin(self, on: bool = True):
        ...

    def get_button_light(self) -> Tuple[bool, bool, bool]:
        ...

    def get_rail_lights(self) -> bool:
        ...

    def read_button(self) -> bool:
        ...

    def read_window_switches(self) -> bool:
        ...

    def read_top_window_switch(self) -> bool:
        ...

    def read_front_door_switch(self) -> bool:
        ...

    def read_revision_bits(self) -> Tuple[bool, bool]:
        ...

    def get_door_switches_fd(self) -> int:
        ...

    def get_door_state(self) -> DoorState:
        ...

    async def monitor_door_switch_state(
            self, loop: asyncio.AbstractEventLoop,
            update_door_state: Callable[[DoorState], None]):
        ...

    def release_line(self, pin: GPIOPin):
        ...

    def quit_monitoring(self):
        ...
