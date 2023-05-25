"""Labware state store tests."""
import pytest
from datetime import datetime
from typing import Dict, Optional, cast, ContextManager, Any, Union
from contextlib import nullcontext as does_not_raise

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons_shared_data.pipette.dev_types import LabwareUri
from opentrons_shared_data.labware.labware_definition import Parameters
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName, Point, MountType

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    Dimensions,
    LabwareOffset,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    LoadedLabware,
    ModuleModel,
    ModuleLocation,
)
from opentrons.protocol_engine.state.move_types import EdgePathType
from opentrons.protocol_engine.state.labware import (
    LabwareState,
    LabwareView,
    LabwareLoadParams,
)


plate = LoadedLabware(
    id="plate-id",
    loadName="plate-load-name",
    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
    definitionUri="some-plate-uri",
    offsetId=None,
    displayName="Fancy Plate Name",
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
    deck_definition: Optional[DeckDefinitionV3] = None,
) -> LabwareView:
    """Get a labware view test subject."""
    state = LabwareState(
        labware_by_id=labware_by_id or {},
        labware_offsets_by_id=labware_offsets_by_id or {},
        definitions_by_uri=definitions_by_uri or {},
        deck_definition=deck_definition or cast(DeckDefinitionV3, {"fake": True}),
    )

    return LabwareView(state=state)


def test_get_labware_data_bad_id() -> None:
    """get_labware_data_by_id should raise if labware ID doesn't exist."""
    subject = get_labware_view()

    with pytest.raises(errors.LabwareNotLoadedError):
        subject.get("asdfghjkl")


def test_get_labware_data_by_id() -> None:
    """It should retrieve labware data from the state."""
    subject = get_labware_view(labware_by_id={"plate-id": plate})

    assert subject.get("plate-id") == plate


def test_get_id_by_module() -> None:
    """Should return the labware id associated to the module."""
    subject = get_labware_view(
        labware_by_id={
            "labware-id": LoadedLabware(
                id="labware-id",
                loadName="test",
                definitionUri="test-uri",
                location=ModuleLocation(moduleId="module-id"),
            )
        }
    )
    assert subject.get_id_by_module(module_id="module-id") == "labware-id"


def test_get_id_by_module_raises_error() -> None:
    """Should raise error that labware not found."""
    subject = get_labware_view(
        labware_by_id={
            "labware-id": LoadedLabware(
                id="labware-id",
                loadName="test",
                definitionUri="test-uri",
                location=ModuleLocation(moduleId="module-id"),
            )
        }
    )
    with pytest.raises(errors.exceptions.LabwareNotLoadedOnModuleError):
        assert subject.get_id_by_module(module_id="no-module-id")


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


@pytest.mark.parametrize(
    argnames=["namespace", "version"],
    argvalues=[("world", 123), (None, 123), ("world", None), (None, None)],
)
def test_find_custom_labware_params(
    namespace: Optional[str], version: Optional[int]
) -> None:
    """It should find the missing (if any) load labware parameters."""
    labware_def = LabwareDefinition.construct(  # type: ignore[call-arg]
        parameters=Parameters.construct(loadName="hello"),  # type: ignore[call-arg]
        namespace="world",
        version=123,
    )
    standard_def = LabwareDefinition.construct(  # type: ignore[call-arg]
        parameters=Parameters.construct(loadName="goodbye"),  # type: ignore[call-arg]
        namespace="opentrons",
        version=456,
    )

    subject = get_labware_view(
        definitions_by_uri={
            "some-labware-uri": labware_def,
            "some-standard-uri": standard_def,
        },
    )

    result = subject.find_custom_labware_load_params()

    assert result == [
        LabwareLoadParams(load_name="hello", namespace="world", version=123)
    ]


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


def test_get_well_definition_bad_name(well_plate_def: LabwareDefinition) -> None:
    """get_well_definition should raise if well name doesn't exist."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    with pytest.raises(errors.WellDoesNotExistError):
        subject.get_well_definition(labware_id="plate-id", well_name="foobar")


def test_get_well_definition(well_plate_def: LabwareDefinition) -> None:
    """It should return a well definition by well name."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    expected_well_def = well_plate_def.wells["B2"]
    result = subject.get_well_definition(labware_id="plate-id", well_name="B2")

    assert result == expected_well_def


