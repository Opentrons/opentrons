from typing import Dict, Tuple

from opentrons.hardware_control.types import BoardRevision
from .types import OutputPins, RevPins, InputPins, GPIOPins


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
        for pin_set in [OutputPins, RevPins, InputPins]:
            for pin in list(pin_set):
                lines[pin.name] = pin.value
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

    def set_high(self, output_pin: OutputPins):
        name = str(output_pin)
        self._values[name] = 1

    def set_low(self, output_pin: OutputPins):
        name = str(output_pin)
        self._values[name] = 0

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

    def _read(self, input_pin: GPIOPins) -> int:
        name = str(input_pin)
        return self._values[name]

    def get_button_light(self) -> Tuple[bool, bool, bool]:
        return (bool(self._read(OutputPins.red_button)),
                bool(self._read(OutputPins.green_button)),
                bool(self._read(OutputPins.blue_button)))

    def get_rail_lights(self) -> bool:
        return bool(self._read(OutputPins.frame_leds))

    def read_button(self) -> bool:
        # button is normal-HIGH, so invert
        return not bool(self._read(InputPins.button_input))

    def read_window_switches(self) -> bool:
        return bool(self._read(InputPins.window_door_sw))

    def read_top_window_switch(self) -> bool:
        return bool(self._read(InputPins.window_sw_filt))

    def read_front_door_switch(self) -> bool:
        return bool(self._read(InputPins.door_sw_filt))

    def read_revision_bits(self) -> Tuple[bool, bool]:
        return (bool(self._read(RevPins.rev_0)),
                bool(self._read(RevPins.rev_1)))

    # def release_line(self, gpio_pins: GPIOPins):
    #     name = str(gpio_pins)
    #     self.lines[name].release()
    #     self.lines.pop(name)
