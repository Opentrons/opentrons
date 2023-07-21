"""Definition of Binary messages."""
from dataclasses import dataclass
from functools import lru_cache
from typing import Type, Union, Optional
from typing_extensions import get_args

from ..binary_constants import BinaryMessageId, LightTransitionType, LightAnimationType
from .. import utils
import logging
from .fields import (
    FirmwareShortSHADataField,
    VersionFlagsField,
    OptionalRevisionField,
    LightTransitionTypeField,
    LightAnimationTypeField,
    EepromDataField,
)

log = logging.getLogger(__name__)


@dataclass
class Echo(utils.BinarySerializable):
    """Send a message to the device and have it echoed back."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.echo)
    length: utils.UInt16Field = utils.UInt16Field(0)
    message: utils.BinaryFieldBase[bytes] = utils.BinaryFieldBase(bytes())


@dataclass
class Ack(utils.BinarySerializable):
    """Sent as a reply from the device to signal message received."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.ack)
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class AckFailed(utils.BinarySerializable):
    """Sent as a reply from the device to signal message could not be interpreted."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.ack_failed)
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class DeviceInfoRequest(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.device_info_request
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class DeviceInfoResponse(utils.BinarySerializable):
    """Version information sent from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.device_info_response
    )
    length: utils.UInt16Field = utils.UInt16Field(0)
    version: utils.UInt32Field = utils.UInt32Field(0)
    flags: VersionFlagsField = VersionFlagsField(0)
    shortsha: FirmwareShortSHADataField = FirmwareShortSHADataField(bytes())
    revision: OptionalRevisionField = OptionalRevisionField("", "", "")
    subidentifier: utils.UInt8Field = utils.UInt8Field(0)

    @classmethod
    def build(cls, data: bytes) -> "DeviceInfoResponse":
        """Build a response payload from incoming bytes.

        This override is required to handle optionally-present revision data.
        """
        if len(data) < DeviceInfoResponse.get_size():
            data = data + b"\x00\x00\x00\x00"
        data_iter = 0
        message_id = utils.UInt16Field.build(
            int.from_bytes(data[data_iter : data_iter + 2], "big")
        )
        data_iter = data_iter + 2

        length = utils.UInt16Field.build(
            int.from_bytes(data[data_iter : data_iter + 2], "big")
        )
        data_iter = data_iter + 2

        version = utils.UInt32Field.build(
            int.from_bytes(data[data_iter : data_iter + 4], "big")
        )
        data_iter = data_iter + 4

        flags = VersionFlagsField.build(
            int.from_bytes(data[data_iter : data_iter + 4], "big")
        )
        data_iter = data_iter + 4

        shortsha = FirmwareShortSHADataField.build(
            data[data_iter : data_iter + FirmwareShortSHADataField.NUM_BYTES]
        )
        data_iter = data_iter + FirmwareShortSHADataField.NUM_BYTES

        revision = OptionalRevisionField.build(data[data_iter:])

        data_iter = data_iter + revision.NUM_BYTES
        try:
            subidentifier = utils.UInt8Field.build(
                int.from_bytes(data[data_iter : data_iter + 1], "big")
            )
        except IndexError:
            subidentifier = utils.UInt8Field.build(0)

        return DeviceInfoResponse(
            message_id, length, version, flags, shortsha, revision, subidentifier
        )


@dataclass
class EnterBootloaderRequest(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.enter_bootloader_request
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class EnterBootloaderResponse(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.enter_bootloader_response
    )
    length: utils.UInt16Field = utils.UInt16Field(1)
    success: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class EngageEstop(utils.BinarySerializable):
    """Send a request to enable the estop line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.engage_estop)
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class ReleaseEstop(utils.BinarySerializable):
    """Send a request to disable the estop line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.release_estop)
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class EngageSyncOut(utils.BinarySerializable):
    """Send a request to enable the sync line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.engage_nsync_out)
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class ReleaseSyncOut(utils.BinarySerializable):
    """Send a request to disable the sync line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.release_nsync_out)
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class EstopStateChange(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.estop_state_change
    )
    length: utils.UInt16Field = utils.UInt16Field(1)
    engaged: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class EstopButtonDetectionChange(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.estop_button_detection_change
    )
    length: utils.UInt16Field = utils.UInt16Field(2)
    aux1_detected: utils.UInt8Field = utils.UInt8Field(0)
    aux2_detected: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class EstopButtonPresentRequest(utils.BinarySerializable):
    """Sent from the host to request any what aux ports are connected."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.estop_button_present_request
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class EstopStateRequest(utils.BinarySerializable):
    """Sent from the host to request the estop state."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.estop_state_request
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class AuxPresentDetectionChange(utils.BinarySerializable):
    """Sent from the rear panel when a aux device is connected or disconnected."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.aux_present_detection_change
    )
    length: utils.UInt16Field = utils.UInt16Field(2)
    aux1_detected: utils.UInt8Field = utils.UInt8Field(0)
    aux2_detected: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class AuxPresentRequest(utils.BinarySerializable):
    """Sent from the host to request any what aux ports are connected."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.aux_present_request
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class AuxIDResponse(utils.BinarySerializable):
    """Sent from the rear panel when requested, only used for board testing."""

    # each value should return false if they are in their default state
    # or true if they are pulled in the opposite way

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.aux_id_response)
    length: utils.UInt16Field = utils.UInt16Field(2)
    aux1_id_state: utils.UInt8Field = utils.UInt8Field(0)
    aux2_id_state: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class AuxIDRequest(utils.BinarySerializable):
    """Sent from the host during testing to request aux_id pin state."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.aux_id_request)
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class DoorSwitchStateRequest(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.door_switch_state_request
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class DoorSwitchStateInfo(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.door_switch_state_info
    )
    length: utils.UInt16Field = utils.UInt16Field(1)
    door_open: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class WriteEEPromRequest(utils.BinarySerializable):
    """Write to the EEPROM."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.write_eeprom_request
    )
    length: utils.UInt16Field = utils.UInt16Field(12)
    data_address: utils.UInt16Field = utils.UInt16Field(0)
    data_length: utils.UInt16Field = utils.UInt16Field(0)
    data: EepromDataField = EepromDataField(bytes())


