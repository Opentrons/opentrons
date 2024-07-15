"""Test LiquidProbe commands."""
from datetime import datetime
from typing import Type, Union

from opentrons.protocol_engine.errors.exceptions import (
    MustHomeError,
    TipNotAttachedError,
    TipNotEmptyError,
)
from opentrons_shared_data.errors.exceptions import (
    PipetteLiquidNotFoundError,
)
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
    TryLiquidProbeResult,
    TryLiquidProbeImplementation,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData

from opentrons.protocol_engine.state import StateView

from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
)
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.types import CurrentWell, LoadedPipette


EitherImplementationType = Union[
    Type[LiquidProbeImplementation], Type[TryLiquidProbeImplementation]
]
EitherImplementation = Union[LiquidProbeImplementation, TryLiquidProbeImplementation]
EitherResultType = Union[Type[LiquidProbeResult], Type[TryLiquidProbeResult]]


@pytest.fixture(
    params=[
        (LiquidProbeImplementation, LiquidProbeResult),
        (TryLiquidProbeImplementation, TryLiquidProbeResult),
    ]
)
def implementation_and_result_types(
    request: pytest.FixtureRequest,
) -> tuple[EitherImplementationType, EitherResultType]:
    """Return an implementation class and the result class associated with it."""
    return request.param  # type: ignore[no-any-return]


@pytest.fixture
def implementation_type(
    implementation_and_result_types: tuple[EitherImplementationType, object]
) -> EitherImplementationType:
    """Return an implementation class. This is kept in sync with `result_type`."""
    return implementation_and_result_types[0]


@pytest.fixture
def result_type(
    implementation_and_result_types: tuple[object, EitherResultType]
) -> EitherResultType:
    """Return a result class. This is kept in sync with `implementation_type`."""
    return implementation_and_result_types[1]


@pytest.fixture
def subject(
    implementation_type: EitherImplementationType,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    model_utils: ModelUtils,
) -> Union[LiquidProbeImplementation, TryLiquidProbeImplementation]:
    """Get the implementation subject."""
    return implementation_type(
        pipetting=pipetting,
        movement=movement,
        model_utils=model_utils,
    )


async def test_liquid_probe_implementation_no_prep(
    decoy: Decoy,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: EitherImplementation,
    result_type: EitherResultType,
) -> None:
    """A Liquid Probe should have an execution implementation without preparing to aspirate."""
    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))
    current_well = CurrentWell(pipette_id="abc", labware_id="123", well_name="A3")

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
            current_well=current_well,
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

    assert type(result.public) is result_type  # Pydantic v1 only compares the fields.
    assert result == SuccessData(
        public=result_type(z_position=15.0, position=DeckPoint(x=1, y=2, z=3)),
        private=None,
    )


async def test_liquid_probe_implementation_with_prep(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: EitherImplementation,
    result_type: EitherResultType,
) -> None:
    """A Liquid Probe should have an execution implementation with preparing to aspirate."""
    location = WellLocation(origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=0))
    current_well = CurrentWell(pipette_id="abc", labware_id="123", well_name="A3")

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
            current_well=current_well,
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

    assert type(result.public) is result_type  # Pydantic v1 only compares the fields.
    assert result == SuccessData(
        public=result_type(z_position=15.0, position=DeckPoint(x=1, y=2, z=3)),
        private=None,
    )


async def test_liquid_not_found_error(
    decoy: Decoy,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: EitherImplementation,
    model_utils: ModelUtils,
) -> None:
    """It should return a liquid not found error if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )
    current_well = CurrentWell(
        pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
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
            current_well=current_well,
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

    if isinstance(subject, LiquidProbeImplementation):
        assert result == DefinedErrorData(
            public=LiquidNotFoundError.construct(
                id=error_id,
                createdAt=error_timestamp,
                wrappedErrors=[matchers.Anything()],
            ),
            private=LiquidNotFoundErrorInternalData(
                position=DeckPoint(x=position.x, y=position.y, z=position.z)
            ),
        )
    else:
        assert result == SuccessData(
            public=TryLiquidProbeResult(
                z_position=None,
                position=DeckPoint(x=position.x, y=position.y, z=position.z),
            ),
            private=None,
        )


async def test_liquid_probe_tip_checking(
    decoy: Decoy,
    pipetting: PipettingHandler,
    subject: EitherImplementation,
) -> None:
    """It should return a TipNotAttached error if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = LiquidProbeParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )

    decoy.when(
        pipetting.get_is_ready_to_aspirate(
            pipette_id=pipette_id,
        ),
    ).then_raise(TipNotAttachedError())
    with pytest.raises(TipNotAttachedError):
        await subject.execute(data)


async def test_liquid_probe_volume_checking(
    decoy: Decoy,
    pipetting: PipettingHandler,
    subject: EitherImplementation,
) -> None:
    """It should return a TipNotEmptyError if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = LiquidProbeParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )
    decoy.when(
        pipetting.get_is_empty(pipette_id=pipette_id),
    ).then_return(False)
    with pytest.raises(TipNotEmptyError):
        await subject.execute(data)


async def test_liquid_probe_location_checking(
    decoy: Decoy,
    movement: MovementHandler,
    subject: EitherImplementation,
) -> None:
    """It should return a PositionUnkownError if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = LiquidProbeParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )
    decoy.when(
        await movement.check_for_valid_position(
            mount=MountType.LEFT,
        ),
    ).then_return(False)
    with pytest.raises(MustHomeError):
        await subject.execute(data)
