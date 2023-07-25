import enum
from dataclasses import dataclass
from typing import Union, Dict, Mapping, Tuple, cast
from typing_extensions import Literal

"""Pipette Definition V2 Types"""

# Needed for Int Comparison. Keeping it next to
# the Literal type for ease of readability
PipetteModelMajorVersion = [1, 2, 3]
PipetteModelMinorVersion = [0, 1, 2, 3, 4, 5, 6]

# TODO Literals are only good for writing down
# exact values. Is there a better typing mechanism
# so we don't need to keep track of versions in two
# different places?
PipetteModelMajorVersionType = Literal[1, 2, 3]
PipetteModelMinorVersionType = Literal[0, 1, 2, 3, 4, 5, 6]


class PipetteTipType(enum.Enum):
    t10 = 10
    t20 = 20
    t50 = 50
    t200 = 200
    t300 = 300
    t1000 = 1000


class PipetteChannelType(int, enum.Enum):
    SINGLE_CHANNEL = 1
    EIGHT_CHANNEL = 8
    NINETY_SIX_CHANNEL = 96

    def __str__(self) -> str:
        if self.value == 96:
            return "96"
        elif self.value == 8:
            return "multi"
        else:
            return "single"


class PipetteModelType(enum.Enum):
    p10 = "p10"
    p20 = "p20"
    p50 = "p50"
    p300 = "p300"
    p1000 = "p1000"


class PipetteGenerationType(enum.Enum):
    GEN1 = "GEN1"
    GEN2 = "GEN2"
    FLEX = "FLEX"


@dataclass(frozen=True)
class PipetteVersionType:
    major: PipetteModelMajorVersionType
    minor: PipetteModelMinorVersionType

    @classmethod
    def convert_from_float(cls, version: float) -> "PipetteVersionType":
        major = cast(PipetteModelMajorVersionType, int(version // 1))
        minor = cast(PipetteModelMinorVersionType, int(round((version % 1), 2) * 10))
        return cls(major=major, minor=minor)

    def __str__(self) -> str:
        if self.major == 1 and self.minor == 0:
            # Maintain the format of V1 pipettes that
            # do not contain a minor version at all.
            return f"{self.major}"
        else:
            return f"{self.major}.{self.minor}"

    @property
    def as_tuple(
        self,
    ) -> Tuple[PipetteModelMajorVersionType, PipetteModelMinorVersionType]:
        return (self.major, self.minor)


"""Mutable Configs Types"""


class Quirks(enum.Enum):
    pickupTipShake = "pickupTipShake"
    dropTipShake = "dropTipShake"
    doubleDropTip = "doubleDropTip"
    needsUnstick = "needsUnstick"


class AvailableUnits(enum.Enum):
    mm = "mm"
    amps = "amps"
    speed = "mm/s"
    presses = "presses"


@dataclass
class RobotMountConfigs:
    stepsPerMM: float
    homePosition: float
    travelDistance: float


@dataclass
class MutableConfig:
    value: Union[int, float]
    default: Union[int, float]
    units: AvailableUnits
    type: str
    min: float
    max: float
    name: str

    @classmethod
    def build(
        cls,
        value: Union[int, float],
        default: Union[int, float],
        units: str,
        type: str,
        min: float,
        max: float,
        name: str,
    ) -> "MutableConfig":
        return cls(
            value=value,
            default=default,
            units=AvailableUnits(units),
            type=type,
            min=min,
            max=max,
            name=name,
        )

    def validate_and_add(self, new_value: Union[int, float]) -> None:
        if new_value < self.min or new_value > self.max:
            raise ValueError(f"{self.name} out of range with {new_value}")
        self.value = new_value

    def dict_for_encode(self) -> Dict[str, Union[int, float, str]]:
        return {
            "value": self.value,
            "default": self.default,
            "units": self.units.value,
            "type": self.type,
            "min": self.min,
            "max": self.max,
        }


@dataclass
class QuirkConfig:
    value: bool
    name: Quirks

    @classmethod
    def validate_and_build(cls, name: str, value: bool) -> "QuirkConfig":
        quirk_name = Quirks(name)
        cls.validate(name, value)
        return cls(value=value, name=quirk_name)

    @classmethod
    def validate(cls, name: str, value: bool) -> None:
        if not isinstance(value, bool):
            raise ValueError(f"{value} is invalid for {name}")

    def dict_for_encode(self) -> bool:
        return self.value


TypeOverrides = Mapping[str, Union[float, bool, None]]

OverrideType = Dict[str, Union[Dict[str, QuirkConfig], MutableConfig, str]]
