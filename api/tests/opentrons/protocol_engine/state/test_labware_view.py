"""Labware state store tests."""
import pytest
from datetime import datetime
from typing import Dict, Optional, cast

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.pipette.dev_types import LabwareUri
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName, Point

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    Dimensions,
    LabwareOffset,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    LoadedLabware,
    ModuleModel,
)

from opentrons.protocol_engine.state.labware import LabwareState, LabwareView


plate = LoadedLabware(
    id="plate-id",
    loadName="plate-load-name",
    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
    definitionUri="some-plate-uri",
    offsetId=None,
)

reservoir = LoadedLabware(
    id="reservoir-id",
    loadName="reservoir-load-name",
    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
    definitionUri="some-reservoir-uri",
    offsetId=None,
)

tube_rack = LoadedLabware(
    id="tube-rack-id",
    loadName="tube-rack-load-name",
    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
    definitionUri="some-tube-rack-uri",
    offsetId=None,
)

tip_rack = LoadedLabware(
    id="tip-rack-id",
    loadName="tip-rack-load-name",
    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
    definitionUri="some-tip-rack-uri",
    offsetId=None,
)


def get_labware_view(
    labware_by_id: Optional[Dict[str, LoadedLabware]] = None,
    labware_offsets_by_id: Optional[Dict[str, LabwareOffset]] = None,
    definitions_by_uri: Optional[Dict[str, LabwareDefinition]] = None,
    deck_definition: Optional[DeckDefinitionV2] = None,
) -> LabwareView:
    """Get a labware view test subject."""
    state = LabwareState(
        labware_by_id=labware_by_id or {},
        labware_offsets_by_id=labware_offsets_by_id or {},
        definitions_by_uri=definitions_by_uri or {},
        deck_definition=deck_definition or cast(DeckDefinitionV2, {"fake": True}),
    )

    return LabwareView(state=state)


def test_get_labware_data_bad_id() -> None:
    """get_labware_data_by_id should raise if labware ID doesn't exist."""
    subject = get_labware_view()

    with pytest.raises(errors.LabwareDoesNotExistError):
        subject.get("asdfghjkl")


def test_get_labware_data_by_id() -> None:
    """It should retrieve labware data from the state."""
    subject = get_labware_view(labware_by_id={"plate-id": plate})

    assert subject.get("plate-id") == plate


def test_get_labware_definition(well_plate_def: LabwareDefinition) -> None:
    """It should get a labware's definition from the state."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    assert subject.get_definition("plate-id") == well_plate_def


def test_get_labware_definition_bad_id() -> None:
    """get_labware_definition should raise if labware definition doesn't exist."""
    subject = get_labware_view()

    with pytest.raises(errors.LabwareDefinitionDoesNotExistError):
        subject.get_definition_by_uri(cast(LabwareUri, "not-a-uri"))


def test_get_all_labware(
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
) -> None:
    """It should return all labware."""
    subject = get_labware_view(
        labware_by_id={
            "plate-id": plate,
            "reservoir-id": reservoir,
        }
    )

    all_labware = subject.get_all()

    assert all_labware == [plate, reservoir]


def test_get_labware_location() -> None:
    """It should return labware location."""
    subject = get_labware_view(labware_by_id={"plate-id": plate})

    result = subject.get_location("plate-id")

    assert result == DeckSlotLocation(slotName=DeckSlotName.SLOT_1)


def test_get_has_quirk(
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
) -> None:
    """It should return whether a labware by ID has a given quirk."""
    subject = get_labware_view(
        labware_by_id={
            "plate-id": plate,
            "reservoir-id": reservoir,
        },
        definitions_by_uri={
            "some-plate-uri": well_plate_def,
            "some-reservoir-uri": reservoir_def,
        },
    )

    well_plate_has_center_quirk = subject.get_has_quirk(
        labware_id="plate-id",
        quirk="centerMultichannelOnWells",
    )

    reservoir_has_center_quirk = subject.get_has_quirk(
        labware_id="reservoir-id",
        quirk="centerMultichannelOnWells",
    )

    assert well_plate_has_center_quirk is False
    assert reservoir_has_center_quirk is True


