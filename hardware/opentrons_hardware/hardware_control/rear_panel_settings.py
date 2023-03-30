"""Utilities for updating the rear-panel settings."""
import logging
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    DoorSwitchStateRequest,
    DoorSwitchStateInfo,
    SetDeckLightRequest,
    GetDeckLightRequest,
    GetDeckLightResponse,
    Ack,
)
from opentrons_hardware.firmware_bindings import utils
from typing import cast, Optional

log = logging.getLogger(__name__)


async def get_door_state(messenger: Optional[BinaryMessenger]) -> bool:
    """Returns true if the door is currently open."""
    if messenger is None:
        # the EVT bots don't have switches so just return that the door is closed
        return False
    response = await messenger.send_and_receive(
        message=DoorSwitchStateRequest(),
        response_type=DoorSwitchStateInfo,
    )
    if response is None:
        return False
    return bool(cast(DoorSwitchStateInfo, response).door_open.value)


async def set_deck_light(setting: int, messenger: Optional[BinaryMessenger]) -> bool:
    """Turn the deck light on or off."""
    if messenger is None:
        # the EVT bots don't have rear panels...
        return False
    response = await messenger.send_and_receive(
        message=SetDeckLightRequest(setting=utils.UInt8Field(setting)),
        response_type=Ack,
    )
    return response is not None


async def get_deck_light_state(messenger: Optional[BinaryMessenger]) -> bool:
    """Returns true if the light is currently on."""
    if messenger is None:
        # the EVT bots don't have switches so just return that the door is closed
        return False
    response = await messenger.send_and_receive(
        message=GetDeckLightRequest(),
        response_type=GetDeckLightResponse,
    )
    if response is None:
        return False
    return bool(cast(GetDeckLightResponse, response).setting.value)
