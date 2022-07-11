"""Test move-to-coordinates commands."""
from decoy import Decoy

from opentrons.hardware_control import CriticalPoint, HardwareControlAPI
from opentrons.types import Mount, MountType, Point
from opentrons.motion_planning import Waypoint
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import DeckPoint, LoadedPipette, PipetteName

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
        hardware_api=hardware_api,
        movement=movement,
    )

    params = MoveToCoordinatesParams(
        pipetteId="pipette-id",
        coordinates=DeckPoint(x=1.11, y=2.22, z=3.33),
        minimumZHeight=1234,
        forceDirect=True,
    )

    mount_type = MountType.RIGHT
    mount = Mount.RIGHT

    current_position = Point(4.44, 5.55, 6.66)
    max_height = 5678

    planned_waypoint_1 = Waypoint(position=Point(3, 1, 4), critical_point=None)
    planned_waypoint_2 = Waypoint(
        position=Point(1, 5, 9), critical_point=CriticalPoint.XY_CENTER
    )

    decoy.when(state_view.pipettes.get(params.pipetteId)).then_return(
        LoadedPipette(
            mount=mount_type,
            id="loaded-pipette-id-should-not-matter",
            pipetteName=PipetteName.P10_SINGLE,  # Shouldn't matter.
        )
    )

    decoy.when(
        await hardware_api.gantry_position(mount=mount, critical_point=None)
    ).then_return(current_position)

    decoy.when(
        hardware_api.get_instrument_max_height(mount=mount, critical_point=None)
    ).then_return(max_height)

    decoy.when(
        state_view.motion.get_movement_waypoints_to_coords(
            origin=current_position,
            dest=Point(
                params.coordinates.x, params.coordinates.y, params.coordinates.z
            ),
            max_travel_z=max_height,
            direct=params.forceDirect,
            additional_min_travel_z=params.minimumZHeight,
        )
    ).then_return([planned_waypoint_1, planned_waypoint_2])

    result = await subject.execute(params=params)

    decoy.verify(
        await hardware_api.move_to(
            mount=mount,
            abs_position=planned_waypoint_1.position,
            critical_point=planned_waypoint_1.critical_point,
        ),
        await hardware_api.move_to(
            mount=mount,
            abs_position=planned_waypoint_2.position,
            critical_point=planned_waypoint_2.critical_point,
        ),
    )

    assert result == MoveToCoordinatesResult()
