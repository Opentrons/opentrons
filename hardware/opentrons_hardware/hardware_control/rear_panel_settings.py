"""Utilities for updating the rear-panel settings."""

import logging
from dataclasses import dataclass
from typing import Optional, cast

from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings import utils
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    Ack,
    AddLightActionRequest,
    AuxIDRequest,
    AuxIDResponse,
    AuxPresentDetectionChange,
    AuxPresentRequest,
    BinaryMessageDefinition,
    DoorSwitchStateInfo,
    DoorSwitchStateRequest,
    EngageSyncOut,
    EstopButtonDetectionChange,
    EstopButtonPresentRequest,
    EstopStateChange,
    EstopStateRequest,
    GetDeckLightRequest,
    GetDeckLightResponse,
    ReadEEPromRequest,
    ReadEEPromResponse,
    ReleaseSyncOut,
    SetDeckLightRequest,
    StartLightAction,
    SyncStateRequest,
    SyncStateResponse,
    WriteEEPromRequest,
)
from opentrons_hardware.firmware_bindings.messages.fields import EepromDataField

log = logging.getLogger(__name__)


@dataclass
class RearPinState:
    """Used during testing to query all of the pin states of the rear panel."""

    aux1_estop_det: bool = False
    aux2_estop_det: bool = False
    aux1_aux_det: bool = False
    aux2_aux_det: bool = False
    aux1_id_active: bool = False
    aux2_id_active: bool = False
    estop_active: bool = False
    door_open: bool = False
    sync_engaged: bool = False


async def write_eeprom(
    messenger: BinaryMessenger, data_addr: int, data_len: int, data: bytes
) -> bool:
    """Writes up to 8 bytes from the eeprom."""
    if data_addr < 0 or data_addr > 0x4000 or data_len < 0 or data_len > 8:
        return False
    response = await messenger.send_and_receive(
        message=WriteEEPromRequest(
            data_address=utils.UInt16Field(data_addr),
            data_length=utils.UInt16Field(data_len),
            data=EepromDataField(data),
        ),
        response_type=Ack,
    )
    return response is not None


async def read_eeprom(
    messenger: BinaryMessenger, data_addr: int, data_len: int
) -> bytes:
    """Reads up to 8 bytes from the eeprom."""
    if data_addr < 0 or data_addr > 0x4000 or data_len < 0 or data_len > 8:
        return b""
    response = await messenger.send_and_receive(
        message=ReadEEPromRequest(
            data_address=utils.UInt16Field(data_addr),
            data_length=utils.UInt16Field(data_len),
        ),
        response_type=ReadEEPromResponse,
    )
    if response is None:
        return b""
    return bytes(cast(ReadEEPromResponse, response).data.value)


async def get_door_state(messenger: BinaryMessenger) -> bool:
    """Returns true if the door is currently open."""
    response = await messenger.send_and_receive(
        message=DoorSwitchStateRequest(),
        response_type=DoorSwitchStateInfo,
    )
    if response is None:
        return False
    return bool(cast(DoorSwitchStateInfo, response).door_open.value)


async def set_deck_light(setting: int, messenger: BinaryMessenger) -> bool:
    """Turn the deck light on or off."""
    response = await messenger.send_and_receive(
        message=SetDeckLightRequest(setting=utils.UInt8Field(setting)),
        response_type=Ack,
    )
    return response is not None


async def get_deck_light_state(messenger: BinaryMessenger) -> bool:
    """Returns true if the light is currently on."""
    response = await messenger.send_and_receive(
        message=GetDeckLightRequest(),
        response_type=GetDeckLightResponse,
    )
    if response is None:
        return False
    return bool(cast(GetDeckLightResponse, response).setting.value)


async def set_sync_pin(setting: int, messenger: BinaryMessenger) -> bool:
    """Turn the sync pin on or off."""
    message: BinaryMessageDefinition = ReleaseSyncOut()
    if setting:
        message = EngageSyncOut()

    response = await messenger.send_and_receive(
        message=message,
        response_type=Ack,
    )
    return response is not None


def _clamp_rgb(val: int) -> int:
    if val < 0:
        val = 0
    if val > 255:
        val = 255
    return val


async def set_ui_color(
    red: int, blue: int, green: int, white: int, messenger: BinaryMessenger
) -> bool:
    """Command the UI light to set to a particular RGBW value."""
    response = await messenger.send_and_receive(
        message=AddLightActionRequest(
            red=utils.UInt8Field(_clamp_rgb(red)),
            blue=utils.UInt8Field(_clamp_rgb(blue)),
            green=utils.UInt8Field(_clamp_rgb(green)),
            white=utils.UInt8Field(_clamp_rgb(white)),
        ),
        response_type=Ack,
    )
    if response is None:
        return False
    response = await messenger.send_and_receive(
        message=StartLightAction(),
        response_type=Ack,
    )
    return response is not None


async def get_all_pin_state(messenger: BinaryMessenger) -> RearPinState:
    """Returns the state of all IO GPIO pins on the rear panel."""
    current_state = RearPinState()

    # estop port detection pins
    response = await messenger.send_and_receive(
        message=EstopButtonPresentRequest(),
        response_type=EstopButtonDetectionChange,
    )
    if response is not None:
        current_state.aux1_estop_det = bool(
            cast(EstopButtonDetectionChange, response).aux1_detected.value
        )
        current_state.aux2_estop_det = bool(
            cast(EstopButtonDetectionChange, response).aux2_detected.value
        )

    # Aux port detection pins
    response = await messenger.send_and_receive(
        message=AuxPresentRequest(),
        response_type=AuxPresentDetectionChange,
    )
    if response is not None:
        current_state.aux1_aux_det = bool(
            cast(AuxPresentDetectionChange, response).aux1_detected.value
        )
        current_state.aux2_aux_det = bool(
            cast(AuxPresentDetectionChange, response).aux2_detected.value
        )
    # Aux id pins
    response = await messenger.send_and_receive(
        message=AuxIDRequest(),
        response_type=AuxIDResponse,
    )
    if response is not None:
        current_state.aux1_id_active = bool(
            cast(AuxIDResponse, response).aux1_id_state.value
        )
        current_state.aux2_id_active = bool(
            cast(AuxIDResponse, response).aux2_id_state.value
        )
    # estop active pin
    response = await messenger.send_and_receive(
        message=EstopStateRequest(),
        response_type=EstopStateChange,
    )
    if response is not None:
        current_state.estop_active = bool(
            cast(EstopStateChange, response).engaged.value
        )

    # sync out pin
    response = await messenger.send_and_receive(
        message=SyncStateRequest(),
        response_type=SyncStateResponse,
    )
    if response is not None:
        current_state.sync_engaged = bool(
            cast(SyncStateResponse, response).engaged.value
        )
    # door state
    current_state.door_open = bool(await get_door_state(messenger))
    return current_state
