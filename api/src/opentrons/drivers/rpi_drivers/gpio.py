import asyncio
import os
from sys import platform
import logging
from typing import Dict, Tuple

try:
    import gpiod
except ImportError:
    gpiod = None  # type: ignore

import systemd.daemon

"""
Raspberry Pi GPIO control module

Read/Write from RPi GPIO pins is performed by exporting a pin by number,
writing the direction for the pin, and then writing a high or low signal
to the pin value.

To export a pin, find the desired pin in OUTPUT_PINS or INPUT_PINS, and write
the corresponding number to `/sys/class/gpio/export`.

After export, set pin direction by writing either "in" or "out" to
`/sys/class/gpio/gpio<pin_number>/direction`.

After direction is set, set a pin high by writing a "1" or set the pin low by
writing "0" (zero) to `/sys/class/gpio/gpio<pin_number>/value`.

This library abstracts those operations by providing an `initialize` function
to set up all pins correctly, and then providing `set_low` and `set_high`
functions that accept a pin number. The OUTPUT_PINS and INPUT_PINS dicts
provide pin-mappings so calling code does not need to use raw integers.
"""

LOW = 0
HIGH = 1

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
    'WINDOW_INPUT': 20
}

MODULE_LOG = logging.getLogger(__name__)


class GPIOCharDev:
    def __init__(self, chip_name: str):
        self._chip = gpiod.Chip(chip_name)
        self._lines = self._initialize()

    @property
    def chip(self):
        return self._chip

    @property
    def lines(self) -> Dict:
        return self._lines

    def _request_line(self, offset, name, request_type):
        line = self.chip.get_line(offset)
        try:
            line.request(consumer=name, type=request_type, default_vals=[0])
        except OSError:
            MODULE_LOG.error(f'Line {offset} is busy. Cannot establish {name}')
        return line

    def _initialize(self):
        lines = {}
        # setup input lines
        for name, offset in INPUT_PINS.items():
            lines[offset] = self._request_line(offset, name, gpiod.LINE_REQ_DIR_IN)
        # setup output lines
        for name, offset in OUTPUT_PINS.items():
            if name is not 'BLUE_BUTTON':
                lines[offset] = self._request_line(offset, name, gpiod.LINE_REQ_DIR_OUT)
        MODULE_LOG.info(f'{lines}')
        return lines

    async def setup_blue_button(self):
        systemd.daemon.notify("READY=1")
        await asyncio.sleep(0.25)
        target = 'BLUE_BUTTON'
        line = self._request_line(OUTPUT_PINS[target], target, gpiod.LINE_REQ_DIR_OUT)
        self.lines[OUTPUT_PINS[target]] = line
        self.set_button_light(blue=True)
            
    async def setup(self):
        # smoothieware programming pins, must be in a known state (HIGH)
        self.set_halt_pin(True)
        self.set_isp_pin(True)
        self.set_reset_pin(False)
        await asyncio.sleep(0.25)
        self.set_reset_pin(True)
        await asyncio.sleep(0.25)

    def set_high(self, offset):
        self.lines[offset].set_value(HIGH)

    def set_low(self, offset):
        self.lines[offset].set_value(LOW)

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

    def release_line(self, offset):
        self.lines[offset].release()
        self.lines.pop(offset)