def test_get_well_definition_get_first(well_plate_def: LabwareDefinition) -> None:
    """It should return the first well definition if no given well name."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )

    expected_well_def = well_plate_def.wells["A1"]
    result = subject.get_well_definition(labware_id="plate-id", well_name=None)

    assert result == expected_well_def


def test_get_well_size_circular(well_plate_def: LabwareDefinition) -> None:
    """It should return the well dimensions of a circular well."""
    subject = get_labware_view(
        labware_by_id={"plate-id": plate},
        definitions_by_uri={"some-plate-uri": well_plate_def},
    )
    expected_well_def = well_plate_def.wells["A2"]
    expected_size = (
        expected_well_def.diameter,
        expected_well_def.diameter,
        expected_well_def.depth,
    )

    result = subject.get_well_size(labware_id="plate-id", well_name="A2")

    assert result == expected_size


def test_get_well_size_rectangular(reservoir_def: LabwareDefinition) -> None:
    """It should return the well dimensions of a rectangular well."""
    subject = get_labware_view(
        labware_by_id={"reservoir-id": reservoir},
        definitions_by_uri={"some-reservoir-uri": reservoir_def},
    )
    expected_well_def = reservoir_def.wells["A2"]
    expected_size = (
        expected_well_def.xDimension,
        expected_well_def.yDimension,
        expected_well_def.depth,
    )

    result = subject.get_well_size(labware_id="reservoir-id", well_name="A2")

    assert result == expected_size


def test_labware_has_well(falcon_tuberack_def: LabwareDefinition) -> None:
    """It should return a list of wells from definition."""
    subject = get_labware_view(
        labware_by_id={"tube-rack-id": tube_rack},
        definitions_by_uri={"some-tube-rack-uri": falcon_tuberack_def},
    )

    result = subject.validate_liquid_allowed_in_labware(
        labware_id="tube-rack-id", wells={"A1": 30, "B1": 100}
    )
    assert result == ["A1", "B1"]

    with pytest.raises(errors.WellDoesNotExistError):
        subject.validate_liquid_allowed_in_labware(
            labware_id="tube-rack-id", wells={"AA": 30}
        )

    with pytest.raises(errors.LabwareNotLoadedError):
        subject.validate_liquid_allowed_in_labware(labware_id="no-id", wells={"A1": 30})


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

    length = subject.get_tip_length("tip-rack-id", 12.3)
    assert length == tip_rack_def.parameters.tipLength - 12.3  # type: ignore[operator]


def test_get_tip_drop_z_offset() -> None:
    """It should get a tip drop z offset by scaling the tip length."""
    tip_rack_def = LabwareDefinition.construct(  # type: ignore[call-arg]
        parameters=Parameters.construct(  # type: ignore[call-arg]
            tipLength=100,
        )
    )

    subject = get_labware_view(
        labware_by_id={"tip-rack-id": tip_rack},
        definitions_by_uri={"some-tip-rack-uri": tip_rack_def},
    )

    result = subject.get_tip_drop_z_offset(
        labware_id="tip-rack-id", length_scale=0.5, additional_offset=-0.123
    )

    assert result == -50.123


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


def test_get_labware_uri_from_full_definition(tip_rack_def: LabwareDefinition) -> None:
    """It should be able to construct a URI given a full definition."""
    subject = get_labware_view()
    result = subject.get_uri_from_definition(tip_rack_def)
    assert result == "opentrons/opentrons_96_tiprack_300ul/1"


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


def test_get_default_magnet_height(
    magdeck_well_plate_def: LabwareDefinition,
) -> None:
    """Should get get the default value for magnetic height."""
    well_plate = LoadedLabware(
        id="well-plate-id",
        loadName="load-name",
        location=ModuleLocation(moduleId="module-id"),
        definitionUri="well-plate-uri",
        offsetId=None,
    )

    subject = get_labware_view(
        labware_by_id={"well-plate-id": well_plate},
        definitions_by_uri={"well-plate-uri": magdeck_well_plate_def},
    )

    assert subject.get_default_magnet_height(module_id="module-id", offset=2) == 12.0


def test_get_deck_definition(ot2_standard_deck_def: DeckDefinitionV3) -> None:
    """It should get the deck definition from the state."""
    subject = get_labware_view(deck_definition=ot2_standard_deck_def)

    assert subject.get_deck_definition() == ot2_standard_deck_def


def test_get_slot_definition(ot2_standard_deck_def: DeckDefinitionV3) -> None:
    """It should return a deck slot's definition."""
    subject = get_labware_view(deck_definition=ot2_standard_deck_def)

    result = subject.get_slot_definition(DeckSlotName.SLOT_6)

    assert result["id"] == "6"
    assert result == ot2_standard_deck_def["locations"]["orderedSlots"][5]


