from typing import Dict, Literal, List, Any
from enum import Enum
from pydantic import BaseModel, validator

from . import v4
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
    THERMOCYCLER = "thermocycler"
    HEATER_SHAKER = "heaterShaker"
    TEMPERATURE = "temperatureModule"
    MAGNETICBLOCK = "magneticBlock"


AddressableAreaInfo = Dict[str, List[str]]


class AddressableArea(BasicInfoModel):

    areaType: AreaType
    offsetFromCutoutFixture: Position
    boundingBox: BoundingBox

    ableToDropTips: bool | None = False
    ableToDropLabware: bool | None = False
    compatibleModuleTypes: CompatibleModules | None
    matingSurfaceUnitVector: UnitVector | None


class CutoutFixture(v4.CutoutFixture):
    fixtureGroup: List[str]


class LocationsV5(BaseModel):
    addressableAreas: List[AddressableArea]
    calibrationPoints: List[CalibrationPoint]
    cutouts: List[v4.Cutout]
    legacyFixtures: List[LegacyFixture]


class DeckDefinitionV5(DeckDefinition):

    schemaVersion: Literal[5]
    locations: LocationsV5
    cutoutFixtures: List[CutoutFixture]

    @validator("cutoutFixtures", each_item=True, allow_reuse=True)
    def validate_cutout_fixture_mounts(
        cls, fixture: CutoutFixture, values: Any
    ) -> CutoutFixture:
        locations = values.get("locations")
        assert isinstance(locations, LocationsV5)
        valid_aa_ids = set(aa.id for aa in locations.addressableAreas)

        for area_list in fixture.providesAddressableAreas.values():
            fixture_aa_ids = set(area for area in area_list)
            assert fixture_aa_ids.issubset(valid_aa_ids)
        return fixture
