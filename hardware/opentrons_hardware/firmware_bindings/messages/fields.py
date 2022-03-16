"""Custom payload fields."""
import enum

from opentrons_hardware.firmware_bindings import utils, ErrorCode
from opentrons_hardware.firmware_bindings.constants import ToolType, SensorType


class FirmwareShortSHADataField(utils.BinaryFieldBase[bytes]):
    """The short hash in a device info.

    This is sized to hold the default size of an abbreviated Git hash,
    what you get when you do git rev-parse --short HEAD. If we ever
    need to increase the size of that abbreviated ID, we'll need to
    increase this too.
    """

    NUM_BYTES = 7
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

    NUM_BYTES = 56
    FORMAT = f"{NUM_BYTES}s"


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
