"""Test the ``moveLabware`` command."""
from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.execution import EquipmentHandler

from opentrons.protocol_engine.commands.move_labware import (
    MoveLabwareParams,
    MoveLabwareResult,
    MoveLabwareImplementation,
)


async def test_move_labware_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
) -> None:
    """It should delegate to the equipment handler and return the new offset."""
    subject = MoveLabwareImplementation(equipment=equipment)

    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
    )

    decoy.when(
        equipment.move_labware(
            labware_id="my-cool-labware-id",
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        )
    ).then_return("wowzers-a-new-offset-id")

    result = await subject.execute(data)

    assert result == MoveLabwareResult(
        offsetId="wowzers-a-new-offset-id",
    )
