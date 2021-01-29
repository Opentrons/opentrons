"""Test load labware commands."""
from mock import AsyncMock  # type: ignore[attr-defined]

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.types import DeckSlotLocation

from opentrons.protocol_engine.execution import LoadedLabware
from opentrons.protocol_engine.commands import (
    LoadLabwareRequest,
    LoadLabwareResult,
)


def test_load_labware_request() -> None:
    """It should have a LoadLabwareRequest model."""
    request = LoadLabwareRequest(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1
    )

    assert request.location == DeckSlotLocation(slot=DeckSlotName.SLOT_3)
    assert request.loadName == "some-load-name"
    assert request.namespace == "opentrons-test"
    assert request.version == 1


def test_load_labware_result(well_plate_def: LabwareDefinition) -> None:
    """It should have a LoadLabwareResult model."""
    result = LoadLabwareResult(
        labwareId="labware-id",
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )

    assert result.labwareId == "labware-id"
    assert result.definition == well_plate_def
    assert result.calibration == (1, 2, 3)


async def test_load_labware_implementation(
    well_plate_def: LabwareDefinition,
    mock_handlers: AsyncMock,
) -> None:
    """A LoadLabwareRequest should have an execution implementation."""
    mock_handlers.equipment.load_labware.return_value = LoadedLabware(
        labware_id="labware-id",
        definition=well_plate_def,
        calibration=(1, 2, 3)
    )

    request = LoadLabwareRequest(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1
    )

    impl = request.get_implementation()
    result = await impl.execute(mock_handlers)

    assert result == LoadLabwareResult(
        labwareId="labware-id",
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )
    mock_handlers.equipment.load_labware.assert_called_with(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        load_name="some-load-name",
        namespace="opentrons-test",
        version=1
    )
