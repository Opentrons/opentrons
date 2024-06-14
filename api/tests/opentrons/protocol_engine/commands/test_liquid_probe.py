"""Test LiquidProbe commands."""
from datetime import datetime

from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError
from decoy import matchers, Decoy
import pytest

from opentrons.protocol_engine.commands.pipetting_common import (
    LiquidNotFoundError,
    LiquidNotFoundErrorInternalData,
)
from opentrons.types import MountType, Point
from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset, DeckPoint

from opentrons.protocol_engine.commands.liquid_probe import (
    LiquidProbeParams,
    LiquidProbeResult,
    LiquidProbeImplementation,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData

from opentrons.protocol_engine.state import StateView

from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
)
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.types import CurrentWell, LoadedPipette


@pytest.fixture
def subject(
    movement: MovementHandler,
    pipetting: PipettingHandler,
    model_utils: ModelUtils,
) -> LiquidProbeImplementation:
    """Get the implementation subject."""
    return LiquidProbeImplementation(
        pipetting=pipetting,
        movement=movement,
        model_utils=model_utils,
    )


async def test_liquid_probe_implementation_no_prep(
    decoy: Decoy,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: LiquidProbeImplementation,
) -> None:
    """A Liquid Probe should have an execution implementation without preparing to aspirate."""
    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    data = LiquidProbeParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
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
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        await pipetting.liquid_probe_in_place(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        ),
    ).then_return(15.0)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=LiquidProbeResult(z_position=15.0, position=DeckPoint(x=1, y=2, z=3)),
        private=None,
    )


async def test_liquid_probe_implementation_with_prep(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: LiquidProbeImplementation,
) -> None:
    """A Liquid Probe should have an execution implementation with preparing to aspirate."""
    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    data = LiquidProbeParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
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
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        await pipetting.liquid_probe_in_place(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        ),
    ).then_return(15.0)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=LiquidProbeResult(z_position=15.0, position=DeckPoint(x=1, y=2, z=3)),
        private=None,
    )

    decoy.verify(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(origin=WellOrigin.TOP),
        ),
    )


async def test_liquid_not_found_error(
    decoy: Decoy,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: LiquidProbeImplementation,
    model_utils: ModelUtils,
) -> None:
    """It should return a liquid not found error if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    position = Point(x=1, y=2, z=3)

    error_id = "error-id"
    error_timestamp = datetime(year=2020, month=1, day=2)

    data = LiquidProbeParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )

    decoy.when(pipetting.get_is_ready_to_aspirate(pipette_id=pipette_id)).then_return(
        True
    )

    decoy.when(
        await movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            current_well=None,
        ),
    ).then_return(position)

    decoy.when(
        await pipetting.liquid_probe_in_place(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
        ),
    ).then_raise(PipetteLiquidNotFoundError())

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_timestamp)

    result = await subject.execute(data)

    assert result == DefinedErrorData(
        public=LiquidNotFoundError.construct(
            id=error_id, createdAt=error_timestamp, wrappedErrors=[matchers.Anything()]
        ),
        private=LiquidNotFoundErrorInternalData(
            position=DeckPoint(x=position.x, y=position.y, z=position.z)
        ),
    )
