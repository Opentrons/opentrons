"""Tests for `labware_offset_standardization`."""

from functools import lru_cache

import pytest

from opentrons_shared_data.deck import load
from opentrons_shared_data.deck.types import DeckDefinitionV6
from opentrons_shared_data.robot.types import RobotType

from opentrons.protocol_engine import labware_offset_standardization as subject
from opentrons.protocol_engine.types import (
    LabwareOffsetCreate,
    LabwareOffsetCreateInternal,
    LabwareOffsetLocationSequence,
    LabwareOffsetVector,
    LegacyLabwareOffsetCreate,
    LegacyLabwareOffsetLocation,
    ModuleModel,
    OnAddressableAreaOffsetLocationSequenceComponent,
    OnLabwareOffsetLocationSequenceComponent,
    OnModuleOffsetLocationSequenceComponent,
)
from opentrons.types import DeckSlotName


@lru_cache
def load_deck_from_cache() -> DeckDefinitionV6:
    """Get a deck from robot type."""
    return load("ot3_standard")


@pytest.mark.parametrize(
    ("location", "robot_type", "expected_modern_location", "expected_legacy_location"),
    [
        # Directly on a slot
        pytest.param(
            LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
            "OT-3 Standard",
            [
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="C2"
                )
            ],
            LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_C2),
            id="direct-slot-flex-ot2",
        ),
        pytest.param(
            LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_C2),
            "OT-3 Standard",
            [
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="C2"
                )
            ],
            LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_C2),
            id="direct-slot-flex-native",
        ),
        # On a module with no adapter
        pytest.param(
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            "OT-3 Standard",
            [
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            id="module-flex-native",
        ),
        pytest.param(
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_1,
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            "OT-3 Standard",
            [
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            id="module-flex-ot2",
        ),
        # On a module with no adapter, and specifically the module is a Thermocycler.
        # The Thermocycler is special because the deck definition splits it into two
        # fixtures. :(
        pytest.param(
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_B1,
                moduleModel=ModuleModel.THERMOCYCLER_MODULE_V2,
            ),
            "OT-3 Standard",
            [
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.THERMOCYCLER_MODULE_V2
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="thermocyclerModuleV2",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_B1,
                moduleModel=ModuleModel.THERMOCYCLER_MODULE_V2,
            ),
            id="tc-module-flex-native",
        ),
        # On a labware (or stack...) on a slot
        pytest.param(
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1, definitionUri="opentrons-test/foo/1"
            ),
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="D1"
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1, definitionUri="opentrons-test/foo/1"
            ),
            id="labware-slot-flex-native",
        ),
        pytest.param(
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_1, definitionUri="opentrons-test/foo/1"
            ),
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="D1"
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1, definitionUri="opentrons-test/foo/1"
            ),
            id="labware-slot-flex-ot2",
        ),
        # On an adapter on a module
        pytest.param(
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                definitionUri="opentrons-test/foo/1",
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                definitionUri="opentrons-test/foo/1",
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            id="labware-module-flex-native",
        ),
        pytest.param(
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_1,
                definitionUri="opentrons-test/foo/1",
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                definitionUri="opentrons-test/foo/1",
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            id="labware-module-flex-ot2",
        ),
    ],
)
def test_standardize_legacy_labware_offset(
    location: LegacyLabwareOffsetLocation,
    robot_type: RobotType,
    expected_modern_location: LabwareOffsetLocationSequence,
    expected_legacy_location: LegacyLabwareOffsetLocation,
) -> None:
    """It should convert deck slots in `LegacyLabwareOffsetCreate`s and go to the new format."""
    deck_def = load_deck_from_cache()
    original = LegacyLabwareOffsetCreate(
        definitionUri="opentrons-test/foo/1",
        location=location,
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    expected = LabwareOffsetCreateInternal(
        definitionUri="opentrons-test/foo/1",
        legacyLocation=expected_legacy_location,
        locationSequence=expected_modern_location,
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    assert (
        subject.standardize_labware_offset_create(original, robot_type, deck_def)
        == expected
    )


@pytest.mark.parametrize(
    ("location", "robot_type", "expected_modern_location", "expected_legacy_location"),
    [
        # Directly on a slot
        pytest.param(
            [
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="C2"
                )
            ],
            "OT-3 Standard",
            [
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="C2"
                )
            ],
            LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_C2),
            id="slot-direct-flex",
        ),
        # On a module with no adapter
        pytest.param(
            [
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            "OT-3 Standard",
            [
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            id="module-slot-flex",
        ),
        # On a labware  on a slot
        pytest.param(
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="D1"
                ),
            ],
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="D1"
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1, definitionUri="opentrons-test/foo/1"
            ),
            id="labware-slot-flex",
        ),
        # On an adapter on a module
        pytest.param(
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="temperatureModuleV2D1",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_D1,
                definitionUri="opentrons-test/foo/1",
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            id="labware-module-flex",
        ),
        # On a stack of labware
        pytest.param(
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/bar/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/baz/1"
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="A3",
                ),
            ],
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/bar/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/baz/1"
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="A3",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_A3,
                definitionUri="opentrons-test/foo/1",
            ),
            id="labware-stack-flex",
        ),
        # On a stack of labware on a module
        pytest.param(
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/bar/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/baz/1"
                ),
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="A1",
                ),
            ],
            "OT-3 Standard",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/foo/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/bar/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons-test/baz/1"
                ),
                OnModuleOffsetLocationSequenceComponent(
                    moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
                ),
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="A1",
                ),
            ],
            LegacyLabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_A1,
                definitionUri="opentrons-test/foo/1",
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            id="labware-stack-module-flex",
        ),
    ],
)
def test_standardize_modern_labware_offset(
    location: LabwareOffsetLocationSequence,
    robot_type: RobotType,
    expected_modern_location: LabwareOffsetLocationSequence,
    expected_legacy_location: LegacyLabwareOffsetLocation,
) -> None:
    """It should convert deck slots in `LabwareOffsetCreate`s and fill in the old format."""
    deck_def = load_deck_from_cache()
    original = LabwareOffsetCreate(
        definitionUri="opentrons-test/foo/1",
        locationSequence=location,
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    expected = LabwareOffsetCreateInternal(
        definitionUri="opentrons-test/foo/1",
        legacyLocation=expected_legacy_location,
        locationSequence=expected_modern_location,
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    assert (
        subject.standardize_labware_offset_create(original, robot_type, deck_def)
        == expected
    )