def test_quirks(
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
) -> None:
    """It should return a labware's quirks."""
    subject = get_labware_view(
        labware_by_id={
            "plate-id": plate,
            "reservoir-id": reservoir,
        },
        definitions_by_uri={
            "some-plate-uri": well_plate_def,
            "some-reservoir-uri": reservoir_def,
        },
    )

    well_plate_quirks = subject.get_quirks("plate-id")
    reservoir_quirks = subject.get_quirks("reservoir-id")

    assert well_plate_quirks == []
    assert reservoir_quirks == ["centerMultichannelOnWells", "touchTipDisabled"]


def test_get_well_definition_bad_id(well_plate_def: LabwareDefinition) -> None:
    """get_well_definition should raise if well name doesn't exist."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    with pytest.raises(errors.WellDoesNotExistError):
        subject.get_well_definition(labware_id="plate-id", well_name="foobar")


def test_get_well_definition(well_plate_def: LabwareDefinition) -> None:
    """It should return a well definition by well ID."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    expected_well_def = well_plate_def.wells["B2"]
    result = subject.get_well_definition(labware_id="plate-id", well_name="B2")

    assert result == expected_well_def


def test_get_wells(falcon_tuberack_def: LabwareDefinition) -> None:
    """It should return a list of wells from definition."""
    subject = get_labware_view(
        labware_by_id={"tube-rack-id": tube_rack},
        definitions_by_uri={"some-tube-rack-uri": falcon_tuberack_def},
    )

    expected_wells = ["A1", "B1", "A2", "B2", "A3", "B3"]
    result = subject.get_wells(labware_id="tube-rack-id")
    assert result == expected_wells


def test_get_well_columns(falcon_tuberack_def: LabwareDefinition) -> None:
    """It should return wells as dict of list of columns."""
    subject = get_labware_view(
        labware_by_id={"tube-rack-id": tube_rack},
        definitions_by_uri={"some-tube-rack-uri": falcon_tuberack_def},
    )

    expected_columns = {"1": ["A1", "B1"], "2": ["A2", "B2"], "3": ["A3", "B3"]}
    result = subject.get_well_columns(labware_id="tube-rack-id")
    assert result == expected_columns


def test_get_well_rows(falcon_tuberack_def: LabwareDefinition) -> None:
    """It should return wells as dict of list of rows."""
    subject = get_labware_view(
        labware_by_id={"tube-rack-id": tube_rack},
        definitions_by_uri={"some-tube-rack-uri": falcon_tuberack_def},
    )

    expected_rows = {"A": ["A1", "A2", "A3"], "B": ["B1", "B2", "B3"]}
    result = subject.get_well_rows(labware_id="tube-rack-id")
    assert result == expected_rows


def test_get_tip_length_raises_with_non_tip_rack(
    well_plate_def: LabwareDefinition,
) -> None:
    """It should raise if you try to get the tip length of a regular labware."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    with pytest.raises(errors.LabwareIsNotTipRackError):
        subject.get_tip_length("plate-id")


def test_get_tip_length_gets_length_from_definition(
    tip_rack_def: LabwareDefinition,
) -> None:
    """It should return the tip length from the definition."""
    subject = get_labware_view(
        labware_by_id={"tip-rack-id": tip_rack},
        definitions_by_uri={"some-tip-rack-uri": tip_rack_def},
    )

    length = subject.get_tip_length("tip-rack-id")
    assert length == tip_rack_def.parameters.tipLength


def test_get_labware_uri_from_definition(tip_rack_def: LabwareDefinition) -> None:
    """It should return the labware's definition URI."""
    tip_rack = LoadedLabware(
        id="tip-rack-id",
        loadName="tip-rack-load-name",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        definitionUri="some-tip-rack-uri",
        offsetId=None,
    )

    subject = get_labware_view(
        labware_by_id={"tip-rack-id": tip_rack},
        definitions_by_uri={"some-tip-rack-uri": tip_rack_def},
    )

    result = subject.get_definition_uri(labware_id="tip-rack-id")
    assert result == "some-tip-rack-uri"


