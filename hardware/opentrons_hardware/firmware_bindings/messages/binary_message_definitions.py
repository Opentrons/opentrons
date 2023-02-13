"""Definition of Binary messages."""
from dataclasses import dataclass
from typing import Type, Any
from typing_extensions import Literal

from ..binary_constants import BinaryMessageId
from .. import utils
from logging import Logger
from .fields import (
    FirmwareShortSHADataField,
    VersionFlagsField,
)


@dataclass
class EmptyBinMessage(utils.BinarySerializable):
    """An empty payload."""

    length: utils.UInt16Field


@dataclass
class Echo(utils.BinarySerializable):
    message_id: BinaryMessageId = BinaryMessageId.echo
    length: utils.UInt16Field
    message: utils.BinaryFieldBase[bytes]


@dataclass
class Ack(utils.BinarySerializable):
    message_id: BinaryMessageId = BinaryMessageId.ack
    length: utils.UInt16Field


@dataclass
class AckFailed(utils.BinarySerializable):
    message_id: BinaryMessageId = BinaryMessageId.ack
    length: utils.UInt16Field


@dataclass
class DeviceInfoRequest(utils.BinarySerializable):
    message_id: BinaryMessageId = BinaryMessageId.device_info_request
    length: utils.UInt16Field


@dataclass
class DeviceInfoResponse(utils.BinarySerializable):
    message_id: BinaryMessageId = BinaryMessageId.device_info_response
    length: utils.UInt16Field
    version: utils.UInt32Field
    flags: VersionFlagsField
    shortsha: FirmwareShortSHADataField


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
    """Get the message type for a message id.

    Args:
        message_id: A message id

    Returns: The message definition for a type

    """
    # Dumb linear search, but the result is memoized.
    for i in get_args(BinaryMessageDefinition):
        if i.message_id == message_id:
            # get args returns Tuple[Any...]
            return i  # type: ignore[no-any-return]

    return None
