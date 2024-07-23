""" opentrons_shared_data.module: functions and types for module defs """

from typing import Any, Dict, List, Union, cast, overload
from typing_extensions import Literal, TypedDict
import json
from pathlib import Path

from ..load import load_shared_data

SchemaV1 = Literal["1"]
SchemaV2 = Literal["2"]
SchemaV3 = Literal["3"]
SchemaVersions = Union[SchemaV1, SchemaV2, SchemaV3]

ModuleSchema = Dict[str, Any]

MagneticModuleType = Literal["magneticModuleType"]
TemperatureModuleType = Literal["temperatureModuleType"]
ThermocyclerModuleType = Literal["thermocyclerModuleType"]
HeaterShakerModuleType = Literal["heaterShakerModuleType"]
MagneticBlockType = Literal["magneticBlockType"]
AbsorbanceReaderType = Literal["absorbanceReaderType"]

ModuleType = Union[
    MagneticModuleType,
    TemperatureModuleType,
    ThermocyclerModuleType,
    HeaterShakerModuleType,
    MagneticBlockType,
    AbsorbanceReaderType,
]

MagneticModuleModel = Literal["magneticModuleV1", "magneticModuleV2"]
TemperatureModuleModel = Literal["temperatureModuleV1", "temperatureModuleV2"]
ThermocyclerModuleModel = Literal["thermocyclerModuleV1", "thermocyclerModuleV2"]
HeaterShakerModuleModel = Literal["heaterShakerModuleV1"]
MagneticBlockModel = Literal["magneticBlockV1"]
AbsorbanceReaderModel = Literal["absorbanceReaderV1"]

ModuleModel = Union[
    MagneticModuleModel,
    TemperatureModuleModel,
    ThermocyclerModuleModel,
    HeaterShakerModuleModel,
    MagneticBlockModel,
    AbsorbanceReaderModel,
]

ModuleSlotTransform = TypedDict(
    "ModuleSlotTransform", {"labwareOffset": List[List[float]]}
)

ModuleLabwareOffset = TypedDict(
    "ModuleLabwareOffset", {"x": float, "y": float, "z": float}
)

ModuleDimensions = TypedDict(
    "ModuleDimensions",
    {
        "bareOverallHeight": float,
        "overLabwareHeight": float,
        "lidHeight": float,
        "xDimension": float,
        "yDimension": float,
        "footprintXDimension": float,
        "footprintYDimension": float,
        "labwareInterfaceXDimension": float,
        "labwareInterfaceYDimension": float,
    },
    total=False,
)

ModuleCalibrationPointOffset = TypedDict(
    "ModuleCalibrationPointOffset", {"x": float, "y": float}
)

ModuleCalibrationPointOffsetWithZ = TypedDict(
    "ModuleCalibrationPointOffsetWithZ", {"x": float, "y": float, "z": float}
)

CornerOffsetFromSlot = TypedDict(
    "CornerOffsetFromSlot", {"x": float, "y": float, "z": float}
)


class NamedOffset(TypedDict):
    x: float
    y: float
    z: float


class GripperOffsets(TypedDict):
    pickUpOffset: NamedOffset
    dropOffset: NamedOffset


# TODO(mc, 2022-03-18): potentially move from typed-dict to Pydantic
ModuleDefinitionV3 = TypedDict(
    "ModuleDefinitionV3",
    {
        "$otSharedSchema": Literal["module/schemas/3"],
        "moduleType": ModuleType,
        "model": ModuleModel,
        "labwareOffset": ModuleLabwareOffset,
        "cornerOffsetFromSlot": CornerOffsetFromSlot,
        "dimensions": ModuleDimensions,
        "calibrationPoint": ModuleCalibrationPointOffsetWithZ,
        "config": Dict[str, int],
        "displayName": str,
        "quirks": List[str],
        "slotTransforms": Dict[str, Dict[str, Dict[str, List[List[float]]]]],
        "compatibleWith": List[ModuleModel],
        "incompatibleWithDecks": List[str],
        "twoDimensionalRendering": Dict[str, Any],
        "gripperOffsets": Dict[str, GripperOffsets],
    },
    total=False,
)

