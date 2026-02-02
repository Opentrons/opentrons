"""Test aspirate-in-place commands."""

from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine.commands.aspirate_while_tracking import (
    AspirateWhileTrackingImplementation,
    AspirateWhileTrackingParams,
    AspirateWhileTrackingResult,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData
from opentrons.protocol_engine.commands.pipetting_common import OverpressureError
from opentrons.protocol_engine.errors.exceptions import PipetteNotReadyToAspirateError
from opentrons.protocol_engine.execution import (
    GantryMover,
    MovementHandler,
    PipettingHandler,
)
from opentrons.protocol_engine.notes import CommandNoteAdder
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import (
    AspiratedFluid,
    CurrentAddressableArea,
    CurrentPipetteLocation,
    CurrentWell,
    DeckPoint,
    FluidKind,
    LabwareWellId,
    LiquidHandlingWellLocation,
    WellOffset,
    WellOrigin,
)
from opentrons.types import Point


@pytest.fixture
def subject(
    pipetting: PipettingHandler,
    state_view: StateView,
    hardware_api: HardwareAPI,
    mock_command_note_adder: CommandNoteAdder,
    model_utils: ModelUtils,
    gantry_mover: GantryMover,
    movement: MovementHandler,
) -> AspirateWhileTrackingImplementation:
    """Get the impelementation subject."""
    return AspirateWhileTrackingImplementation(
        pipetting=pipetting,
        hardware_api=hardware_api,
        state_view=state_view,
        command_note_adder=mock_command_note_adder,
        model_utils=model_utils,
        gantry_mover=gantry_mover,
        movement=movement,
    )


@pytest.mark.parametrize(
    "location,stateupdateLabware,stateupdateWell",
    [
        (
            CurrentWell(
                pipette_id="pipette-id-abc",
                labware_id="funky-labware",
                well_name="funky-well",
            ),
            "funky-labware",
            "funky-well",
        ),
        (
            CurrentAddressableArea("pipette-id-abc", "addressable-area-1"),
            "funky-labware",
            "funky-well",
        ),
    ],
)
async def test_aspirate_while_tracking_implementation(
    decoy: Decoy,
    gantry_mover: GantryMover,
    pipetting: PipettingHandler,
    movement: MovementHandler,
    state_view: StateView,
    hardware_api: HardwareAPI,
    mock_command_note_adder: CommandNoteAdder,
    subject: AspirateWhileTrackingImplementation,
    location: CurrentPipetteLocation | None,
    stateupdateLabware: str,
    stateupdateWell: str,
) -> None:
    """It should aspirate in place."""
    well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS,
        offset=WellOffset(x=0, y=0, z=1),
    )
    data = AspirateWhileTrackingParams(
        pipetteId="pipette-id-abc",
        labwareId=stateupdateLabware,
        wellName=stateupdateWell,
        trackFromLocation=well_location,
        trackToLocation=well_location,
        volume=123,
        flowRate=1.234,
    )
    decoy.when(
        state_view.geometry.get_nozzles_per_well(
            labware_id=stateupdateLabware,
            target_well_name=stateupdateWell,
            pipette_id="pipette-id-abc",
        )
    ).then_return(2)

    decoy.when(
        state_view.geometry.get_well_position(
            labware_id=stateupdateLabware,
            well_name=stateupdateWell,
            well_location=well_location,
            operation_volume=-123,
            pipette_id="pipette-id-abc",
        )
    ).then_return(Point(1, 2, 3))

    decoy.when(
        state_view.geometry.get_wells_covered_by_pipette_with_active_well(
            stateupdateLabware, stateupdateWell, "pipette-id-abc"
        )
    ).then_return(["A3", "A4"])
    decoy.when(
        pipetting.get_is_ready_to_aspirate(
            pipette_id="pipette-id-abc",
        )
    ).then_return(True)

    decoy.when(state_view.pipettes.get_ready_to_aspirate("pipette-id-abc")).then_return(
        True
    )

    decoy.when(
        await pipetting.aspirate_while_tracking(
            pipette_id="pipette-id-abc",
            volume=123,
            flow_rate=1.234,
            end_point=Point(1, 2, 3),
            command_note_adder=mock_command_note_adder,
            labware_id=stateupdateLabware,
            well_name=stateupdateWell,
        )
    ).then_return(123)

    decoy.when(await gantry_mover.get_position("pipette-id-abc")).then_return(
        Point(1, 2, 3)
    )

    decoy.when(state_view.pipettes.get_current_location()).then_return(location)

    _well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS, offset=WellOffset(x=0.0, y=0.0, z=1.0)
    )
    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id-abc",
            labware_id="funky-labware",
            well_name="funky-well",
            well_location=_well_location,
            current_well=None,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
            operation_volume=None,
            offset_pipette_for_reservoir_subwells=False,
        ),
    ).then_return(Point(x=4, y=5, z=6))

    result = await subject.execute(params=data)

    if isinstance(location, CurrentWell):
        assert result == SuccessData(
            public=AspirateWhileTrackingResult(
                volume=123,
                position=DeckPoint(x=1, y=2, z=3),
            ),
            state_update=update_types.StateUpdate(
                liquid_operated=update_types.LiquidOperatedUpdate(
                    labware_id=stateupdateLabware,
                    well_names=["A3", "A4"],
                    volume_added=-246,
                ),
                pipette_aspirated_fluid=update_types.PipetteAspiratedFluidUpdate(
                    pipette_id="pipette-id-abc",
                    fluid=AspiratedFluid(kind=FluidKind.LIQUID, volume=123),
                ),
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id-abc",
                    new_location=LabwareWellId(
                        labware_id="funky-labware", well_name="funky-well"
                    ),
                    new_deck_point=DeckPoint(x=4, y=5, z=6),
                ),
            ),
        )
    else:
        assert result == SuccessData(
            public=AspirateWhileTrackingResult(
                volume=123,
                position=DeckPoint(x=1, y=2, z=3),
            ),
            state_update=update_types.StateUpdate(
                pipette_aspirated_fluid=update_types.PipetteAspiratedFluidUpdate(
                    pipette_id="pipette-id-abc",
                    fluid=AspiratedFluid(kind=FluidKind.LIQUID, volume=123),
                ),
                liquid_operated=update_types.LiquidOperatedUpdate(
                    labware_id="funky-labware",
                    well_names=["A3", "A4"],
                    volume_added=-246.0,
                ),
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id-abc",
                    new_location=LabwareWellId(
                        labware_id="funky-labware", well_name="funky-well"
                    ),
                    new_deck_point=DeckPoint(x=4, y=5, z=6),
                ),
            ),
        )


