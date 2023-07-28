"""Custom payload fields."""
from __future__ import annotations

from typing import Iterable, List, Iterator, Optional, Tuple

import binascii
import enum

from opentrons_hardware.firmware_bindings import utils, ErrorCode
from opentrons_hardware.firmware_bindings.constants import (
    ToolType,
    SensorType,
    SensorId,
    PipetteName,
    SensorOutputBinding,
    SensorThresholdMode,
    PipetteTipActionType,
    MotorPositionFlags,
    ErrorSeverity,
    MoveStopCondition,
    GearMotorId,
    MotorUsageValueType,
    MoveAckId,
)

from opentrons_hardware.firmware_bindings.binary_constants import (
    LightTransitionType,
    LightAnimationType,
)


class OptionalRevisionField(utils.BinaryFieldBase[bytes]):
    """The revision indicator in a device info.

    This is sized to hold 4 ASCII characters:
    - the primary revision
    - the secondary revision
    - two as-yet unused characters for tertiary revisions or other indications

    If we ever change the electrical revision format we'll need to change this
    too.

    We use characters here because different boards and different nodes can
    have different valid revisions - consider that PCBA 1 might have revisions
    A1, B2, C3... and PCBA 2 might have A2, B1, D.... due to maybe problems
    or timing that prevented a given revision from being produced. Having
    an enum that encompassed them all would waste space, and having a different
    enum for every board would rapidly balloon. Since the revision is used only
    for reporting and for looking up firmware, we can just make it the string.

    """

    NUM_BYTES = 4
    FORMAT = f"{NUM_BYTES}s"

    @property
    def value(self) -> bytes:
        """The value."""
        val = b""
        for elem in (self.primary, self.secondary):
            if elem:
                val = val + elem.encode()
            else:
                val = val + b"\x00"
        if self.tertiary:
            val = val + self.tertiary.encode()
        else:
            val = val + b"\x00\x00"
        return val

    @value.setter
    def value(self, val: bytes) -> None:
        self._primary, self._secondary, self._tertiary = self._parse(val)

    @classmethod
    def _revision_field_from_bytes(
        cls, data: bytes, start: int, end: int
    ) -> Optional[str]:
        try:
            present_bytes = data[start:end]
        except IndexError:
            present_bytes = b"\x00"
        nonzero_bytes = bytes(b for b in present_bytes if b != 0)
        try:
            return nonzero_bytes.decode("utf-8") or None
        except UnicodeDecodeError:
            return None

    @classmethod
    def _parse(cls, data: bytes) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        primary = cls._revision_field_from_bytes(data, 0, 1)
        secondary = cls._revision_field_from_bytes(data, 1, 2)
        tertiary = cls._revision_field_from_bytes(data, 2, 4)
        return primary, secondary, tertiary

    @classmethod
    def build(cls, data: bytes) -> "OptionalRevisionField":
        """Create an OptionalRevisionField from a byte buffer.

        The buffer should either have 4 bytes or no bytes. Devices with bootloaders
        too old to express their revision will not fill this field, so the
        deserializer must handle that.
        """
        return cls(*cls._parse(data))

    def __init__(
        self, primary: Optional[str], secondary: Optional[str], tertiary: Optional[str]
    ) -> None:
        """Build."""
        self._primary = primary
        self._secondary = secondary
        self._tertiary = tertiary

    @property
    def primary(self) -> Optional[str]:
        """The primary revision changes when traces change."""
        return self._primary

    @property
    def secondary(self) -> Optional[str]:
        """The secondary revision changes when functional parts change."""
        return self._secondary

    @property
    def tertiary(self) -> Optional[str]:
        """The tertiary revision changes when non-function parts change.

        The tertiary revision almost never changes and is not usually tracked.
        If a problem is discovered in the field that aligns with a tertiary
        revision, we'll begin to track it. This field is normally None.
        """
        return self._tertiary

    @property
    def revision(self) -> Optional[str]:
        """The relevant revision is primary + secondary.

        It is only valid if both primary and secondary are valid and it forms
        a string that can be used to look up appropriate firmware.
        """
        if not (self.primary is not None and self.secondary is not None):
            return None
        return f"{self.primary}{self.secondary}"

    def __repr__(self) -> str:
        """Repr."""
        return f"{self.__class__.__name__}(primary={self.primary}, secondary={self.secondary}, tertiary={self.tertiary})"


class FirmwareShortSHADataField(utils.BinaryFieldBase[bytes]):
    """The short hash in a device info.

    This is sized to hold the default size of an abbreviated Git hash,
    what you get when you do git rev-parse --short HEAD. If we ever
    need to increase the size of that abbreviated ID, we'll need to
    increase this too.
    """

    NUM_BYTES = 8
    FORMAT = f"{NUM_BYTES}s"


