"""opentrons_shared_data.gripper.dev_types: gripper types."""

from typing import Any, Dict, List, NamedTuple
from dataclasses import dataclass
from enum import Enum

from typing_extensions import Literal


ConfigUnit = Literal[
    "amps",
    "hertz",  # PWM frequency
    "percentage",  # Duty cycle
    "volt",  # Reference voltage
]


class InvalidGripperDefinition(Exception):
    """Incorrect gripper definition."""

    pass


class GripperModel(str, Enum):
    """Gripper models."""

    v1 = "gripperV1"


class GripperSchemaVersion(str, Enum):
    """Gripper schema versions."""

    v1 = "1"


GripperSchema = Dict[str, Any]


class GripperOffset(NamedTuple):
    """Offset values for gripper."""

    x: float
    y: float
    z: float


@dataclass
class GripperCustomizableFloat:
    """Customizable floats."""

    value: float
    min: float
    max: float
    units: ConfigUnit
    type: Literal["float"]


@dataclass
class GripperCustomizableInt:
    """Customizable ints."""

    value: int
    min: int
    max: int
    units: ConfigUnit
    type: Literal["int"]


@dataclass
class GripperDefinitionV1:
    """Gripper v1 definition."""

    display_name: str
    model: GripperModel
    idle_current: GripperCustomizableFloat
    active_current: GripperCustomizableFloat
    reference_voltage: GripperCustomizableFloat
    pwm_frequency: GripperCustomizableInt
    duty_cycle: GripperCustomizableInt
    base_offset_from_mount: GripperOffset
    jaw_center_offset_from_base: GripperOffset
    pin_one_offset_from_base: GripperOffset
    pin_two_offset_from_base: GripperOffset
    quirks: List[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GripperDefinitionV1":
        """Create GripperDefinitionV1 from object loaded from json file."""
        try:
            return cls(
                display_name=data["displayName"],
                model=GripperModel(data["model"]),
                idle_current=GripperCustomizableFloat(**data["idleCurrent"]),
                active_current=GripperCustomizableFloat(**data["activeCurrent"]),
                reference_voltage=GripperCustomizableFloat(**data["referenceVoltage"]),
                pwm_frequency=GripperCustomizableInt(**data["pwmFrequency"]),
                duty_cycle=GripperCustomizableInt(**data["dutyCycle"]),
                base_offset_from_mount=GripperOffset(**data["baseOffsetFromMount"]),
                jaw_center_offset_from_base=GripperOffset(
                    **data["jawCenterOffsetFromBase"]
                ),
                pin_one_offset_from_base=GripperOffset(**data["pinOneOffsetFromBase"]),
                pin_two_offset_from_base=GripperOffset(**data["pinTwoOffsetFromBase"]),
                quirks=data["quirks"],
            )
        except (KeyError) as e:
            raise InvalidGripperDefinition(e)
