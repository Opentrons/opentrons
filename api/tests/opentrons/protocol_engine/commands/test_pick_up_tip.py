"""Test pick up tip commands."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import CommandHandlers
from opentrons.protocol_engine.commands.pick_up_tip import (
    PickUpTip,
    PickUpTipData,
    PickUpTipResult,
)


@pytest.fixture
def subject() -> PickUpTip.Implementation:
    """Get a PickUpTip implementation with its dependencies mocked out."""
    return PickUpTip.Implementation()


async def test_pick_up_tip_implementation(
    decoy: Decoy,
    command_handlers: CommandHandlers,
    subject: PickUpTip.Implementation,
) -> None:
    """A PickUpTipRequest should have an execution implementation."""
    data = PickUpTipData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    result = await subject.execute(data, command_handlers)

    assert result == PickUpTipResult()
    decoy.verify(
        await command_handlers.pipetting.pick_up_tip(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        )
    )
