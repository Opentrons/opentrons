"""Constants for binary format to rear-panel.

This file is used as a source for code generation, which does not run in a venv
by default. Please do not unconditionally import things outside the python standard
library.
"""
from dataclasses import dataclass
from enum import Enum, unique


@unique
class PlateReaderMessageId(int, Enum):
    """Plate Reader message ID."""

    REP_SUPPORTED_REPORTS_IN = 0x0010
    REP_ACK_INOUT = 0x0020
    REP_BULK_DATA_INOUT = 0x0030
    REP_HEARTBEAT_IN = 0x0040
    REP_API_VERSION_IN = 0x0050
    REP_ABORT_REPORT_OUT = 0x0060
    REP_DIAGNOSTIC_DATA_IN = 0x0070
    REP_VERSIONS_IN = 0x0080

    REP_BOOTLOADER_REBOOT_OUT = 0x0100
    REP_BOOTLOADER_FIRMWARE_FLASH_OUT = 0x0110
    REP_BOOTLOADER_FIRMWARE_ESP_FLASH_OUT = 0x0111
    REP_BOOTLOADER_FIRMWARE_CHECKSUM_IN = 0x0120
    REP_BOOTLOADER_FIRMWARE_LOCK_OUT = 0x0130

    REP_DEVICE_DATA_READ_IN = 0x0200
    REP_DEVICE_DATA_WRITE_OUT = 0x0210
    REP_DEVICE_DATA_FIELDS_IN = 0x0220

    REP_DEVICE_FILE_READ_IN = 0x0240
    REP_DEVICE_FILE_WRITE_OUT = 0x0250
    REP_DEVICE_FILE_NAMES_IN = 0x0260

    REP_RPC_ENDPOINTS_IN = 0x280
    REP_RPC_EXECUTE_OUT = 0x290

    REP_STATUS_IN = 0x0300
    REP_ENVIRONMENT_IN = 0x0310
    REP_ABS_TRIGGER_MEASUREMENT_OUT = 0x0320
    REP_ABS_WAVELENGTHS_IN = 0x0330
    REP_LUM_TRIGGER_MEASUREMENT_OUT = 0x0340
    REP_LED_BAR_COLOURS_OUT = 0x0350
    REP_LED_BAR_EFFECTS_OUT = 0x0351

    REP_ABS1_MEASUREMENT_IN = 0x0400

    REP_ABS96_MEASUREMENT_IN = 0x0500

    REP_LUM96_MEASUREMENT_IN = 0x0600

    REP_ESP_STATUS_IN = 0x1000

   

@unique
class AckId(int, Enum):

    ok = 0x00
    not_supported = 0x01
    aborted = 0x02
    failed = 0x03
    no_data = 0x04


@unique
class LightTransitionType(int, Enum):
    """The types of transitons that the lights can perform."""

    linear = 0x00
    sinusoid = 0x01
    instant = 0x02



@dataclass
class StatusIn(utils.BinarySerializable):

    message_id: utils.UInt16Field = utils.UInt16Field(PlateReaderMessageId.REP_STATUS_IN)
    length: utils.UInt16Field = utils.UInt16Field(0)wa
    message: utils.BinaryFieldBase[bytes] = utils.BinaryFieldBase(bytes())

