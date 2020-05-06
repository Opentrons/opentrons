import asyncio
import logging
import pathlib
from typing import Dict, Tuple
import time
from . import RevisionPinsError

import gpiod  # type: ignore

"""
Raspberry Pi GPIO control module
"""

# Note: in test pins are sorted by value, so listing them in that order here
#   makes it easier to read the tests. Pin numbers defined by bridge wiring
#   the Pi to the Smoothie.
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

MODULE_LOG = logging.getLogger(__name__)

DTOVERLAY_PATH = '/proc/device-tree/soc/gpio@7e200000/gpio_rev_bit_pins'


class GPIOCharDev:
    def __init__(self, chip_name: str):
        self._chip = gpiod.Chip(chip_name)
        self._lines = self._initialize()

    @property
    def chip(self) -> gpiod.Chip:
        return self._chip

    @property
    def lines(self) -> Dict[int, gpiod.Line]:
        return self._lines

    def _request_line(
            self,
            offset: int, name: str, request_type) -> gpiod.Line:
        line = self.chip.get_line(offset)

        def _retry_request_line(retries: int = 0):
            try:
                line.request(
                    consumer=name, type=request_type, default_vals=[0])
            except OSError as e:
                retries -= 1
                if retries <= 0:
                    raise e
                time.sleep(0.25)
                return _retry_request_line(retries)
            return line

        if name == 'BLUE_BUTTON':
            return _retry_request_line(3)
        else:
            return _retry_request_line()

    def _initialize(self) -> Dict[int, gpiod.Line]:
        MODULE_LOG.info("Initializing GPIOs")
        lines = {}
        # setup input lines
        for name, offset in INPUT_PINS.items():
            lines[offset] = self._request_line(
                offset, name, gpiod.LINE_REQ_DIR_IN)
        # setup output lines
        for name, offset in OUTPUT_PINS.items():
            lines[offset] = self._request_line(
                offset, name, gpiod.LINE_REQ_DIR_OUT)
        return lines

    async def setup(self):
        MODULE_LOG.info("Setting up GPIOs")
        # smoothieware programming pins, must be in a known state (HIGH)
        self.set_halt_pin(True)
        self.set_isp_pin(True)
        self.set_reset_pin(False)
        await asyncio.sleep(0.25)
        self.set_reset_pin(True)
        await asyncio.sleep(0.25)

    def set_high(self, offset: int):
        self.lines[offset].set_value(1)

    def set_low(self, offset: int):
        self.lines[offset].set_value(0)

    def set_button_light(self,
                         red: bool = False,
                         green: bool = False,
                         blue: bool = False):
        color_pins = {
            OUTPUT_PINS['RED_BUTTON']: red,
            OUTPUT_PINS['GREEN_BUTTON']: green,
            OUTPUT_PINS['BLUE_BUTTON']: blue}
        for pin, state in color_pins.items():
            if state:
                self.set_high(pin)
            else:
                self.set_low(pin)

    def set_rail_lights(self, on: bool = True):
        if on:
            self.set_high(OUTPUT_PINS['FRAME_LEDS'])
        else:
            self.set_low(OUTPUT_PINS['FRAME_LEDS'])

    def set_reset_pin(self, on: bool = True):
        if on:
            self.set_high(OUTPUT_PINS['RESET'])
        else:
            self.set_low(OUTPUT_PINS['RESET'])

    def set_isp_pin(self, on: bool = True):
        if on:
            self.set_high(OUTPUT_PINS['ISP'])
        else:
            self.set_low(OUTPUT_PINS['ISP'])

    def set_halt_pin(self, on: bool = True):
        if on:
            self.set_high(OUTPUT_PINS['HALT'])
        else:
            self.set_low(OUTPUT_PINS['HALT'])

    def _read(self, offset):
        return self.lines[offset].get_value()

    def get_button_light(self) -> Tuple[bool, bool, bool]:
        return (bool(self._read(OUTPUT_PINS['RED_BUTTON'])),
                bool(self._read(OUTPUT_PINS['GREEN_BUTTON'])),
                bool(self._read(OUTPUT_PINS['BLUE_BUTTON'])))

    def get_rail_lights(self) -> bool:
        return bool(self._read(OUTPUT_PINS['FRAME_LEDS']))

    def read_button(self) -> bool:
        # button is normal-HIGH, so invert
        return not bool(self._read(INPUT_PINS['BUTTON_INPUT']))

    def read_window_switches(self) -> bool:
        return bool(self._read(INPUT_PINS['WINDOW_INPUT']))

    def read_revision_bits(self) -> Tuple[bool, bool]:
        """ Read revision bit GPIO pins

        If the gpio_rev_bit_pins device tree overlay is enabled,
        returns the pins' values. Otherwise, return RevisionPinsError
        """
        if pathlib.Path(DTOVERLAY_PATH).exists():
            return (bool(self._read(INPUT_PINS['REV_0'])),
                    bool(self._read(INPUT_PINS['REV_1'])))
        else:
            raise RevisionPinsError

    def release_line(self, offset: int):
        self.lines[offset].release()
        self.lines.pop(offset)
