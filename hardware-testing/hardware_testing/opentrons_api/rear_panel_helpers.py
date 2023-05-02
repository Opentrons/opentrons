"""Helper functions to interface with the rear panel MCU."""
import asyncio
import dataclasses
import logging
import argparse
from enum import Enum
from logging.config import dictConfig
from typing import Type, Sequence, Callable, TypeVar, Optional

from opentrons_hardware.drivers.binary_usb import build
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.hardware_control.rear_panel_settings import (
    get_door_state,
    set_deck_light,
    set_deck_light
)
from opentrons_hardware.drivers.binary_usb.bin_serial import SerialUsbDriver
from opentrons_hardware.drivers.binary_usb.build import (
    build_rear_panel_messenger,
    build_rear_panel_driver
)
from opentrons_hardware.firmware_bindings.messages import (
    get_binary_definition,
    BinaryMessageDefinition,
)

# async def get_rp_driver():
#     d = await build_rear_panel_driver()
#     return build_rear_panel_messenger(d)
#
#
# async def door_test(drive):
#     return await get_door_state(drive)

class RearPanelController:
    _usb_messenger: Optional[BinaryMessenger]

    @classmethod
    async def build():
        usb_driver = await build_rear_panel_driver()

    def __init__(self):
        self._usb_messenger = self._build_system_hardware(usb_driver)

    @staticmethod
    def _build_system_hardware(usb_driver: Optional[SerialUsbDriver]):
        usb_messenger = BinaryMessenger(usb_driver)
        usb_messenger.start()
        return usb_messenger

    async def door_state(self):
        door_open = await get_door_state(self._usb_messenger)
        return door_open
