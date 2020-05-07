import asyncio
import logging
import pathlib
import time
from typing import Dict, Tuple
from opentrons.hardware_control.types import (
    BoardRevision, HardwareAPILike, DoorState)
from . import RevisionPinsError
from .types import gpio_list, PinDir, GPIOPin, GpioQueueEvents

import gpiod  # type: ignore

"""
Raspberry Pi GPIO control module
"""

MODULE_LOG = logging.getLogger(__name__)

DTOVERLAY_PATH = '/proc/device-tree/soc/gpio@7e200000/gpio_rev_bit_pins'


def _event_callback(q: asyncio.Queue):
    try:
        q.put_nowait(GpioQueueEvents.EVENT_RECEIVED)
    except asyncio.QueueFull:
        MODULE_LOG.warning(
            'Event queue is full and can no longer receive new events')


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
        rev_pins = gpio_list.by_names(['rev_0', 'rev_1'])
        for rev in rev_pins:
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
        output_pins = gpio_list.by_type(PinDir.output)
        for output in output_pins:
            self._lines[output.name] = self._request_line(
                output, gpiod.LINE_REQ_DIR_OUT)

        # setup input lines
        input_pins = gpio_list.by_type(PinDir.input)
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
            gpio_list.red_button: red,
            gpio_list.green_button: green,
            gpio_list.blue_button: blue}
        for pin, state in color_pins.items():
            if state:
                self.set_high(pin)
            else:
                self.set_low(pin)

    def set_rail_lights(self, on: bool = True):
        if on:
            self.set_high(gpio_list.frame_leds)
        else:
            self.set_low(gpio_list.frame_leds)

    def set_reset_pin(self, on: bool = True):
        if on:
            self.set_high(gpio_list.reset)
        else:
            self.set_low(gpio_list.reset)

    def set_isp_pin(self, on: bool = True):
        if on:
            self.set_high(gpio_list.isp)
        else:
            self.set_low(gpio_list.isp)

    def set_halt_pin(self, on: bool = True):
        if on:
            self.set_high(gpio_list.halt)
        else:
            self.set_low(gpio_list.halt)

    def _read(self, input_pin: GPIOPin):
        try:
            return self.lines[input_pin.name].get_value()
        except KeyError:
            raise RuntimeError(
                f"GPIO {input_pin.name} is not registered and cannot"
                "be read")

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
        """ Read revision bit GPIO pins

        If the gpio_rev_bit_pins device tree overlay is enabled,
        returns the pins' values. Otherwise, return RevisionPinsError
        """
        if pathlib.Path(DTOVERLAY_PATH).exists():
            return (bool(self._read(gpio_list.rev_0)),
                    bool(self._read(gpio_list.rev_1)))
        else:
            raise RevisionPinsError

    def get_door_switches_fd(self) -> int:
        name = gpio_list.window_door_sw.name
        return self.lines[name].event_get_fd()

    def get_door_state(self) -> DoorState:
        name = gpio_list.window_door_sw.name
        event = self.lines[name].event_read()
        if event.type == gpiod.LineEvent.FALLING_EDGE:
            return DoorState.OPEN
        else:
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
        door_fd = self.get_door_switches_fd()
        loop.add_reader(door_fd, _event_callback, event_queue)
        while True:
            await self._watch_door_switch_event(
                event_queue, api)

    def release_line(self, pin: GPIOPin):
        self.lines[pin.name].release()
        self.lines.pop(pin.name)
