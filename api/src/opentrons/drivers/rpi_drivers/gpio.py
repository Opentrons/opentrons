import asyncio
import logging
import pathlib
from typing import Dict, Tuple
import time
from opentrons.hardware_control.types import BoardRevision
from . import RevisionPinsError
from .types import (OutputPins, RevPins, InputPins, GPIOPins,
                    group_by_gpio)


import gpiod  # type: ignore

"""
Raspberry Pi GPIO control module
"""

MODULE_LOG = logging.getLogger(__name__)

DTOVERLAY_PATH = '/proc/device-tree/soc/gpio@7e200000/gpio_rev_bit_pins'


class GPIOCharDev:
    def __init__(self, chip_name: str):
        self._chip = gpiod.Chip(chip_name)
        self._lines = self._initialize()
        self._board_rev = BoardRevision.UNKNOWN

    @property
    def chip(self) -> gpiod.Chip:
        return self._chip

    @property
    def lines(self) -> Dict[str, gpiod.Line]:
        return self._lines

    @property
    def board_rev(self) -> BoardRevision:
        return self._board_rev

    @board_rev.setter
    def board_rev(self, boardrev: BoardRevision):
        self._board_rev = boardrev

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

        if name == OutputPins.blue_button.name:
            return _retry_request_line(3)
        else:
            return _retry_request_line()

    def _initialize(self) -> Dict[str, gpiod.Line]:
        MODULE_LOG.info(
            "Registering Central Routing Board Revision GPIOs")
        lines = {}
        for rev_pin in list(RevPins):
            lines[rev_pin.name] = self._request_line(
                rev_pin.value, rev_pin.name, gpiod.LINE_REQ_DIR_IN)
        return lines

    def _determine_board_revision(self):
        """Read revision bit pins and return the board revision
        """
        try:
            rev_bits = self.read_revision_bits()
            return BoardRevision.by_bits(rev_bits)
        except RevisionPinsError:
            MODULE_LOG.info(
                'Failed to detect central routing board revision gpio '
                'pins, defaulting to 2.1 (OG)')
            return BoardRevision.OG
        except Exception:
            MODULE_LOG.exception(
                'Unexpected error from reading central routing board '
                'revision bits')
            return BoardRevision.UNKNOWN

    def config_by_board_rev(self):
        MODULE_LOG.info(
            "Configuring GPIOs by central routing roard revision")
        # get board revision based on rev bits
        self.board_rev = self._determine_board_revision()

        # setup output lines
        for output in list(OutputPins):
            self._lines[output.name] = self._request_line(
                output.value, output.name, gpiod.LINE_REQ_DIR_OUT)

        # setup input lines
        input_by_board = InputPins.by_board_rev(self.board_rev)
        sorted_input = group_by_gpio(input_by_board)
        for pin, names in sorted_input.items():
            line = self._request_line(
                pin, names[0], gpiod.LINE_REQ_EV_BOTH_EDGES)
            for name in names:
                self._lines[name] = line

    async def setup(self):
        MODULE_LOG.info("Setting up GPIOs")
        # smoothieware programming pins, must be in a known state (HIGH)
        self.set_halt_pin(True)
        self.set_isp_pin(True)
        self.set_reset_pin(False)
        await asyncio.sleep(0.25)
        self.set_reset_pin(True)
        await asyncio.sleep(0.25)

    def set_high(self, output_pin: OutputPins):
        name = str(output_pin)
        self.lines[name].set_value(1)

    def set_low(self, output_pin: OutputPins):
        name = str(output_pin)
        self.lines[name].set_value(0)

    def set_button_light(self,
                         red: bool = False,
                         green: bool = False,
                         blue: bool = False):
        color_pins = {
            OutputPins.red_button: red,
            OutputPins.green_button: green,
            OutputPins.blue_button: blue}
        for pin, state in color_pins.items():
            if state:
                self.set_high(pin)
            else:
                self.set_low(pin)

    def set_rail_lights(self, on: bool = True):
        if on:
            self.set_high(OutputPins.frame_leds)
        else:
            self.set_low(OutputPins.frame_leds)

    def set_reset_pin(self, on: bool = True):
        if on:
            self.set_high(OutputPins.reset)
        else:
            self.set_low(OutputPins.reset)

    def set_isp_pin(self, on: bool = True):
        if on:
            self.set_high(OutputPins.isp)
        else:
            self.set_low(OutputPins.isp)

    def set_halt_pin(self, on: bool = True):
        if on:
            self.set_high(OutputPins.halt)
        else:
            self.set_low(OutputPins.halt)

    def _read(self, input_pin: GPIOPins):
        try:
            name = str(input_pin)
            return self.lines[name].get_value()
        except KeyError:
            raise RuntimeError(
                f"GPIO {name} is not registered and cannot"
                "be read")

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
        """ Read revision bit GPIO pins

        If the gpio_rev_bit_pins device tree overlay is enabled,
        returns the pins' values. Otherwise, return RevisionPinsError
        """
        if pathlib.Path(DTOVERLAY_PATH).exists():
            return (bool(self._read(RevPins.rev_0)),
                    bool(self._read(RevPins.rev_1)))
        else:
            raise RevisionPinsError

    def get_door_switches_line(self) -> gpiod.Line:
        return self.lines[InputPins.window_door_sw.name]
    # def release_line(self, gpio_pins: GPIOPins):
    #     name = str(gpio_pins)
    #     self.lines[name].release()
    #     self.lines.pop(name)
