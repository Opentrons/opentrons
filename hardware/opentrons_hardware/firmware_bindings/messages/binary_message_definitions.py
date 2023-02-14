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

    message_id: BinaryMessageId = BinaryMessageId.echo
    length: utils.UInt16Field = utils.UInt16Field(0)
    message: utils.BinaryFieldBase[bytes] = utils.BinaryFieldBase(bytes())


@dataclass
class Ack(utils.BinarySerializable):
    """Sent as a reply from the device to signal message received."""

    message_id: BinaryMessageId = BinaryMessageId.ack
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class AckFailed(utils.BinarySerializable):
    """Sent as a reply from the device to signal message could not be interpreted."""

    message_id: BinaryMessageId = BinaryMessageId.ack_failed
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class DeviceInfoRequest(utils.BinarySerializable):
    """Request the version information from the device."""

    message_id: BinaryMessageId = BinaryMessageId.device_info_request
    length: utils.UInt16Field = utils.UInt16Field(0)


@dataclass
class DeviceInfoResponse(utils.BinarySerializable):
    """Version information sent from the device."""

    message_id: BinaryMessageId = BinaryMessageId.device_info_response
    length: utils.UInt16Field = utils.UInt16Field(0)
    version: utils.UInt32Field = utils.UInt32Field(0)
    flags: VersionFlagsField = VersionFlagsField(0)
    shortsha: FirmwareShortSHADataField = FirmwareShortSHADataField(bytes())
    revision: OptionalRevisionField = OptionalRevisionField("", "", "")


BinaryMessageDefinition = Union[
    Echo,
    Ack,
    AckFailed,
    DeviceInfoRequest,
    DeviceInfoResponse,
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
        if i.message_id == message_id:
            # get args returns Tuple[Any...]
            return i  # type: ignore[no-any-return]
    log.error("No binary message definition found.")
    return None
