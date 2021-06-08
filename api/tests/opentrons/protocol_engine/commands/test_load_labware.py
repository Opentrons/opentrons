"""Test load labware commands."""
import pytest
from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.execution import CommandHandlers, LoadedLabware
from opentrons.protocol_engine.commands.load_labware import (
    LoadLabware,
    LoadLabwareData,
    LoadLabwareResult,
)


@pytest.fixture
def subject() -> LoadLabware.Implementation:
    """Get a LoadLabwareImplementation with its dependencies mocked out."""
    return LoadLabware.Implementation()


async def test_load_labware_implementation(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    command_handlers: CommandHandlers,
    subject: LoadLabware.Implementation,
) -> None:
    """A LoadLabware command should have an execution implementation."""
    data = LoadLabwareData(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
    )

    decoy.when(
        await command_handlers.equipment.load_labware(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
            labware_id=None,
        )
    ).then_return(
        LoadedLabware(
            labware_id="labware-id", definition=well_plate_def, calibration=(1, 2, 3)
        )
    )

    result = await subject.execute(data, command_handlers)

    assert result == LoadLabwareResult(
        labwareId="labware-id",
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )
