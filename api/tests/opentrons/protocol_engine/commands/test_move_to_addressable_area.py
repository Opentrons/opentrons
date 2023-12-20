"""Test move to addressable area commands."""
from decoy import Decoy

from opentrons.protocol_engine import DeckPoint, AddressableOffsetVector
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import StateView
from opentrons.types import Point

from opentrons.protocol_engine.commands.move_to_addressable_area import (
    MoveToAddressableAreaParams,
    MoveToAddressableAreaResult,
    MoveToAddressableAreaImplementation,
)


async def test_move_to_addressable_area_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
) -> None:
    """A MoveToAddressableArea command should have an execution implementation."""
    subject = MoveToAddressableAreaImplementation(
        movement=movement, state_view=state_view
    )

    data = MoveToAddressableAreaParams(
        pipetteId="abc",
        addressableAreaName="123",
        offset=AddressableOffsetVector(x=1, y=2, z=3),
        forceDirect=True,
        minimumZHeight=4.56,
        speed=7.89,
        stayAtHighestPossibleZ=True,
    )

    decoy.when(
        await movement.move_to_addressable_area(
            pipette_id="abc",
            addressable_area_name="123",
            offset=AddressableOffsetVector(x=1, y=2, z=3),
            force_direct=True,
            minimum_z_height=4.56,
            speed=7.89,
            stay_at_highest_possible_z=True,
        )
    ).then_return(Point(x=9, y=8, z=7))

    result = await subject.execute(data)

    assert result == MoveToAddressableAreaResult(position=DeckPoint(x=9, y=8, z=7))
