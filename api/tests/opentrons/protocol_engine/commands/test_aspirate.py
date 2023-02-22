"""Test aspirate commands."""
import pytest
from decoy import Decoy

from opentrons.types import Mount as HardwareMount, MountType
from opentrons.protocol_engine import (
    WellLocation,
    WellOrigin,
    WellOffset,
    DeckPoint,
    LoadedPipette,
)
from opentrons.protocol_engine.types import CurrentWell

from opentrons.protocol_engine.commands.aspirate import (
    AspirateParams,
    AspirateResult,
    AspirateImplementation,
)

from opentrons.protocol_engine.state import StateView

from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
)
from opentrons.hardware_control import HardwareControlAPI


async def test_aspirate_implementation_no_prep(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """An Aspirate should have an execution implementation without preparing to aspirate."""
    subject = AspirateImplementation(
        pipetting=pipetting,
        state_view=state_view,
        movement=movement,
        hardware_api=hardware_api,
    )

    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    data = AspirateParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
        volume=50,
        flowRate=1.23,
    )

    decoy.when(pipetting.get_is_ready_to_aspirate(pipette_id="abc")).then_return(True)

    decoy.when(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
            current_well=None,
        ),
    ).then_return(DeckPoint(x=1, y=2, z=3))

    result = await subject.execute(data)

    assert result == AspirateResult(volume=50, position=DeckPoint(x=1, y=2, z=3))

    decoy.verify(
        await pipetting.aspirate_in_place(pipette_id="abc", volume=50, flow_rate=1.23),
        times=1,
    )


async def test_aspirate_implementation_with_prep(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """An Aspirate should have an execution implementation with preparing to aspirate."""
    subject = AspirateImplementation(
        pipetting=pipetting,
        state_view=state_view,
        movement=movement,
        hardware_api=hardware_api,
    )

    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    data = AspirateParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
        volume=50,
        flowRate=1.23,
    )

    decoy.when(pipetting.get_is_ready_to_aspirate(pipette_id="abc")).then_return(False)

    decoy.when(state_view.pipettes.get(pipette_id="abc")).then_return(
        LoadedPipette.construct(  # type:ignore[call-arg]
            mount=MountType.LEFT
        )
    )
    decoy.when(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
            current_well=CurrentWell(
                pipette_id="abc",
                labware_id="123",
                well_name="A3",
            ),
        ),
    ).then_return(DeckPoint(x=1, y=2, z=3))

    result = await subject.execute(data)

    assert result == AspirateResult(volume=50, position=DeckPoint(x=1, y=2, z=3))

    decoy.verify(
        await pipetting.aspirate_in_place(pipette_id="abc", volume=50, flow_rate=1.23),
        times=1,
    )
    decoy.verify(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(origin=WellOrigin.TOP),
        ),
        times=1,
    )
    decoy.verify(
        await pipetting.prepare_for_aspirate(mount=HardwareMount.LEFT),
        times=1,
    )
