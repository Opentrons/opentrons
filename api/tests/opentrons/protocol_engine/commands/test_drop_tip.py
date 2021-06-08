"""Test pick up tip commands."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine import CommandHandlers
from opentrons.protocol_engine.commands.drop_tip import (
    DropTip,
    DropTipData,
    DropTipResult,
)


@pytest.fixture
def subject() -> DropTip.Implementation:
    """Get an DropTip implementation with its dependencies mocked out."""
    return DropTip.Implementation()


async def test_pick_up_tip_implementation(
    decoy: Decoy,
    command_handlers: CommandHandlers,
    subject: DropTip.Implementation,
) -> None:
    """A DropTipRequest should have an execution implementation."""
    data = DropTipData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    result = await subject.execute(data, command_handlers)

    assert result == DropTipResult()
    decoy.verify(
        await command_handlers.pipetting.drop_tip(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        )
    )
