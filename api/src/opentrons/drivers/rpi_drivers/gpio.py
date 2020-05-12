import asyncio
import logging
import pathlib
import time
from typing import Callable, Dict, Tuple
from opentrons.hardware_control.types import BoardRevision, DoorState
from . import RevisionPinsError
from .types import gpio_group, PinDir, GPIOPin

import gpiod  # type: ignore

"""
Raspberry Pi GPIO control module
"""

MODULE_LOG = logging.getLogger(__name__)

DTOVERLAY_PATH = '/proc/device-tree/soc/gpio@7e200000/gpio_rev_bit_pins'


def _event_callback(
            update_door_state: Callable[[DoorState], None],
            get_door_state: Callable[..., DoorState]):
    try:
        update_door_state(get_door_state())
    except Exception:
        MODULE_LOG.exception("Errored during event callback")


class GPIOCharDev:
    def __init__(self, chip_name: str):
        self._board_rev = BoardRevision.UNKNOWN
        self._chip = gpiod.Chip(chip_name)
        self._lines = self._initialize()

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
            pin: GPIOPin, request_type) -> gpiod.Line:
        name = pin.name
        offset = pin.by_board_rev(self.board_rev)

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

        if name == 'blue_button':
            return _retry_request_line(3)
        else:
            return _retry_request_line()

    def _initialize(self) -> Dict[str, gpiod.Line]:
        MODULE_LOG.info(
            "Registering Central Routing Board Revision GPIOs")
        lines = {}
        rev_pins = gpio_group.by_names(['rev_0', 'rev_1'])
        for rev in rev_pins.pins:
            lines[rev.name] = self._request_line(rev, gpiod.LINE_REQ_DIR_IN)
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
        output_pins = gpio_group.by_type(PinDir.output)
        for output in output_pins.pins:
            self._lines[output.name] = self._request_line(
                output, gpiod.LINE_REQ_DIR_OUT)

        # setup input lines
        input_pins = gpio_group.by_type(PinDir.input)
        sorted_inputs = input_pins.group_by_pins(self.board_rev)
        for pins in sorted_inputs:
            line = self._request_line(
                pins[0], gpiod.LINE_REQ_EV_BOTH_EDGES)
            for pin in pins:
                self._lines[pin.name] = line

    async def setup(self):
        MODULE_LOG.info("Setting up GPIOs")
        # smoothieware programming pins, must be in a known state (HIGH)
        self.set_halt_pin(True)
        self.set_isp_pin(True)
        self.set_reset_pin(False)
        await asyncio.sleep(0.25)
        self.set_reset_pin(True)
        await asyncio.sleep(0.25)

    def set_high(self, output_pin: GPIOPin):
        self.lines[output_pin.name].set_value(1)

    def set_low(self, output_pin: GPIOPin):
        self.lines[output_pin.name].set_value(0)

    def set_button_light(self,
                         red: bool = False,
                         green: bool = False,
                         blue: bool = False):
        color_pins = {
            gpio_group.red_button: red,
            gpio_group.green_button: green,
            gpio_group.blue_button: blue}
        for pin, state in color_pins.items():
            if state:
                self.set_high(pin)
            else:
                self.set_low(pin)

    def set_rail_lights(self, on: bool = True):
        if on:
            self.set_high(gpio_group.frame_leds)
        else:
            self.set_low(gpio_group.frame_leds)

    def set_reset_pin(self, on: bool = True):
        if on:
            self.set_high(gpio_group.reset)
        else:
            self.set_low(gpio_group.reset)

    def set_isp_pin(self, on: bool = True):
        if on:
            self.set_high(gpio_group.isp)
        else:
            self.set_low(gpio_group.isp)

    def set_halt_pin(self, on: bool = True):
        if on:
            self.set_high(gpio_group.halt)
        else:
            self.set_low(gpio_group.halt)

    def _read(self, input_pin: GPIOPin):
        try:
            return self.lines[input_pin.name].get_value()
        except KeyError:
            raise RuntimeError(
                f"GPIO {input_pin.name} is not registered and cannot"
                "be read")

    def get_button_light(self) -> Tuple[bool, bool, bool]:
        return (bool(self._read(gpio_group.red_button)),
                bool(self._read(gpio_group.green_button)),
                bool(self._read(gpio_group.blue_button)))

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
        """ Read revision bit GPIO pins

        If the gpio_rev_bit_pins device tree overlay is enabled,
        returns the pins' values. Otherwise, return RevisionPinsError
        """
        if pathlib.Path(DTOVERLAY_PATH).exists():
            return (bool(self._read(gpio_group.rev_0)),
                    bool(self._read(gpio_group.rev_1)))
        else:
            raise RevisionPinsError

    def get_door_state(self) -> DoorState:
        name = gpio_group.window_door_sw.name
        event = self.lines[name].event_read()
        if event.type == gpiod.LineEvent.FALLING_EDGE:
            return DoorState.OPEN
        else:
            return DoorState.CLOSED

    def start_door_switch_watcher(
            self, loop: asyncio.AbstractEventLoop,
            update_door_state: Callable[[DoorState], None]):
        current_door_value = self.read_window_switches()
        if current_door_value == 0:
            update_door_state(DoorState.OPEN)
        else:
            update_door_state(DoorState.CLOSED)

        try:
            door_fd = self.lines['window_door_sw'].event_get_fd()
            loop.add_reader(door_fd, _event_callback,
                            update_door_state, self.get_door_state)
        except Exception:
            MODULE_LOG.exception(
                "Failed to add fd reader, cannot not monitor window door "
                "switch properly")

    def release_line(self, pin: GPIOPin):
        self.lines[pin.name].release()
        self.lines.pop(pin.name)

    def stop_door_switch_watcher(self, loop: asyncio.AbstractEventLoop):
        try:
            door_fd = self.lines['window_door_sw'].event_get_fd()
            loop.remove_reader(door_fd)
        except Exception:
            MODULE_LOG.exception(
                "Failed to remove window door switch fd reader")
