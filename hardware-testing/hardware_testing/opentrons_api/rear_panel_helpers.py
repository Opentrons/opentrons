"""Helper functions to interface with the rear panel MCU."""
import asyncio
import dataclasses
import logging
import argparse
from enum import Enum
from logging.config import dictConfig
from typing import Type, Sequence, Callable, TypeVar, Optional

from opentrons_hardware.hardware_control.rear_panel_settings import (
    get_door_state,
    set_deck_light,
    set_deck_light
)
from opentrons_hardware.drivers.binary_usb import build
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.drivers.binary_usb.bin_serial import SerialUsbDriver
from opentrons_hardware.drivers.binary_usb.build import (
    build_rear_panel_messenger,
    build_rear_panel_driver
)
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId
from opentrons_hardware.firmware_bindings.messages import (
    get_binary_definition,
    BinaryMessageDefinition,
)
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    DoorSwitchStateRequest,
    DoorSwitchStateInfo,
    SetDeckLightRequest,
    GetDeckLightRequest,
    GetDeckLightResponse,
    Ack,
)