# V2 is not used anymore. This type is preserved for historical purposes
ModuleDefinitionV2 = TypedDict(
    "ModuleDefinitionV2",
    {
        "$otSharedSchema": Literal["module/schemas/2"],
        "moduleType": ModuleType,
        "model": ModuleModel,
        "labwareOffset": ModuleLabwareOffset,
        "dimensions": ModuleDimensions,
        "calibrationPoint": ModuleCalibrationPointOffset,
        "displayName": str,
        "quirks": List[str],
        "slotTransforms": Dict[str, Dict[str, Dict[str, List[List[float]]]]],
        "compatibleWith": List[ModuleModel],
    },
)

ModuleDefinitionV1 = TypedDict(
    "ModuleDefinitionV1",
    {
        "labwareOffset": ModuleLabwareOffset,
        "dimensions": ModuleDimensions,
        "calibrationPoint": ModuleCalibrationPointOffset,
        "displayName": str,
        "loadName": str,
        "quirks": List[str],
    },
)

OLD_TC_GEN2_LABWARE_OFFSET = {"x": 0, "y": 68.06, "z": 98.26}

# TODO (spp, 2023-02-14): these values are measured experimentally, and aren't from
#  machine drawings. We should replace them with values from CAD files and
#  possibly make them a part of thermocycler/ deck definitions
FLEX_TC_LID_CLIP_POSITIONS_IN_DECK_COORDINATES = {
    "left_clip": {"x": -3.25, "y": 402, "z": 205},
    "right_clip": {"x": 97.75, "y": 402, "z": 205},
}
FLEX_TC_LID_COLLISION_ZONE = {
    "back_left": {"x": -43.25, "y": 454.9, "z": 211.91},
    "front_right": {"x": 128.75, "y": 402, "z": 211.91},
}
"""
Deck co-ordinates of the top plane of TC lid + lid clips
of a thermocycler on a Flex.
"""


# TODO (spp, 2022-05-12): Python has a built-in error called `ModuleNotFoundError` so,
#                         maybe rename this one?


class ModuleNotFoundError(KeyError):
    def __init__(self, version: str, model_or_loadname: str):
        super().__init__(model_or_loadname)
        self.requested_version = version
        self.requested_module = model_or_loadname

    def __str__(self) -> str:
        return (
            f"No such version {self.requested_version} module "
            f"{self.requested_module}"
        )

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}: {self.requested_module} "
            f"at version {self.requested_version}"
        )


def load_schema(version: SchemaVersions) -> ModuleSchema:
    path = Path("module") / "schemas" / f"{version}.json"
    return cast(ModuleSchema, json.loads(load_shared_data(path)))


@overload
def load_definition(version: SchemaV1, model_or_loadname: str) -> ModuleDefinitionV1:
    ...


@overload
def load_definition(
    version: SchemaV3,
    model_or_loadname: Union[str, ModuleModel],
) -> ModuleDefinitionV3:
    ...


def load_definition(
    version: SchemaVersions,
    model_or_loadname: Union[str, ModuleModel],
) -> Union[ModuleDefinitionV1, ModuleDefinitionV3]:
    if version == "1":
        path = Path("module") / "definitions" / "1.json"
        data = json.loads(load_shared_data(path))
        try:
            return cast(ModuleDefinitionV1, data[model_or_loadname])
        except KeyError:
            raise ModuleNotFoundError("1", model_or_loadname)
    else:
        path = Path(f"module/definitions/{version}/{model_or_loadname}.json")
        try:
            data = load_shared_data(path)
        except FileNotFoundError:
            raise ModuleNotFoundError(version, model_or_loadname)
        return cast(ModuleDefinitionV3, json.loads(data))
