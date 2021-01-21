"""Labware state store tests."""
import pytest
from datetime import datetime, timezone
from typing import Tuple
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import DeckSlotName

from opentrons.protocol_engine import commands as cmd, errors, StateStore
from opentrons.protocol_engine.types import LabwareLocation, DeckSlotLocation
from opentrons.protocol_engine.resources import DeckFixedLabware
from opentrons.protocol_engine.state import LabwareData


def load_labware(
    store: StateStore,
    labware_id: str,
    location: LabwareLocation,
    definition: LabwareDefinition,
    calibration: Tuple[float, float, float],
) -> cmd.CompletedCommand[cmd.LoadLabwareRequest, cmd.LoadLabwareResult]:
    """Load a labware into state using a LoadLabwareRequest."""
    request = cmd.LoadLabwareRequest(
        loadName="load-name",
        namespace="opentrons-test",
        version=1,
        location=location,
    )
    result = cmd.LoadLabwareResult(
        labwareId=labware_id,
        definition=definition,
        calibration=calibration
    )
    command = cmd.CompletedCommand(
        created_at=datetime.now(tz=timezone.utc),
        started_at=datetime.now(tz=timezone.utc),
        completed_at=datetime.now(tz=timezone.utc),
        request=request,
        result=result
    )

    store.handle_command(command, "command-id")
    return command


def test_get_labware_data_bad_id(store: StateStore) -> None:
    """get_labware_data_by_id should raise if labware ID doesn't exist."""
    with pytest.raises(errors.LabwareDoesNotExistError):
        store.labware.get_labware_data_by_id("asdfghjkl")


def test_handles_load_labware(
    store: StateStore,
    well_plate_def: LabwareDefinition
) -> None:
    """It should add the labware data to the state."""
    command = load_labware(
        store=store,
        labware_id="plate-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )

    data = store.labware.get_labware_data_by_id(command.result.labwareId)

    assert data.location == command.request.location
    assert data.definition == command.result.definition
    assert data.calibration == command.result.calibration


def test_loads_fixed_labware(
    standard_deck_def: DeckDefinitionV2,
    fixed_trash_def: LabwareDefinition,
) -> None:
    """It should create the labware substore with preloaded fixed labware."""
    store = StateStore(
        deck_definition=standard_deck_def,
        deck_fixed_labware=[
            DeckFixedLabware(
                labware_id="fixedTrash",
                location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
                definition=fixed_trash_def,
            )
        ]
    )

    assert store.labware.get_labware_data_by_id("fixedTrash") == LabwareData(
        location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
        definition=fixed_trash_def,
        calibration=(0, 0, 0),
    )


def test_get_all_labware(
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    store: StateStore,
) -> None:
    """It should return whether a labware by ID has a given quirk."""
    load_labware(
        store=store,
        labware_id="plate-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )

    load_labware(
        store=store,
        labware_id="reservoir-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
        definition=reservoir_def,
        calibration=(4, 5, 6),
    )

    all_labware = store.labware.get_all_labware()

    assert all_labware == [
        ("plate-id", store.labware.get_labware_data_by_id("plate-id")),
        ("reservoir-id", store.labware.get_labware_data_by_id("reservoir-id")),
    ]


def test_get_labware_has_quirk(
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    store: StateStore,
) -> None:
    """It should return whether a labware by ID has a given quirk."""
    load_labware(
        store=store,
        labware_id="plate-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )

    load_labware(
        store=store,
        labware_id="reservoir-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
        definition=reservoir_def,
        calibration=(4, 5, 6),
    )

    well_plate_has_center_quirk = store.labware.get_labware_has_quirk(
        "plate-id",
        "centerMultichannelOnWells"
    )

    reservoir_has_center_quirk = store.labware.get_labware_has_quirk(
        "reservoir-id",
        "centerMultichannelOnWells"
    )

    assert well_plate_has_center_quirk is False
    assert reservoir_has_center_quirk is True


def test_get_well_definition_bad_id(
    well_plate_def: LabwareDefinition,
    store: StateStore,
) -> None:
    """get_well_definition should raise if well ID doesn't exist."""
    load_labware(
        store=store,
        labware_id="uid",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )

    with pytest.raises(errors.WellDoesNotExistError):
        store.labware.get_well_definition(labware_id="uid", well_name="foobar")


def test_get_well_definition(
    well_plate_def: LabwareDefinition,
    store: StateStore,
) -> None:
    """It should return a well definition by well ID."""
    load_labware(
        store=store,
        labware_id="plate-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )

    expected_well_def = well_plate_def["wells"]["B2"]
    result = store.labware.get_well_definition(
        labware_id="plate-id",
        well_name="B2",
    )

    assert result == expected_well_def


def test_get_tip_length_raises_with_non_tip_rack(
    well_plate_def: LabwareDefinition,
    store: StateStore
) -> None:
    """It should raise if you try to get the tip length of a regular labware."""
    load_labware(
        store=store,
        labware_id="plate-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )

    with pytest.raises(errors.LabwareIsNotTipRackError):
        store.labware.get_tip_length("plate-id")


def test_get_tip_length_gets_length_from_definition(
    tip_rack_def: LabwareDefinition,
    store: StateStore
) -> None:
    """It should return the tip length from the definition."""
    load_labware(
        store=store,
        labware_id="tip-rack-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=tip_rack_def,
        calibration=(1, 2, 3),
    )

    length = store.labware.get_tip_length("tip-rack-id")
    assert length == tip_rack_def["parameters"]["tipLength"]


def test_get_labware_uri_from_definition(
    tip_rack_def: LabwareDefinition,
    store: StateStore
) -> None:
    """It should return the tip length from the definition."""
    load_labware(
        store=store,
        labware_id="tip-rack-id",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        definition=tip_rack_def,
        calibration=(1, 2, 3),
    )

    uri = store.labware.get_definition_uri("tip-rack-id")
    assert uri == "opentrons/opentrons_96_tiprack_300ul/1"
