"""
opentrons_shared_data.gripper.dev_types: types for gripper config that
require typing_extensions.

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
    value: float
    min: float
    max: float
    units: ConfigUnit
    type: Literal["float"]


class GripperCustomizableConfigElementInt(TypedDict):
    value: int
    min: int
    max: int
    units: ConfigUnit
    type: Literal["int"]


class GripperNameSpec(TypedDict):
    displayName: str
    displayCategory: DisplayCategory


GripperNameSpecs = Dict[GripperName, GripperNameSpec]


class GripperModelSpec(TypedDict, total=False):
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


class GripperFusedSpec(GripperNameSpec, GripperModelSpec, total=False):
    pass


class GripperModelSpecs(TypedDict):
    config: Dict[GripperModel, GripperModelSpec]
    mutableConfigs: List[str]
