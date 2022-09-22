"""opentrons_shared_data.gripper.dev_types: gripper types."""

from typing import Any, Dict, List, NamedTuple, Tuple
from dataclasses import dataclass
from enum import Enum

from typing_extensions import Literal


GripperName = Literal["gripper"]

ConfigUnit = Literal[
    "amps",
    "percentage",  # Duty cycle
    "volts",  # Reference voltage
]


class InvalidGripperDefinition(Exception):
    """Incorrect gripper definition."""

    pass


class GripperModel(str, Enum):
    """Gripper models."""

    V1 = "gripperV1"


class GripperSchemaVersion(str, Enum):
    """Gripper schema versions."""

    V1 = "1"


GripperSchema = Dict[str, Any]


class GripperOffset(NamedTuple):
    """Offset values for gripper."""

    x: float
    y: float
    z: float


@dataclass(frozen=True)
class GripperCustomizableFloat:
    """Customizable floats."""

    default_value: float
    min: float
    max: float
    units: ConfigUnit
    type: Literal["float"]

    @classmethod
    def build(cls, defaultValue: float, **kwarg: Any) -> "GripperCustomizableFloat":
        """Build frozen dataclass from json camelcase to python snakecase field."""
        return cls(default_value=defaultValue, **kwarg)


@dataclass(frozen=True)
class GripperCustomizableInt:
    """Customizable ints."""

    default_value: int
    min: int
    max: int
    units: ConfigUnit
    type: Literal["int"]

    @classmethod
    def build(cls, defaultValue: int, **kwarg: Any) -> "GripperCustomizableInt":
        """Build frozen dataclass from json camelcase to python snakecase field."""
        return cls(default_value=defaultValue, **kwarg)


@dataclass(frozen=True)
class GripperDefinitionV1:
    """Gripper v1 definition."""

    display_name: str
    model: GripperModel
    z_idle_current: GripperCustomizableFloat
    z_active_current: GripperCustomizableFloat
    jaw_reference_voltage: GripperCustomizableFloat
    jaw_force_per_duty_cycle: List[Tuple[float, int]]
    base_offset_from_mount: GripperOffset
    jaw_center_offset_from_base: GripperOffset
    pin_one_offset_from_base: GripperOffset
    pin_two_offset_from_base: GripperOffset
    quirks: List[str]
    jaw_sizes_mm: Dict[str, float]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GripperDefinitionV1":
        """Create GripperDefinitionV1 from object loaded from json file."""
        try:
            return cls(
                display_name=data["displayName"],
                model=GripperModel(data["model"]),
                z_idle_current=GripperCustomizableFloat.build(**data["idleZCurrent"]),
                z_active_current=GripperCustomizableFloat.build(
                    **data["activeZCurrent"]
                ),
                jaw_reference_voltage=GripperCustomizableFloat.build(
                    **data["jawReferenceVoltage"]
                ),
                jaw_force_per_duty_cycle=[
                    (element[0], element[1]) for element in data["jawForcePerDutyCycle"]
                ],
                base_offset_from_mount=GripperOffset(**data["baseOffsetFromMount"]),
                jaw_center_offset_from_base=GripperOffset(
                    **data["jawCenterOffsetFromBase"]
                ),
                pin_one_offset_from_base=GripperOffset(**data["pinOneOffsetFromBase"]),
                pin_two_offset_from_base=GripperOffset(**data["pinTwoOffsetFromBase"]),
                quirks=data["quirks"],
                jaw_sizes_mm=data["jawSizes_mm"],
            )
        except (KeyError) as e:
            raise InvalidGripperDefinition(e)
