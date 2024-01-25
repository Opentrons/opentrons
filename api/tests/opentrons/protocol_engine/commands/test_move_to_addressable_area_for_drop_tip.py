"""Test move to addressable area for drop tip commands."""
from decoy import Decoy

from opentrons.protocol_engine import DeckPoint, AddressableOffsetVector
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import StateView
from opentrons.types import Point

from opentrons.protocol_engine.commands.move_to_addressable_area_for_drop_tip import (
    MoveToAddressableAreaForDropTipParams,
    MoveToAddressableAreaForDropTipResult,
    MoveToAddressableAreaForDropTipImplementation,
)


async def test_move_to_addressable_area_for_drop_tip_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
) -> None:
    """A MoveToAddressableAreaForDropTip command should have an execution implementation."""
    subject = MoveToAddressableAreaForDropTipImplementation(
        movement=movement, state_view=state_view
    )

    data = MoveToAddressableAreaForDropTipParams(
        pipetteId="abc",
        addressableAreaName="123",
        offset=AddressableOffsetVector(x=1, y=2, z=3),
        forceDirect=True,
        minimumZHeight=4.56,
        speed=7.89,
        alternateDropLocation=True,
    )

    decoy.when(
        state_view.geometry.get_next_tip_drop_location_for_addressable_area(
            addressable_area_name="123", pipette_id="abc"
        )
    ).then_return(AddressableOffsetVector(x=10, y=11, z=12))

    decoy.when(
        await movement.move_to_addressable_area(
            pipette_id="abc",
            addressable_area_name="123",
            offset=AddressableOffsetVector(x=10, y=11, z=12),
            force_direct=True,
            minimum_z_height=4.56,
            speed=7.89,
        )
    ).then_return(Point(x=9, y=8, z=7))

    result = await subject.execute(data)

    assert result == MoveToAddressableAreaForDropTipResult(
        position=DeckPoint(x=9, y=8, z=7)
    )
