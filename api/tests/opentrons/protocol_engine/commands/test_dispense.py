"""Test dispense commands."""
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from opentrons.protocol_engine import (
    LiquidHandlingWellLocation,
    WellOrigin,
    WellOffset,
    DeckPoint,
)
from opentrons.protocol_engine.execution import MovementHandler, PipettingHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.types import Point

from opentrons.protocol_engine.commands.command import SuccessData, DefinedErrorData
from opentrons.protocol_engine.commands.dispense import (
    DispenseParams,
    DispenseResult,
    DispenseImplementation,
)
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.commands.pipetting_common import OverpressureError


@pytest.fixture
def subject(
    state_view: StateView,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    model_utils: ModelUtils,
) -> DispenseImplementation:
    """Get the implementation subject."""
    return DispenseImplementation(
        state_view=state_view,
        movement=movement,
        pipetting=pipetting,
        model_utils=model_utils,
    )


async def test_dispense_implementation(
    decoy: Decoy,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: DispenseImplementation,
) -> None:
    """It should move to the target location and then dispense."""
    well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = DispenseParams(
        pipetteId="pipette-id-abc123",
        labwareId="labware-id-abc123",
        wellName="A3",
        wellLocation=well_location,
        volume=50,
        flowRate=1.23,
    )

    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id-abc123",
            labware_id="labware-id-abc123",
            well_name="A3",
            well_location=well_location,
        )
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        await pipetting.dispense_in_place(
            pipette_id="pipette-id-abc123", volume=50, flow_rate=1.23, push_out=None
        )
    ).then_return(42)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=DispenseResult(volume=42, position=DeckPoint(x=1, y=2, z=3)),
        private=None,
        state_update=update_types.StateUpdate(
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="pipette-id-abc123",
                new_location=update_types.Well(
                    labware_id="labware-id-abc123",
                    well_name="A3",
                ),
                new_deck_point=DeckPoint.construct(x=1, y=2, z=3),
            ),
            liquid_operated=update_types.LiquidOperatedUpdate(
                labware_id="labware-id-abc123",
                well_name="A3",
                volume=42,
            ),
        ),
    )


async def test_overpressure_error(
    decoy: Decoy,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: DispenseImplementation,
    model_utils: ModelUtils,
) -> None:
    """It should return an overpressure error if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = LiquidHandlingWellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    position = Point(x=1, y=2, z=3)

    error_id = "error-id"
    error_timestamp = datetime(year=2020, month=1, day=2)

    data = DispenseParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
        volume=50,
        flowRate=1.23,
    )

    decoy.when(
        await movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        ),
    ).then_return(position)

    decoy.when(
        await pipetting.dispense_in_place(
            pipette_id=pipette_id, volume=50, flow_rate=1.23, push_out=None
        ),
    ).then_raise(PipetteOverpressureError())

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_timestamp)

    result = await subject.execute(data)

    assert result == DefinedErrorData(
        public=OverpressureError.construct(
            id=error_id,
            createdAt=error_timestamp,
            wrappedErrors=[matchers.Anything()],
            errorInfo={"retryLocation": (position.x, position.y, position.z)},
        ),
        state_update=update_types.StateUpdate(
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="pipette-id",
                new_location=update_types.Well(
                    labware_id="labware-id",
                    well_name="well-name",
                ),
                new_deck_point=DeckPoint.construct(x=1, y=2, z=3),
            ),
            liquid_operated=update_types.LiquidOperatedUpdate(
                labware_id="labware-id",
                well_name="well-name",
                volume=None,
            ),
        ),
    )