def test_is_tiprack(
    tip_rack_def: LabwareDefinition, reservoir_def: LabwareDefinition
) -> None:
    """It should determine if labware is a tip rack."""
    subject = get_labware_view(
        labware_by_id={
            "tip-rack-id": tip_rack,
            "reservoir-id": reservoir,
        },
        definitions_by_uri={
            "some-tip-rack-uri": tip_rack_def,
            "some-reservoir-uri": reservoir_def,
        },
    )

    assert subject.is_tiprack(labware_id="tip-rack-id") is True
    assert subject.is_tiprack(labware_id="reservoir-id") is False


def test_get_load_name(reservoir_def: LabwareDefinition) -> None:
    """It should return the load name."""
    subject = get_labware_view(
        labware_by_id={"reservoir-id": reservoir},
        definitions_by_uri={"some-reservoir-uri": reservoir_def},
    )

    result = subject.get_load_name("reservoir-id")

    assert result == reservoir_def.parameters.loadName


def test_get_dimensions(well_plate_def: LabwareDefinition) -> None:
    """It should compute the dimensions of a labware."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    result = subject.get_dimensions(labware_id="plate-id")

    assert result == Dimensions(
        x=well_plate_def.dimensions.xDimension,
        y=well_plate_def.dimensions.yDimension,
        z=well_plate_def.dimensions.zDimension,
    )


def test_get_deck_definition(standard_deck_def: DeckDefinitionV2) -> None:
    """It should get the deck definition from the state."""
    subject = get_labware_view(deck_definition=standard_deck_def)

    assert subject.get_deck_definition() == standard_deck_def


def test_get_slot_definition(standard_deck_def: DeckDefinitionV2) -> None:
    """It should return a deck slot's definition."""
    subject = get_labware_view(deck_definition=standard_deck_def)

    result = subject.get_slot_definition(DeckSlotName.SLOT_6)

    assert result["id"] == "6"
    assert result == standard_deck_def["locations"]["orderedSlots"][5]


def test_get_slot_definition_raises_with_bad_slot_name(
    standard_deck_def: DeckDefinitionV2,
) -> None:
    """It should raise a SlotDoesNotExistError if a bad slot name is given."""
    subject = get_labware_view(deck_definition=standard_deck_def)

    with pytest.raises(errors.SlotDoesNotExistError):
        # note: normally the typechecker should catch this, but clients may
        # not be using typechecking or our enums
        subject.get_slot_definition(42)  # type: ignore[arg-type]


def test_get_slot_position(standard_deck_def: DeckDefinitionV2) -> None:
    """It should get the absolute location of a deck slot's origin."""
    subject = get_labware_view(deck_definition=standard_deck_def)

    slot_pos = standard_deck_def["locations"]["orderedSlots"][2]["position"]
    result = subject.get_slot_position(DeckSlotName.SLOT_3)

    assert result == Point(x=slot_pos[0], y=slot_pos[1], z=slot_pos[2])


def test_get_slot_center_position(standard_deck_def: DeckDefinitionV2) -> None:
    """It should get the absolute location of a deck slot's center."""
    subject = get_labware_view(deck_definition=standard_deck_def)

    expected_center = Point(x=196.5, y=43.0, z=0.0)
    result = subject.get_slot_center_position(DeckSlotName.SLOT_2)
    assert result == expected_center


def test_get_labware_offset_vector() -> None:
    """It should get a labware's offset vector."""
    labware_without_offset = LoadedLabware(
        id="without-offset-labware-id",
        loadName="labware-load-name",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        definitionUri="some-labware-uri",
        offsetId=None,
    )

    labware_with_offset = LoadedLabware(
        id="with-offset-labware-id",
        loadName="labware-load-name",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        definitionUri="some-labware-uri",
        offsetId="offset-id",
    )

    offset_vector = LabwareOffsetVector(x=1, y=2, z=3)
    offset = LabwareOffset(
        id="offset-id",
        createdAt=datetime(year=2021, month=1, day=2),
        definitionUri="some-labware-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=offset_vector,
    )

    subject = get_labware_view(
        labware_by_id={
            labware_without_offset.id: labware_without_offset,
            labware_with_offset.id: labware_with_offset,
        },
        labware_offsets_by_id={"offset-id": offset},
    )

    assert subject.get_labware_offset_vector(labware_with_offset.id) == offset.vector

    assert subject.get_labware_offset_vector(
        labware_without_offset.id
    ) == LabwareOffsetVector(x=0, y=0, z=0)

    with pytest.raises(errors.LabwareDoesNotExistError):
        subject.get_labware_offset_vector("wrong-labware-id")