def test_get_slot_definition_raises_with_bad_slot_name(
    ot2_standard_deck_def: DeckDefinitionV3,
) -> None:
    """It should raise a SlotDoesNotExistError if a bad slot name is given."""
    subject = get_labware_view(deck_definition=ot2_standard_deck_def)

    with pytest.raises(errors.SlotDoesNotExistError):
        # note: normally the typechecker should catch this, but clients may
        # not be using typechecking or our enums
        subject.get_slot_definition(42)  # type: ignore[arg-type]


def test_get_slot_position(ot2_standard_deck_def: DeckDefinitionV3) -> None:
    """It should get the absolute location of a deck slot's origin."""
    subject = get_labware_view(deck_definition=ot2_standard_deck_def)

    slot_pos = ot2_standard_deck_def["locations"]["orderedSlots"][2]["position"]
    result = subject.get_slot_position(DeckSlotName.SLOT_3)

    assert result == Point(x=slot_pos[0], y=slot_pos[1], z=slot_pos[2])


def test_get_slot_center_position(ot2_standard_deck_def: DeckDefinitionV3) -> None:
    """It should get the absolute location of a deck slot's center."""
    subject = get_labware_view(deck_definition=ot2_standard_deck_def)

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

    with pytest.raises(errors.LabwareNotLoadedError):
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


def test_get_display_name() -> None:
    """It should get a labware's user-specified display name."""
    subject = get_labware_view(
        labware_by_id={
            "plate_with_display_name": plate,
            "reservoir_without_display_name": reservoir,
        },
    )

    assert subject.get_display_name("plate_with_display_name") == "Fancy Plate Name"
    assert subject.get_display_name("reservoir_without_display_name") is None


def test_get_fixed_trash_id() -> None:
    """It should return the ID of the labware loaded into the fixed trash slot."""
    subject = get_labware_view(
        labware_by_id={
            "abc123": LoadedLabware(
                id="abc123",
                loadName="trash-load-name",
                location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
                definitionUri="trash-definition-uri",
                offsetId=None,
                displayName=None,
            )
        },
    )

    assert subject.get_fixed_trash_id() == "abc123"

    subject = get_labware_view(
        labware_by_id={
            "abc123": LoadedLabware(
                id="abc123",
                loadName="trash-load-name",
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
                definitionUri="trash-definition-uri",
                offsetId=None,
                displayName=None,
            )
        },
    )

    with pytest.raises(errors.LabwareNotLoadedError):
        subject.get_fixed_trash_id()


