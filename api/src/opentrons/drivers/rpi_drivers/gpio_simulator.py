from typing import Dict, Tuple


OUTPUT_PINS = {
    'FRAME_LEDS': 6,
    'BLUE_BUTTON': 13,
    'HALT': 18,
    'GREEN_BUTTON': 19,
    'AUDIO_ENABLE': 21,
    'ISP': 23,
    'RESET': 24,
    'RED_BUTTON': 26
}

INPUT_PINS = {
    'BUTTON_INPUT': 5,
    'WINDOW_INPUT': 20,
    'REV_0': 17,
    'REV_1': 27
}


class SimulatingGPIOCharDev:
    def __init__(self, chip_name: str):
        self._chip = chip_name
        self._lines = self._initialize()

    @property
    def chip(self) -> str:
        return self._chip

    @property
    def lines(self) -> Dict[int, str]:
        return self._lines

    def _initialize(self) -> Dict[int, str]:
        lines = {}
        for name, offset in INPUT_PINS.items():
            lines[offset] = name
        for name, offset in OUTPUT_PINS.items():
            lines[offset] = name
        self._initialize_values(list(lines.keys()))
        return lines

    def _initialize_values(self, offsets):
        self._values: Dict[int, int] = {}
        for offset in offsets:
            self._values[offset] = 0

    async def setup(self):
        pass

    def set_high(self, offset: int):
        self._values[offset] = 1

    def set_low(self, offset: int):
        self._values[offset] = 0

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

    def _read(self, offset: int) -> int:
        return self._values[offset]

    def get_button_light(self) -> Tuple[bool, bool, bool]:
        return (bool(self._read(OUTPUT_PINS['RED_BUTTON'])),
                bool(self._read(OUTPUT_PINS['GREEN_BUTTON'])),
                bool(self._read(OUTPUT_PINS['BLUE_BUTTON'])))

    def get_rail_lights(self) -> bool:
        return bool(self._read(OUTPUT_PINS['FRAME_LEDS']))

    def read_button(self) -> bool:
        pass

    def read_window_switches(self) -> bool:
        return (bool(self._read(OUTPUT_PINS['WINDOW_INPUT'])))

    def read_revision_bits(self) -> Tuple[bool, bool]:
        return (bool(self._read(OUTPUT_PINS['REV_0'])),
                bool(self._read(OUTPUT_PINS['REV_1'])))

    def release_line(self, offset: int):
        self.lines.pop(offset)
        self._values.pop(offset)
