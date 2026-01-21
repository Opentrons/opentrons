"""Type definitions for modules in this tree"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, NamedTuple, Optional

from opentrons_shared_data.util import StrEnum


class MoveSplit(NamedTuple):
    split_distance: float
    split_current: float
    split_speed: float
    after_time: float
    fullstep: bool


MoveSplits = Dict[str, MoveSplit]
#: Dict mapping axes to their split parameters


@dataclass
class Temperature:
    """Tempdeck, thermocycler plate, and heater-shaker temperatures"""

    current: float
    target: Optional[float]


@dataclass
class RPM:
    """Heater-shaker plate RPM"""

    current: int
    target: Optional[int]


class HeaterShakerLabwareLatchStatus(StrEnum):
    """Heater-shaker labware latch status"""

    OPENING = "opening"
    IDLE_OPEN = "idle_open"
    CLOSING = "closing"
    IDLE_CLOSED = "idle_closed"
    IDLE_UNKNOWN = "idle_unknown"
    UNKNOWN = "unknown"


@dataclass
class PlateTemperature(Temperature):
    """Thermocycler lid temperature"""

    hold: Optional[float]


class ThermocyclerLidStatus(StrEnum):
    """Thermocycler lid status."""

    UNKNOWN = "unknown"
    CLOSED = "closed"
    IN_BETWEEN = "in_between"
    OPEN = "open"
    MAX = "max"


class AbsorbanceReaderLidStatus(StrEnum):
    """Absorbance reader lid status."""

    UNKNOWN = "unknown"
    ON = "on"
    OFF = "off"


class AbsorbanceReaderPlatePresence(StrEnum):
    """Absorbance reader plate presence."""

    UNKNOWN = "unknown"
    PRESENT = "present"
    ABSENT = "absent"


class AbsorbanceReaderDeviceState(StrEnum):
    """Absorbance reader device state."""

    UNKNOWN = "unknown"
    OK = "ok"
    BROKEN_FW = "broken_fw"
    ERROR = "error"


class ABSMeasurementMode(Enum):
    """The current mode configured for reading the Absorbance Reader."""

    SINGLE = "single"
    MULTI = "multi"


@dataclass
class ABSMeasurementConfig:
    measure_mode: ABSMeasurementMode
    sample_wavelengths: List[int]
    reference_wavelength: Optional[int]

    @property
    def data(self) -> Dict[str, Any]:
        return {
            "measureMode": self.measure_mode.value,
            "sampleWavelengths": self.sample_wavelengths,
            "referenceWavelength": self.reference_wavelength,
        }
