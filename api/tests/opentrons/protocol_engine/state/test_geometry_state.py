"""Test state getters for retrieving geometry views of state."""
import pytest
from mock import MagicMock
from typing import cast

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware.dev_types import LabwareDefinition, WellDefinition
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.geometry.deck import FIXED_TRASH_ID
from opentrons.types import Point, DeckSlotName

from opentrons.protocol_engine import StateStore, errors
from opentrons.protocol_engine.types import DeckSlotLocation, WellLocation, WellOrigin
from opentrons.protocol_engine.state import LabwareData
from opentrons.protocol_engine.state.labware import LabwareStore
from opentrons.protocol_engine.state.geometry import GeometryStore


@pytest.fixture
def mock_labware_store() -> MagicMock:
    """Get a mock in the shape of a LabwareStore."""
    return MagicMock(spec=LabwareStore)


@pytest.fixture
def geometry_store(
    mock_labware_store: MagicMock,
    standard_deck_def: DeckDefinitionV2,
) -> GeometryStore:
    """Get a GeometryStore with its store dependencies mocked out."""
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
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
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
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3)
    )
    reservoir_data = LabwareData(
        definition=reservoir_def,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
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
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3)
    )
    well_def = well_plate_def["wells"]["B2"]
    slot_pos = standard_deck_def["locations"]["orderedSlots"][2]["position"]

    mock_labware_store.state.get_labware_data_by_id.return_value = labware_data
    mock_labware_store.state.get_well_definition.return_value = well_def

    point = geometry_store.state.get_well_position("plate-id", "B2")

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


def test_get_well_position_with_top_offset(
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LabwareData(
        definition=well_plate_def,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3)
    )
    well_def = well_plate_def["wells"]["B2"]
    slot_pos = standard_deck_def["locations"]["orderedSlots"][2]["position"]

    mock_labware_store.state.get_labware_data_by_id.return_value = labware_data
    mock_labware_store.state.get_well_definition.return_value = well_def

    point = geometry_store.state.get_well_position(
        "plate-id",
        "B2",
        WellLocation(origin=WellOrigin.TOP, offset=(1, 2, 3))
    )

    assert point == Point(
        x=slot_pos[0] + 1 + well_def["x"] + 1,
        y=slot_pos[1] - 2 + well_def["y"] + 2,
        z=slot_pos[2] + 3 + well_def["z"] + well_def["depth"] + 3,
    )


def test_get_well_position_with_bottom_offset(
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LabwareData(
        definition=well_plate_def,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3)
    )
    well_def = well_plate_def["wells"]["B2"]
    slot_pos = standard_deck_def["locations"]["orderedSlots"][2]["position"]

    mock_labware_store.state.get_labware_data_by_id.return_value = labware_data
    mock_labware_store.state.get_well_definition.return_value = well_def

    point = geometry_store.state.get_well_position(
        "plate-id",
        "B2",
        WellLocation(origin=WellOrigin.BOTTOM, offset=(3, 2, 1))
    )

    assert point == Point(
        x=slot_pos[0] + 1 + well_def["x"] + 3,
        y=slot_pos[1] - 2 + well_def["y"] + 2,
        z=slot_pos[2] + 3 + well_def["z"] + 1,
    )


def test_get_effective_tip_length(
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore
) -> None:
    """It should get the effective tip length from a labware ID and pipette config."""
    pipette_config: PipetteDict = cast(PipetteDict, {
        "tip_overlap": {
            "default": 10,
            "opentrons/opentrons_96_tiprack_300ul/1": 20,
        }
    })
    mock_labware_store.state.get_tip_length.return_value = 50
    mock_labware_store.state.get_definition_uri.return_value = (
        "opentrons/opentrons_96_tiprack_300ul/1"
    )

    length_eff = geometry_store.state.get_effective_tip_length(
        labware_id="tip-rack-id",
        pipette_config=pipette_config
    )

    assert length_eff == 30
    mock_labware_store.state.get_tip_length.assert_called_with("tip-rack-id")
    mock_labware_store.state.get_definition_uri.assert_called_with("tip-rack-id")

    mock_labware_store.state.get_definition_uri.return_value = (
        "opentrons/something_else/1"
    )
    default_length_eff = geometry_store.state.get_effective_tip_length(
        labware_id="tip-rack-id",
        pipette_config=pipette_config
    )

    assert default_length_eff == 40


def test_get_tip_geometry(
    tip_rack_def: LabwareDefinition,
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore
) -> None:
    """It should get a "well's" tip geometry."""
    pipette_config: PipetteDict = cast(PipetteDict, {"tip_overlap": {"default": 10}})
    well_def = tip_rack_def["wells"]["B2"]

    mock_labware_store.state.get_tip_length.return_value = 50
    mock_labware_store.state.get_definition_uri.return_value = ""
    mock_labware_store.state.get_well_definition.return_value = well_def

    tip_geometry = geometry_store.state.get_tip_geometry(
        labware_id="tip-rack-id",
        well_name="B2",
        pipette_config=pipette_config
    )

    assert tip_geometry.effective_length == 40
    assert tip_geometry.diameter == well_def["diameter"]  # type: ignore[misc]
    assert tip_geometry.volume == well_def["totalLiquidVolume"]
    mock_labware_store.state.get_well_definition.assert_called_with(
        "tip-rack-id",
        "B2",
    )

    with pytest.raises(errors.LabwareIsNotTipRackError):
        mock_labware_store.state.get_well_definition.return_value = cast(
            WellDefinition,
            {"shape": "rectangular"}
        )

        geometry_store.state.get_tip_geometry(
            labware_id="tip-rack-id",
            well_name="B2",
            pipette_config=pipette_config
        )


def test_get_tip_drop_location(
    tip_rack_def: LabwareDefinition,
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore,
) -> None:
    """It should get relative drop tip location for a pipette/labware combo."""
    pipette_config: PipetteDict = cast(PipetteDict, {"return_tip_height": 0.7})

    mock_labware_store.state.get_tip_length.return_value = 50

    location = geometry_store.state.get_tip_drop_location(
        labware_id="tip-rack-id",
        pipette_config=pipette_config
    )

    assert location == WellLocation(
        origin=WellOrigin.TOP,
        offset=(0, 0, -0.7 * 50),
    )
    mock_labware_store.state.get_tip_length.assert_called_with("tip-rack-id")


def test_get_tip_drop_location_with_trash(
    mock_labware_store: MagicMock,
    geometry_store: GeometryStore,
) -> None:
    """It should get relative drop tip location for a the fixed trash."""
    pipette_config: PipetteDict = cast(PipetteDict, {"return_tip_height": 0.7})

    location = geometry_store.state.get_tip_drop_location(
        labware_id=FIXED_TRASH_ID,
        pipette_config=pipette_config
    )

    assert location == WellLocation(origin=WellOrigin.TOP, offset=(0, 0, 0))
