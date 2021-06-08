"""Test pick up tip commands."""
from decoy import Decoy

from opentrons.protocol_engine import CommandHandlers
from opentrons.protocol_engine.commands.drop_tip import (
    DropTipData,
    DropTipResult,
    DropTipImplementation,
)


async def test_pick_up_tip_implementation(
    decoy: Decoy, command_handlers: CommandHandlers
) -> None:
    """A DropTipRequest should have an execution implementation."""
    data = DropTipData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    subject = DropTipImplementation(data)
    result = await subject.execute(command_handlers)

    assert result == DropTipResult()
    decoy.verify(
        await command_handlers.pipetting.drop_tip(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        )
    )
