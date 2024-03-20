from typing import List, Dict, Literal
from pydantic import BaseModel

from .shared_models import (
    Position,
    BasicInfoModel,
    BoundingBox,
    UnitVector,
    CalibrationPoint,
    CompatibleModules,
    LegacyFixture,
    DeckDefinition,
)


class INode(BaseModel):
    name: str
    type: str
    value: str
    attributes: Dict[str, str]
    children: List["INode"]


class SlotDefV3(BasicInfoModel):
    position: Position
    boundingBox: BoundingBox
    compatibleModuleTypes: CompatibleModules
    matingSurfaceUnitVector: UnitVector | None = None


class LocationsV3(BaseModel):
    orderedSlots: List[SlotDefV3]
    calibrationPoints: List[CalibrationPoint]
    fixtures: List[LegacyFixture]


class DeckDefinitionV3(DeckDefinition):

    schemaVersion: Literal[3]
    locations: LocationsV3
    layers: List[INode]
