"""Definition of Binary messages."""
from dataclasses import dataclass
from functools import lru_cache
from typing import Type, Union, Optional
from typing_extensions import get_args

from ..binary_constants import BinaryMessageId
from .. import utils
import logging
from .fields import (
    FirmwareShortSHADataField,
    VersionFlagsField,
    OptionalRevisionField,
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

        return DeviceInfoResponse(
            message_id, length, version, flags, shortsha, revision
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
    success: utils.UInt8Field = utils.UInt8Field(0)
    length: utils.UInt16Field = utils.UInt16Field(1)


@dataclass
class EngageEstop(utils.BinarySerializable):
    """Send a request to enable the estop line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.engage_estop)
    lenght: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class ReleaseEstop(utils.BinarySerializable):
    """Send a request to disable the estop line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.release_estop)
    lenght: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class EngageSyncOut(utils.BinarySerializable):
    """Send a request to enable the sync line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.engage_nsync_out)
    lenght: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class ReleaseSyncOut(utils.BinarySerializable):
    """Send a request to disable the sync line."""

    message_id: utils.UInt16Field = utils.UInt16Field(BinaryMessageId.release_nsync_out)
    lenght: utils.UInt16Field = utils.UInt16Field(0)


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
