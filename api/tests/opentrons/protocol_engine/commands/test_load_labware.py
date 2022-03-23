"""Test load labware commands."""
from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.execution import LoadedLabwareData, EquipmentHandler

from opentrons.protocol_engine.commands.load_labware import (
    LoadLabwareParams,
    LoadLabwareResult,
    LoadLabwareImplementation,
)


async def test_load_labware_implementation(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
) -> None:
    """A LoadLabware command should have an execution implementation."""
    subject = LoadLabwareImplementation(equipment=equipment)

    data = LoadLabwareParams(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName="My custom display name",
    )

    decoy.when(
        await equipment.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
            labware_id=None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="labware-id",
            definition=well_plate_def,
            offsetId="labware-offset-id",
        )
    )

    result = await subject.execute(data)

    assert result == LoadLabwareResult(
        labwareId="labware-id",
        definition=well_plate_def,
        offsetId="labware-offset-id",
    )
