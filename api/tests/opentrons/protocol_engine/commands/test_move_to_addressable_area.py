"""Test move to addressable area commands."""
from decoy import Decoy
import pytest

from opentrons_shared_data.pipette.types import PipetteNameType
from opentrons.protocol_engine import DeckPoint, AddressableOffsetVector, LoadedPipette
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.types import Point, MountType

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.move_to_addressable_area import (
    MoveToAddressableAreaParams,
    MoveToAddressableAreaResult,
    MoveToAddressableAreaImplementation,
)


@pytest.mark.parametrize(
    "pipette_name",
    (
        pipette_name
        for pipette_name in PipetteNameType
        if pipette_name
        not in (
            PipetteNameType.P10_SINGLE,
            PipetteNameType.P10_MULTI,
            PipetteNameType.P50_MULTI,
            PipetteNameType.P50_SINGLE,
            PipetteNameType.P300_SINGLE,
            PipetteNameType.P300_MULTI,
            PipetteNameType.P1000_SINGLE,
        )
    ),
)
async def test_move_to_addressable_area_implementation_non_gen1(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    pipette_name: PipetteNameType,
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

    decoy.when(state_view.pipettes.get("abc")).then_return(
        LoadedPipette(id="abc", pipetteName=pipette_name, mount=MountType.LEFT)
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
            highest_possible_z_extra_offset=None,
        )
    ).then_return(Point(x=9, y=8, z=7))

    result = await subject.execute(data)

    assert result == SuccessData(
        public=MoveToAddressableAreaResult(position=DeckPoint(x=9, y=8, z=7)),
        private=None,
    )


@pytest.mark.parametrize(
    "pipette_name",
    (
        PipetteNameType.P10_SINGLE,
        PipetteNameType.P10_MULTI,
        PipetteNameType.P50_MULTI,
        PipetteNameType.P50_SINGLE,
        PipetteNameType.P300_SINGLE,
        PipetteNameType.P300_MULTI,
        PipetteNameType.P1000_SINGLE,
    ),
)
async def test_move_to_addressable_area_implementation_with_gen1(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    pipette_name: PipetteNameType,
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

    decoy.when(state_view.pipettes.get("abc")).then_return(
        LoadedPipette(id="abc", pipetteName=pipette_name, mount=MountType.LEFT)
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
            highest_possible_z_extra_offset=5.0,
        )
    ).then_return(Point(x=9, y=8, z=7))

    result = await subject.execute(data)

    assert result == SuccessData(
        public=MoveToAddressableAreaResult(position=DeckPoint(x=9, y=8, z=7)),
        private=None,
        state_update=update_types.StateUpdate(
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="abc",
                new_location=update_types.AddressableArea(addressable_area_name="123"),
                new_deck_point=DeckPoint(x=9, y=8, z=7),
            )
        ),
    )
