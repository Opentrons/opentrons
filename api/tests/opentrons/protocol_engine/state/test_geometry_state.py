"""Test state getters for retrieving geometry views of state."""
import pytest
from mock import MagicMock

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import Point, DeckSlotName

from opentrons.protocol_engine import StateStore, errors
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.state import LabwareData
from opentrons.protocol_engine.state.labware import LabwareStore
from opentrons.protocol_engine.state.geometry import GeometryStore


@pytest.fixture
def mock_labware_store() -> MagicMock:
    return MagicMock(spec=LabwareStore)


@pytest.fixture
def geometry_store(
    mock_labware_store: MagicMock,
    standard_deck_def: DeckDefinitionV2,
) -> GeometryStore:
    return GeometryStore(
        labware_store=mock_labware_store,
        deck_definition=standard_deck_def,
    )


def test_get_deck_definition(
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should return the deck definition."""
    deck = store.geometry.get_deck_definition()

    assert deck == standard_deck_def


def test_get_slot_definition(
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should return a deck slot's definition."""
    slot = store.geometry.get_slot_definition(DeckSlotName.SLOT_6)

    assert slot["id"] == "6"
    assert slot == standard_deck_def["locations"]["orderedSlots"][5]


def test_get_slot_definition_raises_with_bad_slot_name(
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should raise a SlotDoesNotExistError if a bad slot name is given."""
    with pytest.raises(errors.SlotDoesNotExistError):
        # note: normally the typechecker should catch this, but clients may
        # not be using typechecking or our enums
        store.geometry.get_slot_definition(42)  # type: ignore[arg-type]


def test_get_slot_position(
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should get the absolute location of a deck slot's origin."""
    point = store.geometry.get_slot_position(DeckSlotName.SLOT_3)
    slot_pos = standard_deck_def["locations"]["orderedSlots"][2]["position"]

    assert point == Point(x=slot_pos[0], y=slot_pos[1], z=slot_pos[2])


def test_get_labware_highest_z(
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore,
) -> None:
    """It should get the absolute location of a labware's highest Z point."""
    labware_data = LabwareData(
        definition=well_plate_def,
        location=DeckSlotLocation(DeckSlotName.SLOT_3),
        calibration=(1, -2, 3)
    )

    mock_labware_store.state.get_labware_data_by_id.return_value = labware_data
    slot_pos = geometry_store.state.get_slot_position(DeckSlotName.SLOT_3)

    highest_z = geometry_store.state.get_labware_highest_z("labware-id")

    mock_labware_store.state.get_labware_data_by_id.assert_called_with(
        "labware-id"
    )
    assert highest_z == (
        labware_data.definition["dimensions"]["zDimension"] +
        slot_pos[2] +
        3
    )


def test_get_all_labware_highest_z(
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore,
) -> None:
    """It should get the highest Z amongst all labware."""
    plate_data = LabwareData(
        definition=well_plate_def,
        location=DeckSlotLocation(DeckSlotName.SLOT_3),
        calibration=(1, -2, 3)
    )
    reservoir_data = LabwareData(
        definition=reservoir_def,
        location=DeckSlotLocation(DeckSlotName.SLOT_4),
        calibration=(1, -2, 3)
    )

    def mock_get_lw_by_id(labware_id: str) -> LabwareData:
        if labware_id == "plate-id":
            return plate_data
        elif labware_id == "reservoir-id":
            return reservoir_data
        else:
            raise ValueError(f"unexpected labware {labware_id}")

    mock_labware_store.state.get_labware_data_by_id.side_effect = \
        mock_get_lw_by_id
    mock_labware_store.state.get_all_labware.return_value = [
        ("plate-id", plate_data),
        ("reservoir-id", reservoir_data),
    ]

    plate_z = geometry_store.state.get_labware_highest_z("plate-id")
    reservoir_z = geometry_store.state.get_labware_highest_z("reservoir-id")
    all_z = geometry_store.state.get_all_labware_highest_z()

    assert all_z == max(plate_z, reservoir_z)


def test_get_well_position(
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LabwareData(
        definition=well_plate_def,
        location=DeckSlotLocation(DeckSlotName.SLOT_3),
        calibration=(1, -2, 3)
    )
    well_def = well_plate_def["wells"]["B2"]

    mock_labware_store.state.get_labware_data_by_id.return_value = labware_data
    mock_labware_store.state.get_well_definition.return_value = well_def

    point = geometry_store.state.get_well_position("plate-id", "B2")
    slot_pos = standard_deck_def["locations"]["orderedSlots"][2]["position"]

    mock_labware_store.state.get_labware_data_by_id.assert_called_with(
        "plate-id"
    )
    mock_labware_store.state.get_well_definition.assert_called_with(
        "plate-id",
        "B2"
    )
    assert point == Point(
        x=slot_pos[0] + 1 + well_def["x"],
        y=slot_pos[1] - 2 + well_def["y"],
        z=slot_pos[2] + 3 + well_def["z"] + well_def["depth"],
    )
