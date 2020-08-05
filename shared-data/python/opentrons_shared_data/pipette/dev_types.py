"""
opentrons_shared_data.pipette.dev_types: types for pipette config that
require typing_extensions.

This module should only be imported if typing.TYPE_CHECKING is True.
"""

from typing import Dict, List, NewType, Union

from typing_extensions import Literal, TypedDict

# Explicit listing of pipette names because we don't frequently get new ones
PipetteName = Union[Literal['p10_single'], Literal['p10_multi'],
                    Literal['p20_single_gen2'], Literal['p20_multi_gen2'],
                    Literal['p50_single'], Literal['p50_multi'],
                    Literal['p300_single'], Literal['p300_multi'],
                    Literal['p300_single_gen2'], Literal['p300_multi_gen2'],
                    Literal['p1000_single'], Literal['p100_single_gen2']]

# Generic NewType for models because we get new ones frequently and theres
# a huge number of them
PipetteModel = NewType('PipetteModel', str)

DisplayCategory = Union[Literal['GEN1'], Literal['GEN2']]

ConfigUnit = Union[Literal['mm'], Literal['amps'], Literal['mm/sec']]

Quirk = NewType('Quirk', str)

ChannelCount = Union[Literal[1], Literal[8]]

UlPerMmAction = Union[Literal['aspirate'], Literal['dispense']]


class PipetteConfigElement(TypedDict):
    value: float
    min: float
    max: float


class PipetteConfigElementWithPerApiLevelValue(TypedDict):
    value: float
    min: float
    max: float
    valuesByApiLevel: Dict[str, float]


# TypedDicts can't be generic sadly
class PipetteCustomizableConfigElementFloat(TypedDict):
    value: float
    min: float
    max: float
    units: ConfigUnit
    type: Literal['float']


class PipetteCustomizableConfigElementInt(TypedDict):
    value: int
    min: int
    max: int
    units: ConfigUnit
    type: Literal['int']


PipetteCustomizableConfigElement = Union[
    PipetteCustomizableConfigElementFloat, PipetteCustomizableConfigElementInt]

SmoothieConfigs = TypedDict(
        'SmoothieConfigs',
        {'stepsPerMM': float,
         'homePosition': float,
         'travelDistance': float})


class PipetteNameSpec(TypedDict):
    displayName: str
    displayCategory: DisplayCategory
    minVolume: Union[float, int]
    maxVolume: Union[float, int]
    channels: ChannelCount
    defaultAspirateFlowRate: PipetteConfigElementWithPerApiLevelValue
    defaultDispenseFlowRate: PipetteConfigElementWithPerApiLevelValue
    defaultBlowOutFlowRate: PipetteConfigElementWithPerApiLevelValue
    smoothieConfigs: SmoothieConfigs


PipetteNameSpecs = Dict[PipetteName, PipetteNameSpec]

UlPerMm = Dict[UlPerMmAction, List[List[float]]]


class PipetteModelSpec(TypedDict, total=False):
    name: PipetteName
    top: PipetteCustomizableConfigElementFloat
    bottom: PipetteCustomizableConfigElementFloat
    blowout: PipetteCustomizableConfigElementFloat
    dropTip: PipetteCustomizableConfigElementFloat
    pickUpCurrent: PipetteCustomizableConfigElementFloat
    pickUpDistance: PipetteCustomizableConfigElementFloat
    pickUpIncrement: PipetteCustomizableConfigElementFloat
    pickUpPresses: PipetteCustomizableConfigElementInt
    pickUpSpeed: PipetteCustomizableConfigElementFloat
    plungerCurrent: PipetteCustomizableConfigElementFloat
    dropTipCurrent: PipetteCustomizableConfigElementFloat
    dropTipSpeed: PipetteCustomizableConfigElementFloat
    modelOffset: List[float]
    ulPerMm: List[UlPerMm]
    tipOverlap: Dict[str, float]
    tipLength: PipetteCustomizableConfigElementFloat
    quirks: List[Quirk]
    # these keys are not present in some pipette definitions
    backCompatNames: List[PipetteName]
    idleCurrent: float
    returnTipHeight: float


class PipetteFusedSpec(PipetteNameSpec, PipetteModelSpec, total=False):
    pass


class PipetteModelSpecs(TypedDict):
    config: Dict[PipetteModel, PipetteModelSpec]
    mutableConfigs: List[str]
    validQuirks: List[str]