def test_get_labware_offset() -> None:
    """It should return the requested labware offset, if it exists."""
    offset_a = LabwareOffset(
        id="id-a",
        createdAt=datetime(year=2021, month=1, day=1),
        definitionUri="uri-a",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=1, z=1),
    )

    offset_b = LabwareOffset(
        id="id-b",
        createdAt=datetime(year=2022, month=2, day=2),
        definitionUri="uri-b",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_2),
        vector=LabwareOffsetVector(x=2, y=2, z=2),
    )

    subject = get_labware_view(
        labware_offsets_by_id={"id-a": offset_a, "id-b": offset_b}
    )

    assert subject.get_labware_offset("id-a") == offset_a
    assert subject.get_labware_offset("id-b") == offset_b
    with pytest.raises(errors.LabwareOffsetDoesNotExistError):
        subject.get_labware_offset("wrong-labware-offset-id")


def test_get_labware_offsets() -> None:
    """It should return a list of all labware offsets, in order."""
    offset_a = LabwareOffset(
        id="id-a",
        createdAt=datetime(year=2021, month=1, day=1),
        definitionUri="uri-a",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=1, z=1),
    )

    offset_b = LabwareOffset(
        id="id-b",
        createdAt=datetime(year=2022, month=2, day=2),
        definitionUri="uri-b",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_2),
        vector=LabwareOffsetVector(x=2, y=2, z=2),
    )

    empty_subject = get_labware_view()
    assert empty_subject.get_labware_offsets() == []

    filled_subject_a_before_b = get_labware_view(
        labware_offsets_by_id={"id-a": offset_a, "id-b": offset_b}
    )
    assert filled_subject_a_before_b.get_labware_offsets() == [offset_a, offset_b]

    filled_subject_b_before_a = get_labware_view(
        labware_offsets_by_id={"id-b": offset_b, "id-a": offset_a}
    )
    assert filled_subject_b_before_a.get_labware_offsets() == [offset_b, offset_a]


def test_find_applicable_labware_offset() -> None:
    """It should return the most recent offset with matching URI and location."""
    offset_1 = LabwareOffset(
        id="id-1",
        createdAt=datetime(year=2021, month=1, day=1),
        definitionUri="definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=1, z=1),
    )

    # Same definitionUri and location; different id, createdAt, and offset.
    offset_2 = LabwareOffset(
        id="id-2",
        createdAt=datetime(year=2022, month=2, day=2),
        definitionUri="definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=2, y=2, z=2),
    )

    offset_3 = LabwareOffset(
        id="id-3",
        createdAt=datetime(year=2023, month=3, day=3),
        definitionUri="on-module-definition-uri",
        location=LabwareOffsetLocation(
            slotName=DeckSlotName.SLOT_1,
            moduleModel=ModuleModel.TEMPERATURE_MODULE_V1,
        ),
        vector=LabwareOffsetVector(x=3, y=3, z=3),
    )

    subject = get_labware_view(
        # Simulate offset_2 having been added after offset_1.
        labware_offsets_by_id={"id-1": offset_1, "id-2": offset_2, "id-3": offset_3}
    )

    # Matching both definitionURI and location. Should return 2nd (most recent) offset.
    assert (
        subject.find_applicable_labware_offset(
            definition_uri="definition-uri",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        )
        == offset_2
    )

    assert (
        subject.find_applicable_labware_offset(
            definition_uri="on-module-definition-uri",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_1,
                moduleModel=ModuleModel.TEMPERATURE_MODULE_V1,
            ),
        )
        == offset_3
    )

    # Doesn't match anything, since definitionUri is different.
    assert (
        subject.find_applicable_labware_offset(
            definition_uri="different-definition-uri",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        )
        is None
    )

    # Doesn't match anything, since location is different.
    assert (
        subject.find_applicable_labware_offset(
            definition_uri="different-definition-uri",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_2),
        )
        is None
    )
