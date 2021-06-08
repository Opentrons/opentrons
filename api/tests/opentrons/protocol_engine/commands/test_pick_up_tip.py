"""Test pick up tip commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import CommandHandlers
from opentrons.protocol_engine.commands.pick_up_tip import (
    PickUpTipData,
    PickUpTipResult,
    PickUpTipImplementation,
)


async def test_pick_up_tip_implementation(
    decoy: Decoy,
    command_handlers: CommandHandlers,
) -> None:
    """A PickUpTipRequest should have an execution implementation."""
    data = PickUpTipData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    subject = PickUpTipImplementation(data)
    result = await subject.execute(command_handlers)

    assert result == PickUpTipResult()
    decoy.verify(
        await command_handlers.pipetting.pick_up_tip(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        )
    )
