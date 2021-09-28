"""Payloads of can bus messages."""
from dataclasses import dataclass

from opentrons_hardware import utils


@dataclass
class EmptyMessage(utils.BinarySerializable):
    """An empty payload."""

    pass


@dataclass
class DeviceInfoResponseBody(utils.BinarySerializable):
    """Device info response."""

    node_id: utils.UInt8Field
    version: utils.UInt32Field


@dataclass
class GetStatusResponse(utils.BinarySerializable):
    """Get status response."""

    status: utils.UInt8Field
    data: utils.UInt32Field


@dataclass
class GetSpeedResponse(utils.BinarySerializable):
    """Get speed response."""

    mm_sec: utils.UInt32Field


@dataclass
class WriteToEEPromRequest(utils.BinarySerializable):
    """Write to eeprom request."""

    serial_number: utils.UInt8Field


@dataclass
class ReadFromEEPromResponse(utils.BinarySerializable):
    """Read from ee prom response."""

    serial_number: utils.UInt8Field
