""" opentrons_shared_data.labware.dev_types: types for labware defs

types int this file by and large require the use of typing_extensions.
this module shouldn't be imported unless typing.TYPE_CHECKING is true.
"""
from typing import Dict, List, Union

from typing_extensions import Literal, TypedDict


LabwareDisplayCategory = Union[
    Literal['tipRack'], Literal['tubeRack'],
    Literal['reservoir'], Literal['trash'],
    Literal['wellPlate'], Literal['aluminumBlock'],
    Literal['other']]

LabwareFormat = Union[
    Literal['96Standard'], Literal['384Standard'], Literal['trough'],
    Literal['irregular'], Literal['trash']
]

Circular = Literal['circular']
Rectangular = Literal['rectangular']
WellShape = Union[Circular, Rectangular]


class NamedOffset(TypedDict):
    x: float
    y: float
    z: float


class LabwareParameters(TypedDict, total=False):
    format: LabwareFormat
    isTiprack: bool
    loadName: str
    isMagneticModuleCompatible: bool
    quirks: List[str]
    tipLength: float
    tipOverlap: float
    magneticModuleEngageHeight: float


class LabwareBrandData(TypedDict, total=False):
    brand: str
    brandId: List[str]
    links: List[str]


class LabwareMetadata(TypedDict):
    displayName: str
    displayCategory: LabwareDisplayCategory
    displayVolumeUnits: Union[Literal['µL'], Literal['mL'], Literal['L']]
    tags: List[str]


class LabwareDimensions(TypedDict):
    yDimension: float
    zDimension: float
    xDimension: float


class CircularWellDefinition(TypedDict):
    shape: Circular
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    diameter: float


class RectangularWellDefinition(TypedDict):
    shape: Rectangular
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    xDimension: float
    yDimension: float


WellDefinition = Union[CircularWellDefinition, RectangularWellDefinition]


class WellGroupMetadata(TypedDict, total=False):
    displayName: str
    displayCategory: LabwareDisplayCategory
    wellBottomShape: Union[Literal['flat'], Literal['u'], Literal['v']]


class WellGroup(TypedDict, total=False):
    wells: List[str]
    metadata: WellGroupMetadata
    brand: LabwareBrandData


class LabwareDefinition(TypedDict):
    schemaVersion: Literal[2]
    version: int
    namespace: str
    metadata: LabwareMetadata
    brand: LabwareBrandData
    parameters: LabwareParameters
    cornerOffsetFromSlot: NamedOffset
    ordering: List[List[str]]
    dimensions: LabwareDimensions
    wells: Dict[str, WellDefinition]
    groups: List[WellGroup]