class VersionFlags(enum.Enum):
    """Flags in the version field."""

    BUILD_IS_EXACT_COMMIT = 0x1
    BUILD_IS_EXACT_VERSION = 0x2
    BUILD_IS_FROM_CI = 0x4


class VersionFlagsField(utils.UInt32Field):
    """A field for version flags."""

    def __repr__(self) -> str:
        """Print version flags."""
        flags_list = [
            flag.name for flag in VersionFlags if bool(self.value & flag.value)
        ]
        return f"{self.__class__.__name__}(value={','.join(flags_list)})"


class TaskNameDataField(utils.BinaryFieldBase[bytes]):
    """The name field of TaskInfoResponsePayload."""

    NUM_BYTES = 12
    FORMAT = f"{NUM_BYTES}s"


class ToolField(utils.UInt8Field):
    """A tool field."""

    def __repr__(self) -> str:
        """Print out a tool string."""
        try:
            tool_val = ToolType(self.value).name
        except ValueError:
            tool_val = str(self.value)
        return f"{self.__class__.__name__}(value={tool_val})"


class FirmwareUpdateDataField(utils.BinaryFieldBase[bytes]):
    """The data field of FirmwareUpdateData."""

    # this needs to be a multiple of 8
    NUM_BYTES = 48
    FORMAT = f"{NUM_BYTES}s"


class ErrorSeverityField(utils.UInt16Field):
    """A field for error severity."""

    def __repr__(self) -> str:
        """Print error severity."""
        try:
            severity = ErrorSeverity(self.value).name
        except ValueError:
            severity = str(self.value)
        return f"{self.__class__.__name__}(value={severity})"


class ErrorCodeField(utils.UInt16Field):
    """Error code field."""

    def __repr__(self) -> str:
        """Print error code."""
        try:
            error = ErrorCode(self.value).name
        except ValueError:
            error = str(self.value)
        return f"{self.__class__.__name__}(value={error})"


class SensorTypeField(utils.UInt8Field):
    """sensor type."""

    def __repr__(self) -> str:
        """Print sensor."""
        try:
            sensor_val = SensorType(self.value).name
        except ValueError:
            sensor_val = str(self.value)
        return f"{self.__class__.__name__}(value={sensor_val})"


class SensorIdField(utils.UInt8Field):
    """sensor id."""

    def __repr__(self) -> str:
        """Print sensor id."""
        try:
            sensor_id = SensorId(self.value).name
        except ValueError:
            sensor_id = str(self.value)
        return f"{self.__class__.__name__}(value={sensor_id})"


class PipetteNameField(utils.UInt16Field):
    """high-level pipette name field."""

    def __repr__(self) -> str:
        """Print pipette."""
        try:
            pipette_val = PipetteName(self.value).name
        except ValueError:
            pipette_val = str(self.value)
        return f"{self.__class__.__name__}(value={pipette_val})"


class SerialField(utils.BinaryFieldBase[bytes]):
    """The full serial number of a pipette or gripper."""

    NUM_BYTES = 20
    FORMAT = f"{NUM_BYTES}s"

    @classmethod
    def from_string(cls, t: str) -> SerialField:
        """Create from a string."""
        return cls(binascii.unhexlify(t)[: cls.NUM_BYTES])


class SerialDataCodeField(utils.BinaryFieldBase[bytes]):
    """The serial number Datacode of a pipette or gripper.

    This is sized to handle only the datecode part of the serial
    number; the full field can be synthesized from this, the
    model number, and the name.
    """

    NUM_BYTES = 16
    FORMAT = f"{NUM_BYTES}s"

    @classmethod
    def from_string(cls, t: str) -> SerialDataCodeField:
        """Create from a string."""
        return cls(binascii.unhexlify(t)[: cls.NUM_BYTES])


class SensorThresholdModeField(utils.UInt8Field):
    """sensor threshold mode."""

    def __repr__(self) -> str:
        """Print sensor."""
        try:
            sensor_val = SensorThresholdMode(self.value).name
        except ValueError:
            sensor_val = str(self.value)
        return f"{self.__class__.__name__}(value={sensor_val})"


class SensorOutputBindingField(utils.UInt8Field):
    """sensor type."""

    @classmethod
    def from_flags(
        cls, flags: Iterable[SensorOutputBinding]
    ) -> "SensorOutputBindingField":
        """Build a binding with a set of flags."""
        backing = 0
        for flag in flags:
            backing |= flag.value
        return cls.build(backing)

    def to_flags(self) -> List[SensorOutputBinding]:
        """Get the list of flags in the binding."""

        def _flags() -> Iterator[SensorOutputBinding]:
            for flag in SensorOutputBinding:
                if flag == SensorOutputBinding.none:
                    continue
                if bool(flag.value & self.value):
                    yield flag

        return list(_flags())

    def __repr__(self) -> str:
        """Print version flags."""
        flags_list = [
            flag.name for flag in SensorOutputBinding if bool(self.value & flag.value)
        ]
        return f"{self.__class__.__name__}(value={','.join(flags_list)})"


