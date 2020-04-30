from typing import Dict, Tuple
from typing_extensions import Protocol


class GPIODriverLike(Protocol):
    """ Interface for the GPIO drivers
    """
    def __init__(self, chip_name: str):
        ...

    @property
    def chip(self) -> str:
        ...

    @property
    def lines(self) -> Dict[int, str]:
        ...

    async def setup(self):
        ...

    def config_by_board_rev(self, BoardRevision):
        ...

    def set_high(self, offset: int):
        ...

    def set_low(self, offset: int):
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

    def read_revision_bits(self) -> Tuple[bool, bool]:
        ...

    def release_line(self, offset: int):
        ...