async def test_handle_aspirate_while_tracking_request_not_ready_to_aspirate(
    decoy: Decoy,
    gantry_mover: GantryMover,
    pipetting: PipettingHandler,
    state_view: StateView,
    hardware_api: HardwareAPI,
    subject: AspirateWhileTrackingImplementation,
) -> None:
    """Should raise an exception for not ready to aspirate."""
    well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS,
        offset=WellOffset(x=0, y=0, z=1),
    )
    data = AspirateWhileTrackingParams(
        pipetteId="pipette-id-abc",
        labwareId="funky-labware",
        wellName="funky-well",
        trackFromLocation=well_location,
        trackToLocation=well_location,
        volume=123,
        flowRate=1.234,
    )
    decoy.when(await gantry_mover.get_position("pipette-id-abc")).then_return(
        Point(1, 2, 3)
    )
    decoy.when(
        pipetting.get_is_ready_to_aspirate(
            pipette_id="pipette-id-abc",
        )
    ).then_return(False)

    decoy.when(state_view.pipettes.get_ready_to_aspirate("pipette-id-abc")).then_return(
        False
    )
    with pytest.raises(
        PipetteNotReadyToAspirateError,
        match="Pipette cannot aspirate while tracking because a previous",
    ):
        await subject.execute(params=data)


async def test_aspirate_raises_volume_error(
    decoy: Decoy,
    pipetting: PipettingHandler,
    movement: MovementHandler,
    subject: AspirateWhileTrackingImplementation,
    mock_command_note_adder: CommandNoteAdder,
    gantry_mover: GantryMover,
    state_view: StateView,
) -> None:
    """Should raise an assertion error for volume larger than working volume."""
    well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS,
        offset=WellOffset(x=0, y=0, z=1),
    )
    data = AspirateWhileTrackingParams(
        pipetteId="pipette-id-abc",
        labwareId="funky-labware",
        wellName="funky-well",
        trackFromLocation=well_location,
        trackToLocation=well_location,
        volume=50,
        flowRate=1.23,
    )
    decoy.when(await gantry_mover.get_position("pipette-id-abc")).then_return(
        Point(x=1, y=2, z=3)
    )
    decoy.when(
        pipetting.get_is_ready_to_aspirate(pipette_id="pipette-id-abc")
    ).then_return(True)

    decoy.when(state_view.pipettes.get_ready_to_aspirate("pipette-id-abc")).then_return(
        True
    )
    decoy.when(
        state_view.geometry.get_well_position(
            labware_id="funky-labware",
            well_name="funky-well",
            well_location=well_location,
            operation_volume=-50,
            pipette_id="pipette-id-abc",
        )
    ).then_return(Point(0, 0, 0))
    decoy.when(
        await pipetting.aspirate_while_tracking(
            pipette_id="pipette-id-abc",
            volume=50,
            flow_rate=1.23,
            end_point=Point(0, 0, 0),
            command_note_adder=mock_command_note_adder,
            labware_id="funky-labware",
            well_name="funky-well",
        )
    ).then_raise(AssertionError("blah blah"))

    _well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS, offset=WellOffset(x=0.0, y=0.0, z=1.0)
    )
    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id-abc",
            labware_id="funky-labware",
            well_name="funky-well",
            well_location=_well_location,
            current_well=None,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
            operation_volume=None,
            offset_pipette_for_reservoir_subwells=False,
        ),
    ).then_return(Point(x=4, y=5, z=6))

    with pytest.raises(AssertionError):
        await subject.execute(data)