class EepromDataField(utils.BinaryFieldBase[bytes]):
    """The data portion of an eeprom read/write message."""

    NUM_BYTES = 8
    FORMAT = f"{NUM_BYTES}s"

    @classmethod
    def from_string(cls, t: str) -> EepromDataField:
        """Create from a string."""
        return cls(binascii.unhexlify(t)[: cls.NUM_BYTES])


class GearMotorIdField(utils.UInt8Field):
    """Gear Motor id for 96 channel."""

    def __repr__(self) -> str:
        """Print gear motor id for 96 channel."""
        try:
            gear_id = GearMotorId(self.value).name
        except ValueError:
            gear_id = str(self.value)
        return f"{self.__class__.__name__}(value={gear_id})"


class PipetteTipActionTypeField(utils.UInt8Field):
    """pipette tip action type."""

    def __repr__(self) -> str:
        """Print tip action."""
        try:
            action_type = PipetteTipActionType(self.value).name
        except ValueError:
            action_type = str(self.value)
        return f"{self.__class__.__name__}(value={action_type})"


class MotorPositionFlagsField(utils.UInt8Field):
    """Bitflags to indicate the validity of a motor position."""

    def __repr__(self) -> str:
        """Print the MotorPositionFlags."""
        flags_list = [
            flag.name for flag in MotorPositionFlags if bool(self.value & flag.value)
        ]
        return f"{self.__class__.__name__}(value={','.join(flags_list)})"


class MoveStopConditionField(utils.UInt8Field):
    """Move stop condition."""

    def __repr__(self) -> str:
        """Print move stop condition."""
        flags_list = [
            flag.name for flag in MoveStopCondition if bool(self.value & flag.value)
        ]
        return f"{self.__class__.__name__}(value={','.join(flags_list)})"


class LightTransitionTypeField(utils.UInt8Field):
    """Light transition type."""

    def __repr__(self) -> str:
        """Print light transition type."""
        try:
            transition = LightTransitionType(self.value).name
        except ValueError:
            transition = str(self.value)
        return f"{self.__class__.__name__}(value={transition})"


class LightAnimationTypeField(utils.UInt8Field):
    """Light action type."""

    def __repr__(self) -> str:
        """Print light action type."""
        try:
            action = LightAnimationType(self.value).name
        except ValueError:
            action = str(self.value)
        return f"{self.__class__.__name__}(value={action})"


class MotorUsageTypeField(utils.BinaryFieldBase[bytes]):
    """A struct for an individual motor usage key, length, value field."""

    NUM_BYTES = 11
    FORMAT = f"{NUM_BYTES}s"

    @property
    def value(self) -> bytes:
        """The value."""
        val = b""
        val = val + self.key.to_bytes(2, "big")
        val = val + self.length.to_bytes(1, "big")
        val = val + self.usage_value.to_bytes(8, "big")
        return val

    @value.setter
    def value(self, val: bytes) -> None:
        self._key, self._length, self._usage_value = self._parse(val)

    @classmethod
    def _usage_field_from_bytes(cls, data: bytes, start: int, end: int) -> int:
        try:
            present_bytes = data[start:end]
        except IndexError:
            present_bytes = b"\x00"
        return int.from_bytes(present_bytes, "big")

    @classmethod
    def _parse(cls, data: bytes) -> Tuple[int, int, int]:
        key = cls._usage_field_from_bytes(data, 0, 2)
        length = cls._usage_field_from_bytes(data, 2, 3)
        usage_value = cls._usage_field_from_bytes(data, 3, 11)
        if length < 8:
            usage_value = usage_value >> (8 - length) * 8
        return key, length, usage_value

    @classmethod
    def build(cls, data: bytes) -> "MotorUsageTypeField":
        """Create a Motor Usage Type Field from bytes"""
        return cls(*cls._parse(data))

    def __init__(self, key: int, length: int, usage_value: int) -> None:
        """Build."""
        self._key = key
        self._length = length
        self._usage_value = usage_value

    @property
    def key(self) -> int:
        """Key that describes what kind of usage this is"""
        return self._key

    @property
    def length(self) -> int:
        """Length of the usage data value field"""
        return self._length

    @property
    def usage_value(self) -> int:
        """Value for this particular type of usage"""
        return self._usage_value

    def __repr__(self) -> str:
        """Repr."""
        return f"{self.__class__.__name__}(key={MotorUsageValueType(self.key).name}, length={self.length}, usage_data={self.usage_value})"


class MoveAckIdField(utils.UInt8Field):
    """Move Ack id."""

    def __repr__(self) -> str:
        """Print ack id."""
        try:
            ack_id = MoveAckId(self.value).name
        except ValueError:
            ack_id = str(self.value)
        return f"{self.__class__.__name__}(value={ack_id})"
