from __future__ import annotations

"""
opentrons_shared_data.pipette: functions and types for pipette config
"""
import copy
from typing import Dict, List, NewType, Union
import json
from functools import lru_cache

from .. import load_shared_data
from enum import Enum

from typing_extensions import Literal, TypedDict

# TODO(mc, 2022-06-16): remove type alias when able
# and when certain removal will not break any pickling
from ..labware import LabwareUri as LabwareUri


PipetteName = Literal[
    "p10_single",
    "p10_multi",
    "p20_single_gen2",
    "p20_multi_gen2",
    "p50_single",
    "p50_multi",
    "p50_single_flex",
    "p50_multi_flex",
    "p300_single",
    "p300_multi",
    "p300_single_gen2",
    "p300_multi_gen2",
    "p1000_single",
    "p1000_single_gen2",
    "p1000_single_flex",
    "p1000_multi_flex",
    "p1000_96",
]


class PipetteNameType(str, Enum):
    """Pipette load name values."""

    value: PipetteName

    P10_SINGLE = "p10_single"
    P10_MULTI = "p10_multi"
    P20_SINGLE_GEN2 = "p20_single_gen2"
    P20_MULTI_GEN2 = "p20_multi_gen2"
    P50_SINGLE = "p50_single"
    P50_MULTI = "p50_multi"
    P50_SINGLE_FLEX = "p50_single_flex"
    P50_MULTI_FLEX = "p50_multi_flex"
    P300_SINGLE = "p300_single"
    P300_MULTI = "p300_multi"
    P300_SINGLE_GEN2 = "p300_single_gen2"
    P300_MULTI_GEN2 = "p300_multi_gen2"
    P1000_SINGLE = "p1000_single"
    P1000_SINGLE_GEN2 = "p1000_single_gen2"
    P1000_SINGLE_FLEX = "p1000_single_flex"
    P1000_MULTI_FLEX = "p1000_multi_flex"
    P1000_96 = "p1000_96"


# Generic NewType for models because we get new ones frequently and theres
# a huge number of them
PipetteModel = NewType("PipetteModel", str)

DisplayCategory = Literal["GEN1", "GEN2", "FLEX"]

# todo(mm, 2022-03-18):
# The JSON schema defines this as any string, not as an enum of string literals.
# Check if it's safe to simplify this to just str.
ConfigUnit = Literal[
    "mm",
    "amps",
    "mm/sec",
    "mm/s",  # todo(mm, 2022-03-18): Standardize specs to mm/sec or mm/s.
    "presses",
]

Quirk = NewType("Quirk", str)

ChannelCount = Literal[1, 8, 96]

UlPerMmAction = Literal["aspirate", "dispense", "blowout"]


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
    type: Literal["float"]


class PipetteCustomizableConfigElementInt(TypedDict):
    value: int
    min: int
    max: int
    units: ConfigUnit
    type: Literal["int"]


PipetteCustomizableConfigElement = Union[
    PipetteCustomizableConfigElementFloat, PipetteCustomizableConfigElementInt
]

SmoothieConfigs = TypedDict(
    "SmoothieConfigs",
    {"stepsPerMM": float, "homePosition": float, "travelDistance": float},
)


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
    defaultTipracks: List[LabwareUri]


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
    nozzleOffset: List[float]
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


# TODO (spp, 2023-06-22: should probably move this to definition)
"""
The span of pipettes in X-direction based on number of channels.
This is needed in order to determine safe tip drop location within a labware.
"""
PIPETTE_X_SPAN: Dict[ChannelCount, float] = {
    1: 75,  # includes a margin
    8: 75,  # includes a margin
    96: 161,
}


def model_config() -> PipetteModelSpecs:
    """Load the per-pipette-model config file from within the wheel"""
    return copy.deepcopy(_model_config())


@lru_cache(maxsize=None)
def _model_config() -> PipetteModelSpecs:
    return json.loads(
        load_shared_data("pipette/definitions/1/pipetteModelSpecs.json") or "{}"
    )


def name_config() -> PipetteNameSpecs:
    """Load the per-pipette-name config file from within the wheel"""
    return _name_config()


@lru_cache(maxsize=None)
def _name_config() -> PipetteNameSpecs:
    return json.loads(
        load_shared_data("pipette/definitions/1/pipetteNameSpecs.json") or "{}"
    )


def name_for_model(pipette_model: PipetteModel) -> PipetteName:
    """Quickly look up the name for this model"""
    return model_config()["config"][pipette_model]["name"]


def fuse_specs(
    pipette_model: PipetteModel, pipette_name: PipetteName = None
) -> PipetteFusedSpec:
    """Combine the model and name spec for a given model.

    if pipette_name is not given, the name field of the pipette config
    is used. If it is, the given name must be in the backCompatNames field.
    """
    return copy.deepcopy(_fuse_specs_cached(pipette_model, pipette_name))


@lru_cache(maxsize=None)
def _fuse_specs_cached(
    pipette_model: PipetteModel, pipette_name: PipetteName = None
) -> PipetteFusedSpec:
    """
    Do the work of fusing the specs inside an lru cache. This can't be the
    function that's directly called because we want to return a new object
    all the time, hence the wrapper.
    """
    model_data = _model_config()["config"][pipette_model]
    pipette_name = pipette_name or model_data["name"]

    valid_names = [model_data["name"]] + model_data.get("backCompatNames", [])

    if pipette_name not in valid_names:
        raise KeyError(
            f"pipette name {pipette_name} is not valid for model " f"{pipette_model}"
        )
    name_data = _name_config()[pipette_name]
    # unfortunately, mypy can't verify this way to build typed dicts - we'll
    # make sure it's correct in the tests, and leave the function annotated
    # properly
    return {**model_data, **name_data}


def dummy_model_for_name(pipette_name: PipetteName) -> PipetteModel:
    if "gen2" in pipette_name:
        return "_".join(pipette_name.split("_")[:-1]) + "_v2.0"  # type: ignore
    elif "flex" in pipette_name:
        return "_".join(pipette_name.split("_")[:-1]) + "_v3.0"  # type: ignore
    else:
        return pipette_name + "_v1"  # type: ignore
