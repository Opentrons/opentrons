from typing_extensions import Literal
from typing import TYPE_CHECKING, List, Dict, Tuple, cast, Any
from pydantic import BaseModel, Field, validator, conint, conlist, confloat
from enum import Enum
from re import sub


def _snake_to_camel_case(snake: str) -> str:
    """Turns snake_case to camelCase"""
    return "".join(
        [s.capitalize() if i > 0 else s.lower() for i, s in enumerate(snake.split("_"))]
    )


class GripperModel(str, Enum):
    """Gripper models."""

    V1 = "gripperV1"


class GripperSchemaVersion(str, Enum):
    """Gripper schema versions."""

    V1 = "1"


GripperSchema = Dict[str, Any]


if TYPE_CHECKING:
    _StrictNonNegativeInt = int
    _StrictNonNegativeFloat = float
else:
    _StrictNonNegativeInt = conint(strict=True, ge=0)
    _StrictNonNegativeFloat = confloat(strict=True, ge=0.0)


class GripperBaseModel(BaseModel):
    class Config:
        alias_generator = _snake_to_camel_case


class Offset(GripperBaseModel):
    """Offset values for gripper."""

    x: float
    y: float
    z: float


class Geometry(GripperBaseModel):
    """Gripper geometry definition."""

    base_offset_from_mount: Offset
    jaw_center_offset_from_base: Offset
    pin_one_offset_from_base: Offset
    pin_two_offset_from_base: Offset
    jaw_width: Dict[str, float]


class ZMotorConfigurations(GripperBaseModel):
    """Gripper z motor configurations."""

    idle: float = Field(
        ...,
        description="Motor idle current in A",
        ge=0.02,
        le=1.0,
    )
    run: float = Field(
        ...,
        description="Motor active current in A",
        ge=0.67,
        le=2.5,
    )


class JawMotorConfigurations(GripperBaseModel):
    """Gripper z motor configurations."""

    vref: float = Field(
        ...,
        description="Reference voltage in V",
        ge=0.5,
        le=2.5,
    )


PolynomialTerm = Tuple[_StrictNonNegativeInt, float]


class JawForceProfile(GripperBaseModel):
    """Gripper force profile."""

    polynomial: List[PolynomialTerm] = Field(
        ...,
        description="Polynomial function to convert a grip force in Newton to the jaw motor duty cycle value, which will be read by the gripper firmware.",
        min_items=1,
    )
    default_grip_force: _StrictNonNegativeFloat
    default_home_force: _StrictNonNegativeFloat
    min: _StrictNonNegativeFloat
    max: _StrictNonNegativeFloat


class GripperDefinitionV1(GripperBaseModel):
    """Gripper v1 definition."""

    display_name: str = Field(..., description="Gripper display name.")
    model: GripperModel
    geometry: Geometry
    z_motor_config: ZMotorConfigurations
    jaw_motor_configurations: JawMotorConfigurations
    jaw_force_configurations: JawForceProfile

    # class Config:
    #     alias_generator = to_camel

    # @classmethod
    # def from_dict(cls, data: Dict[str, Any]) -> "GripperDefinitionV1":
    #     """Create GripperDefinitionV1 from object loaded from json file."""
    #     try:
    #         return cls(
    #             display_name=data["displayName"],
    #             model=GripperModel(data["model"]),
    #             geometry=GripperGeometryDefinition(
    #                  base_offset_from_mount=GripperOffset(**data[]["baseOffsetFromMount"]),
    #                 jaw_center_offset_from_base=GripperOffset(
    #                     **data["jawCenterOffsetFromBase"]
    #                 ),
    #                 pin_one_offset_from_base=GripperOffset(**data["pinOneOffsetFromBase"]),
    #                 pin_two_offset_from_base=GripperOffset(**data["pinTwoOffsetFromBase"]),
    #                 jaw_width=data["jaw_width"],
    #             ),
    #             z_motor=GripperZMotorConfigurations(
    #                 idle_current=GripperCustomizableFloat.build(**data["idleZCurrent"]),
    #             )
    #             z_idle_current=
    #             z_active_current=GripperCustomizableFloat.build(
    #                 **data["activeZCurrent"]
    #             ),
    #             jaw_reference_voltage=GripperCustomizableFloat.build(
    #                 **data["jawReferenceVoltage"]
    #             ),
    #             jaw_duty_cycle_polynomial=[
    #                 (d[0], d[1]) for d in data["jawDutyCyclePolynomial"]
    #             ],

    #         )
    #     except (KeyError) as e:
    #         raise InvalidGripperDefinition(e)