@pytest.mark.parametrize(
    argnames=["location", "expected_raise"],
    argvalues=[
        (
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            pytest.raises(errors.LocationIsOccupiedError),
        ),
        (
            ModuleLocation(moduleId="module-id"),
            pytest.raises(errors.LocationIsOccupiedError),
        ),
        (DeckSlotLocation(slotName=DeckSlotName.SLOT_2), does_not_raise()),
        (ModuleLocation(moduleId="non-matching-id"), does_not_raise()),
    ],
)
def test_raise_if_labware_in_location(
    location: Union[DeckSlotLocation, ModuleLocation],
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if there is labware in specified location."""
    subject = get_labware_view(
        labware_by_id={
            "abc123": LoadedLabware(
                id="abc123",
                loadName="labware-1",
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
                definitionUri="labware-definition-uri",
                offsetId=None,
                displayName=None,
            ),
            "xyz456": LoadedLabware(
                id="xyz456",
                loadName="labware-2",
                location=ModuleLocation(moduleId="module-id"),
                definitionUri="labware-definition-uri",
                offsetId=None,
                displayName=None,
            ),
        }
    )
    with expected_raise:
        subject.raise_if_labware_in_location(location=location)


def test_get_calibration_coordinates() -> None:
    """Should return critical point and coordinates."""
    slot_definitions = {
        "locations": {
            "orderedSlots": [
                {
                    "id": "1",
                    "position": [2, 2, 0.0],
                    "boundingBox": {
                        "xDimension": 4.0,
                        "yDimension": 6.0,
                        "zDimension": 0,
                    },
                    "displayName": "Slot 1",
                }
            ]
        }
    }

    subject = get_labware_view(deck_definition=cast(DeckDefinitionV3, slot_definitions))

    result = subject.get_calibration_coordinates(offset=Point(y=1, z=2))

    assert result == Point(x=4, y=6, z=2)


def test_get_by_slot() -> None:
    """It should get the labware in a given slot."""
    labware_1 = LoadedLabware.construct(  # type: ignore[call-arg]
        id="1", location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    labware_2 = LoadedLabware.construct(  # type: ignore[call-arg]
        id="2", location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2)
    )
    labware_3 = LoadedLabware.construct(  # type: ignore[call-arg]
        id="3", location=ModuleLocation(moduleId="cool-module")
    )

    subject = get_labware_view(
        labware_by_id={"1": labware_1, "2": labware_2, "3": labware_3}
    )

    assert subject.get_by_slot(DeckSlotName.SLOT_1, {"1", "2"}) == labware_1
    assert subject.get_by_slot(DeckSlotName.SLOT_2, {"1", "2"}) == labware_2
    assert subject.get_by_slot(DeckSlotName.SLOT_3, {"1", "2"}) is None


def test_get_by_slot_prefers_later() -> None:
    """It should get the labware in a slot, preferring later items if locations match."""
    labware_1 = LoadedLabware.construct(  # type: ignore[call-arg]
        id="1", location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    labware_1_again = LoadedLabware.construct(  # type: ignore[call-arg]
        id="1-again", location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )

    subject = get_labware_view(
        labware_by_id={"1": labware_1, "1-again": labware_1_again}
    )

    assert subject.get_by_slot(DeckSlotName.SLOT_1, {"1", "1-again"}) == labware_1_again


def test_get_by_slot_filter_ids() -> None:
    """It should filter labwares in the same slot using IDs."""
    labware_1 = LoadedLabware.construct(  # type: ignore[call-arg]
        id="1", location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    labware_1_again = LoadedLabware.construct(  # type: ignore[call-arg]
        id="1-again", location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )

    subject = get_labware_view(
        labware_by_id={"1": labware_1, "1-again": labware_1_again}
    )

    assert subject.get_by_slot(DeckSlotName.SLOT_1, {"1"}) == labware_1


@pytest.mark.parametrize(
    ["well_name", "mount", "labware_slot", "next_to_module", "expected_result"],
    [
        ("abc", MountType.RIGHT, DeckSlotName.SLOT_3, False, EdgePathType.LEFT),
        ("abc", MountType.RIGHT, DeckSlotName.SLOT_1, True, EdgePathType.LEFT),
        ("pqr", MountType.LEFT, DeckSlotName.SLOT_3, True, EdgePathType.RIGHT),
        ("pqr", MountType.LEFT, DeckSlotName.SLOT_3, False, EdgePathType.DEFAULT),
        ("pqr", MountType.RIGHT, DeckSlotName.SLOT_3, True, EdgePathType.DEFAULT),
        ("def", MountType.LEFT, DeckSlotName.SLOT_3, True, EdgePathType.DEFAULT),
    ],
)
def test_get_edge_path_type(
    well_name: str,
    mount: MountType,
    labware_slot: DeckSlotName,
    next_to_module: bool,
    expected_result: EdgePathType,
) -> None:
    """It should get the proper edge path type based on well name, mount, and labware position."""
    labware = LoadedLabware(
        id="tip-rack-id",
        loadName="load-name",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        definitionUri="some-labware-uri",
        offsetId=None,
    )

    labware_def = LabwareDefinition.construct(  # type: ignore[call-arg]
        ordering=[["abc", "def"], ["ghi", "jkl"], ["mno", "pqr"]]
    )

    subject = get_labware_view(
        labware_by_id={"labware-id": labware},
        definitions_by_uri={
            "some-labware-uri": labware_def,
        },
    )

    result = subject.get_edge_path_type(
        "labware-id", well_name, mount, labware_slot, next_to_module
    )

    assert result == expected_result


def test_get_all_labware_definition(
    tip_rack_def: LabwareDefinition, falcon_tuberack_def: LabwareDefinition
) -> None:
    """It should return the loaded labware definition list."""
    subject = get_labware_view(
        labware_by_id={
            "labware-id": LoadedLabware(
                id="labware-id",
                loadName="test",
                definitionUri="opentrons_96_tiprack_300ul",
                location=ModuleLocation(moduleId="module-id"),
            )
        },
        definitions_by_uri={
            "opentrons_96_tiprack_300ul": tip_rack_def,
            "falcon-definition": falcon_tuberack_def,
        },
    )

    result = subject.get_loaded_labware_definitions()

    assert result == [tip_rack_def]


def test_get_all_labware_definition_empty() -> None:
    """It should return an empty list."""
    subject = get_labware_view(
        labware_by_id={},
    )

    result = subject.get_loaded_labware_definitions()

    assert result == []
