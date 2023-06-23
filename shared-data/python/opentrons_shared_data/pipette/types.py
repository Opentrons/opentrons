import enum
from dataclasses import dataclass
from typing import Union, Dict, Mapping


@dataclass
class RobotMountConfigs:
    stepsPerMM: float
    homePosition: float
    travelDistance: float


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