@dataclass
class ReadEEPromRequest(utils.BinarySerializable):
    """Read from the EEPROM."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.read_eeprom_request
    )
    length: utils.UInt16Field = utils.UInt16Field(4)
    data_address: utils.UInt16Field = utils.UInt16Field(0)
    data_length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class ReadEEPromResponse(utils.BinarySerializable):
    """Read from the EEPROM response."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.read_eeprom_response
    )
    length: utils.UInt16Field = utils.UInt16Field(12)
    data_address: utils.UInt16Field = utils.UInt16Field(0)
    data_length: utils.UInt16Field = utils.UInt16Field(0)
    data: EepromDataField = EepromDataField(bytes())


@dataclass
class AddLightActionRequest(utils.BinarySerializable):
    """Add an action to the staging light queue.

    The RGBW values are uint8_t fields and should be specified in the
    range [0,255], where 0 is fully off and 255 is fully on.
    """

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.add_light_action)
    length: utils.UInt16Field = utils.UInt16Field(7)
    transition_time: utils.UInt16Field = utils.UInt16Field(0)
    transition_type: LightTransitionTypeField = LightTransitionTypeField(
        LightTransitionType.linear
    )
    red: utils.UInt8Field = utils.UInt8Field(0)
    green: utils.UInt8Field = utils.UInt8Field(0)
    blue: utils.UInt8Field = utils.UInt8Field(0)
    white: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class ClearLightActionStagingQueue(utils.BinarySerializable):
    """Clear the staging queue for light actions."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.clear_light_action_staging_queue
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class StartLightAction(utils.BinarySerializable):
    """Begin the action that is in the staging queue."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.start_light_action
    )
    length: utils.UInt16Field = utils.UInt16Field(1)
    type: LightAnimationTypeField = LightAnimationTypeField(
        LightAnimationType.single_shot
    )


@dataclass
class SetDeckLightRequest(utils.BinarySerializable):
    """Set the deck light on or off."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.set_deck_light_request
    )
    length: utils.UInt16Field = utils.UInt16Field(1)
    # Set to 0 for off, 1 for on
    setting: utils.UInt8Field = utils.UInt8Field(0)


@dataclass
class GetDeckLightRequest(utils.BinarySerializable):
    """Get the deck light status."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.get_deck_light_request
    )
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class GetDeckLightResponse(utils.BinarySerializable):
    """Contains deck light status."""

    message_id: utils.UInt16Field = utils.UInt16Field(
        BinaryMessageId.get_deck_light_response
    )
    length: utils.UInt16Field = utils.UInt16Field(1)
    setting: utils.UInt8Field = utils.UInt8Field(0)


BinaryMessageDefinition = Union[
    Echo,
    Ack,
    AckFailed,
    DeviceInfoRequest,
    DeviceInfoResponse,
    EnterBootloaderRequest,
    EnterBootloaderResponse,
    EngageEstop,
    ReleaseEstop,
    EngageSyncOut,
    ReleaseSyncOut,
    EstopStateChange,
    EstopStateRequest,
    EstopButtonDetectionChange,
    EstopButtonPresentRequest,
    DoorSwitchStateRequest,
    DoorSwitchStateInfo,
    AuxPresentDetectionChange,
    AuxPresentRequest,
    AuxIDRequest,
    AuxIDResponse,
    WriteEEPromRequest,
    ReadEEPromRequest,
    ReadEEPromResponse,
    AddLightActionRequest,
    ClearLightActionStagingQueue,
    StartLightAction,
    SetDeckLightRequest,
    GetDeckLightRequest,
    GetDeckLightResponse,
]


@lru_cache(maxsize=None)
def get_binary_definition(
    message_id: BinaryMessageId,
) -> Optional[Type[BinaryMessageDefinition]]:
    """Get the message type for a message type.

    Args:
        message_id: A message id

    Returns: The message definition for a type

    """
    # Dumb linear search, but the result is memoized.
    for i in get_args(BinaryMessageDefinition):
        if i.message_id.value == message_id:
            # get args returns Tuple[Any...]
            return i  # type: ignore[no-any-return]
    log.error("No binary message definition found.")
    return None
