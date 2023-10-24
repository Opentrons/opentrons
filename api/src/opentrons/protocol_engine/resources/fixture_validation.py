"""Validation file for fixtures and addressable area reference checking functions."""

from typing import List

from opentrons_shared_data.deck.deck_definitions import Locations
from opentrons.protocols.models import CutoutFixture
from opentrons.hardware_control.modules.types import ModuleModel, ModuleType


def validate_fixture_id(fixtureList: List[CutoutFixture], load_name: str) -> bool:
    """Check that the loaded fixture has an existing definition."""
    for fixture in fixtureList:
        if fixture.id == load_name:
            return True
    return False


def validate_fixture_location_is_allowed(fixture: CutoutFixture, location: str) -> bool:
    """Validate that the fixture is allowed to load into the provided location according to the deck definitions."""
    return location in fixture.mayMountTo


def validate_is_wastechute(load_name: str) -> bool:
    """Check if a fixture is a Waste Chute."""
    return (
        load_name == "wasteChuteRightAdapterCovered"
        or load_name == "wasteChuteRightAdapterNoCover"
        or load_name == "stagingAreaSlotWithWasteChuteRightAdapterCovered"
        or load_name == "stagingAreaSlotWithWasteChuteRightAdapterNoCover"
    )


def validate_module_is_compatible_with_fixture(
    locations: Locations, fixture: CutoutFixture, module: ModuleModel
) -> bool:
    """Validate that the fixture allows the loading of a specified module."""
    module_name = ModuleType.from_model(module).name
    for key in fixture.providesAddressableAreas.keys():
        for area in fixture.providesAddressableAreas[key]:
            for l_area in locations.addressableAreas:
                if l_area.id == area:
                    if l_area.compatibleModuleTypes is None:
                        return False
                    elif module_name in l_area.compatibleModuleTypes:
                        return True
    return False


def validate_fixture_allows_drop_tip(
    locations: Locations, fixture: CutoutFixture
) -> bool:
    """Validate that the fixture allows tips to be dropped in it's addressable areas."""
    for key in fixture.providesAddressableAreas.keys():
        for area in fixture.providesAddressableAreas[key]:
            for l_area in locations.addressableAreas:
                if l_area.id == area and l_area.ableToDropTips:
                    return True
    return False


def validate_fixture_allows_drop_labware(
    locations: Locations, fixture: CutoutFixture
) -> bool:
    """Validate that the fixture allows labware to be dropped in it's addressable areas."""
    for key in fixture.providesAddressableAreas.keys():
        for area in fixture.providesAddressableAreas[key]:
            for l_area in locations.addressableAreas:
                if l_area.id == area and l_area.ableToDropLabware:
                    return True
    return False
