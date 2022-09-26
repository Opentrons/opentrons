"""Test move-to-coordinates commands."""
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import DeckPoint

from opentrons.protocol_engine.commands.move_to_coordinates import (
    MoveToCoordinatesParams,
    MoveToCoordinatesResult,
    MoveToCoordinatesImplementation,
)


async def test_move_to_coordinates_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
) -> None:
    """Test the `moveToCoordinates` implementation.

    It should:

    1. Query the hardware controller for the given pipette's current position
       and how high it can go with its current tip.
    2. Plan the movement, taking the above into account, plus the input parameters.
    3. Iterate through the waypoints of the movement.
    """
    subject = MoveToCoordinatesImplementation(
        state_view=state_view,
        movement=movement,
    )

    params = MoveToCoordinatesParams(
        pipetteId="pipette-id",
        coordinates=DeckPoint(x=1.11, y=2.22, z=3.33),
        minimumZHeight=1234,
        forceDirect=True,
    )

    result = await subject.execute(params=params)

    assert result == MoveToCoordinatesResult()
    decoy.verify(
        await movement.move_to_coordinates(
            pipette_id="pipette-id",
            deck_coordinates=DeckPoint(x=1.11, y=2.22, z=3.33),
            direct=True,
            additional_min_travel_z=1234,
        )
    )
