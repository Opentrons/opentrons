from typing import Any, List, Dict, Literal
from pydantic import BaseModel, validator
from enum import Enum

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


class AreaType(Enum):
    """The type of addressable area."""

    SLOT = "slot"
    STAGING_SLOT = "stagingSlot"
    MOVABLE_TRASH = "movableTrash"
    FIXED_TRASH = "fixedTrash"
    WASTE_CHUTE = "wasteChute"


AddressableAreaInfo = Dict[str, List[str]]


class AddressableArea(BasicInfoModel):

    areaType: AreaType
    offsetFromCutoutFixture: Position
    boundingBox: BoundingBox

    ableToDropTips: bool | None = False
    ableToDropLabware: bool | None = False
    compatibleModuleTypes: CompatibleModules | None
    matingSurfaceUnitVector: UnitVector | None


class Cutout(BasicInfoModel):
    position: Position


class LocationsV4(BaseModel):
    addressableAreas: List[AddressableArea]
    calibrationPoints: List[CalibrationPoint]
    cutouts: List[Cutout]
    legacyFixtures: List[LegacyFixture]


class CutoutFixture(BasicInfoModel):
    expectOpentronsModuleSerialNumber: bool | None = False
    mayMountTo: List[str]
    providesAddressableAreas: AddressableAreaInfo
    height: float

    @validator("providesAddressableAreas")
    def validate_addressable_areas(
        cls, areas: AddressableAreaInfo, values: Any
    ) -> AddressableAreaInfo:
        cutouts = set(values.get("mayMountTo"))
        address_key = set(areas.keys())
        assert cutouts == address_key
        return areas


class DeckDefinitionV4(DeckDefinition):

    schemaVersion: Literal[4]
    locations: LocationsV4
    cutoutFixtures: List[CutoutFixture]

    @validator("cutoutFixtures", each_item=True, allow_reuse=True)
    def validate_cutout_fixture_mounts(
        cls, fixture: CutoutFixture, values: Any
    ) -> CutoutFixture:
        locations = values.get("locations")
        assert isinstance(locations, LocationsV4)
        valid_aa_ids = set(aa.id for aa in locations.addressableAreas)

        for area_list in fixture.providesAddressableAreas.values():
            fixture_aa_ids = set(area for area in area_list)
            assert fixture_aa_ids.issubset(valid_aa_ids)
        return fixture
