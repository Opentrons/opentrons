"""Utilities for updating the rear-panel settings."""
import logging
import asyncio
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    DoorSwitchStateRequest,
    DoorSwitchStateInfo,
    SetDeckLightRequest,
    GetDeckLightRequest,
    GetDeckLightResponse,
)
from opentrons_hardware.firmware_bindings import utils
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId
from typing import Callable, cast, List, Optional

log = logging.getLogger(__name__)


def _create_listener(
    event: asyncio.Event, responses: List[BinaryMessageDefinition]
) -> Callable[[BinaryMessageDefinition], None]:
    def _listener(message: BinaryMessageDefinition) -> None:
        responses.append(message)
        event.set()

    return _listener


async def get_door_state(messenger: Optional[BinaryMessenger]) -> bool:
    """Returns true if the door is currently open."""
    if messenger is None:
        # the EVT bots don't have switches so just return that the door is closed
        return False
    event = asyncio.Event()
    responses: List[BinaryMessageDefinition] = list()
    listener = _create_listener(event, responses)
    messenger.add_listener(
        listener,
        lambda message_id: bool(message_id == BinaryMessageId.door_switch_state_info),
    )
    await messenger.send(DoorSwitchStateRequest())
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.error("door switch request timed out before response")
    finally:
        messenger.remove_listener(listener)
    if len(responses) > 0:
        return bool(cast(DoorSwitchStateInfo, responses[0]).door_open.value)
    # in case of timeout (no messages received) just return closed
    return False


async def set_deck_light(setting: int, messenger: Optional[BinaryMessenger]) -> bool:
    """Turn the deck light on or off."""
    if messenger is None:
        # the EVT bots don't have rear panels...
        return False

    event = asyncio.Event()
    responses: List[BinaryMessageDefinition] = list()
    listener = _create_listener(event, responses)
    messenger.add_listener(
        listener,
        lambda message_id: bool(message_id == BinaryMessageId.ack),
    )

    await messenger.send(SetDeckLightRequest(setting=utils.UInt8Field(setting)))
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.error("set deck light request timed out before response")
    finally:
        messenger.remove_listener(listener)
    return len(responses) > 0


async def get_deck_light_state(messenger: Optional[BinaryMessenger]) -> bool:
    """Returns true if the light is currently on."""
    if messenger is None:
        # the EVT bots don't have rear panels...
        return False
    event = asyncio.Event()
    responses: List[BinaryMessageDefinition] = list()
    listener = _create_listener(event, responses)
    messenger.add_listener(
        listener,
        lambda message_id: bool(message_id == BinaryMessageId.get_deck_light_response),
    )
    await messenger.send(GetDeckLightRequest())
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.error("get deck light request timed out before response")
    finally:
        messenger.remove_listener(listener)
    if len(responses) > 0:
        return bool(cast(GetDeckLightResponse, responses[0]).setting.value > 0)
    # in case of timeout (no messages received) just return off
    return False
