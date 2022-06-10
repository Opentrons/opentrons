"""Types for gripper config that require typing_extensions.

This module should only be imported if typing.TYPE_CHECKING is True.
"""
from typing import Dict, List, Union, NewType

from typing_extensions import Literal, TypedDict


GripperName = Literal["gripper"]

GripperModel = NewType("GripperModel", str)

DisplayCategory = Literal["GEN1"]

ConfigUnit = Union[
    Literal["amps"],
    Literal["hertz"],  # PWM frequency
    Literal["percentage"],  # Duty cycle
    Literal["volt"],  # Reference voltage
]


class GripperCustomizableConfigElementFloat(TypedDict):
    """Customizable floats."""

    value: float
    min: float
    max: float
    units: ConfigUnit
    type: Literal["float"]


class GripperCustomizableConfigElementInt(TypedDict):
    """Customizable ints."""

    value: int
    min: int
    max: int
    units: ConfigUnit
    type: Literal["int"]


class GripperNameSpec(TypedDict):
    """Names for gripper."""

    displayName: str
    displayCategory: DisplayCategory


GripperNameSpecs = Dict[GripperName, GripperNameSpec]


class GripperModelSpec(TypedDict, total=False):
    """Gripper specs based on model."""

    name: GripperName
    idleCurrent: GripperCustomizableConfigElementFloat
    activeCurrent: GripperCustomizableConfigElementFloat
    referenceVoltage: GripperCustomizableConfigElementFloat
    pwmFrequency: GripperCustomizableConfigElementInt
    dutyCycle: GripperCustomizableConfigElementInt
    baseOffsetFromMount: List[float]
    jawCenterOffsetFromBase: List[float]
    pinOneOffsetFromBase: List[float]
    pinTwoOffsetFromBase: List[float]


class GripperModelSpecs(TypedDict):
    """Gripper model specs with mutable configs."""

    config: Dict[GripperModel, GripperModelSpec]
    mutableConfigs: List[str]


class GripperFusedSpec(GripperNameSpec, GripperModelSpec, total=False):
    """Gripper fused spec."""

    pass