@pytest.mark.parametrize(
    "location,stateupdateLabware,stateupdateWell",
    [
        (
            CurrentWell(
                pipette_id="pipette-id-abc",
                labware_id="funky-labware",
                well_name="funky-well",
            ),
            "funky-labware",
            "funky-well",
        ),
        (None, None, None),
        (CurrentAddressableArea("pipette-id-abc", "addressable-area-1"), None, None),
    ],
)
async def test_overpressure_error(
    decoy: Decoy,
    gantry_mover: GantryMover,
    pipetting: PipettingHandler,
    movement: MovementHandler,
    subject: AspirateWhileTrackingImplementation,
    model_utils: ModelUtils,
    mock_command_note_adder: CommandNoteAdder,
    state_view: StateView,
    location: CurrentPipetteLocation | None,
    stateupdateLabware: str,
    stateupdateWell: str,
) -> None:
    """It should return an overpressure error if the hardware API indicates that."""
    pipette_id = "pipette-id-abc"

    position = Point(x=1, y=2, z=3)

    error_id = "error-id"
    error_timestamp = datetime(year=2020, month=1, day=2)
    decoy.when(
        state_view.geometry.get_nozzles_per_well(
            labware_id=stateupdateLabware,
            target_well_name=stateupdateWell,
            pipette_id="pipette-id-abc",
        )
    ).then_return(2)
    decoy.when(
        state_view.geometry.get_wells_covered_by_pipette_with_active_well(
            "funky-labware", "funky-well", "pipette-id-abc"
        )
    ).then_return(["A3", "A4"])
    well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS,
        offset=WellOffset(x=0, y=0, z=1),
    )
    data = AspirateWhileTrackingParams(
        pipetteId=pipette_id,
        labwareId="funky-labware",
        wellName="funky-well",
        trackFromLocation=well_location,
        trackToLocation=well_location,
        volume=50,
        flowRate=1.23,
    )

    decoy.when(pipetting.get_is_ready_to_aspirate(pipette_id=pipette_id)).then_return(
        True
    )

    decoy.when(state_view.pipettes.get_ready_to_aspirate(pipette_id)).then_return(True)

    decoy.when(
        state_view.geometry.get_well_position(
            labware_id="funky-labware",
            well_name="funky-well",
            well_location=well_location,
            operation_volume=-50,
            pipette_id="pipette-id-abc",
        )
    ).then_return(Point(0, 0, 0))
    decoy.when(
        await pipetting.aspirate_while_tracking(
            pipette_id=pipette_id,
            volume=50,
            flow_rate=1.23,
            end_point=Point(0, 0, 0),
            command_note_adder=mock_command_note_adder,
            labware_id="funky-labware",
            well_name="funky-well",
        ),
    ).then_raise(PipetteOverpressureError())

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_timestamp)
    decoy.when(await gantry_mover.get_position(pipette_id)).then_return(position)
    decoy.when(state_view.pipettes.get_current_location()).then_return(location)

    _well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS, offset=WellOffset(x=0.0, y=0.0, z=1.0)
    )
    decoy.when(
        await movement.move_to_well(
            pipette_id=pipette_id,
            labware_id="funky-labware",
            well_name="funky-well",
            well_location=_well_location,
            current_well=None,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
            operation_volume=None,
            offset_pipette_for_reservoir_subwells=False,
        ),
    ).then_return(Point(x=4, y=5, z=6))

    result = await subject.execute(data)

    if isinstance(location, CurrentWell):
        assert result == DefinedErrorData(
            public=OverpressureError.model_construct(
                id=error_id,
                createdAt=error_timestamp,
                wrappedErrors=[matchers.Anything()],
                errorInfo={"retryLocation": (4, 5, 6)},
            ),
            state_update=update_types.StateUpdate(
                liquid_operated=update_types.LiquidOperatedUpdate(
                    labware_id=stateupdateLabware,
                    well_names=["A3", "A4"],
                    volume_added=update_types.CLEAR,
                ),
                pipette_aspirated_fluid=update_types.PipetteUnknownFluidUpdate(
                    pipette_id="pipette-id-abc"
                ),
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id-abc",
                    new_location=LabwareWellId(
                        labware_id="funky-labware", well_name="funky-well"
                    ),
                    new_deck_point=DeckPoint(x=4, y=5, z=6),
                ),
            ),
        )
    else:
        assert result == DefinedErrorData(
            public=OverpressureError.model_construct(
                id=error_id,
                createdAt=error_timestamp,
                wrappedErrors=[matchers.Anything()],
                errorInfo={"retryLocation": (4, 5, 6)},
            ),
            state_update=update_types.StateUpdate(
                pipette_aspirated_fluid=update_types.PipetteUnknownFluidUpdate(
                    pipette_id="pipette-id-abc"
                ),
                liquid_operated=update_types.LiquidOperatedUpdate(
                    labware_id="funky-labware",
                    well_names=["A3", "A4"],
                    volume_added=update_types.CLEAR,
                ),
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id-abc",
                    new_location=LabwareWellId(
                        labware_id="funky-labware", well_name="funky-well"
                    ),
                    new_deck_point=DeckPoint(x=4, y=5, z=6),
                ),
            ),
        )
