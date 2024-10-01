"""Test LiquidProbe commands."""
from datetime import datetime
from typing import Type, Union

from opentrons.protocol_engine.errors.exceptions import (
    MustHomeError,
    PipetteNotReadyToAspirateError,
    TipNotAttachedError,
    TipNotEmptyError,
)
from opentrons_shared_data.errors.exceptions import (
    PipetteLiquidNotFoundError,
)
from decoy import matchers, Decoy
import pytest

from opentrons.protocol_engine.commands.pipetting_common import LiquidNotFoundError
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state import update_types
from opentrons.types import MountType, Point
from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset, DeckPoint

from opentrons.protocol_engine.commands.liquid_probe import (
    LiquidProbeParams,
    LiquidProbeResult,
    LiquidProbeImplementation,
    TryLiquidProbeParams,
    TryLiquidProbeResult,
    TryLiquidProbeImplementation,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData


from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
)
from opentrons.protocol_engine.resources.model_utils import ModelUtils


EitherImplementationType = Union[
    Type[LiquidProbeImplementation], Type[TryLiquidProbeImplementation]
]
EitherImplementation = Union[LiquidProbeImplementation, TryLiquidProbeImplementation]
EitherParamsType = Union[Type[LiquidProbeParams], Type[TryLiquidProbeParams]]
EitherResultType = Union[Type[LiquidProbeResult], Type[TryLiquidProbeResult]]


@pytest.fixture(
    params=[
        (LiquidProbeImplementation, LiquidProbeParams, LiquidProbeResult),
        (TryLiquidProbeImplementation, TryLiquidProbeParams, TryLiquidProbeResult),
    ]
)
def types(
    request: pytest.FixtureRequest,
) -> tuple[EitherImplementationType, EitherParamsType, EitherResultType]:
    """Return a tuple of types associated with a single variant of the command."""
    return request.param  # type: ignore[no-any-return]


@pytest.fixture
def implementation_type(
    types: tuple[EitherImplementationType, object, object]
) -> EitherImplementationType:
    """Return an implementation type. Kept in sync with the params and result types."""
    return types[0]


@pytest.fixture
def params_type(types: tuple[object, EitherParamsType, object]) -> EitherParamsType:
    """Return a params type. Kept in sync with the implementation and result types."""
    return types[1]


@pytest.fixture
def result_type(types: tuple[object, object, EitherResultType]) -> EitherResultType:
    """Return a result type. Kept in sync with the implementation and params types."""
    return types[2]


@pytest.fixture
def subject(
    implementation_type: EitherImplementationType,
    state_view: StateView,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    model_utils: ModelUtils,
) -> Union[LiquidProbeImplementation, TryLiquidProbeImplementation]:
    """Get the implementation subject."""
    return implementation_type(
        state_view=state_view,
        pipetting=pipetting,
        movement=movement,
        model_utils=model_utils,
    )


async def test_liquid_probe_implementation(
    decoy: Decoy,
    movement: MovementHandler,
    state_view: StateView,
    pipetting: PipettingHandler,
    subject: EitherImplementation,
    params_type: EitherParamsType,
    result_type: EitherResultType,
) -> None:
    """It should move to the destination and do a liquid probe there."""
    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    data = params_type(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
    )

    decoy.when(state_view.pipettes.get_aspirated_volume(pipette_id="abc")).then_return(
        0
    )

    decoy.when(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
        ),
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        await pipetting.liquid_probe_in_place(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
        ),
    ).then_return(15.0)

    result = await subject.execute(data)

    assert type(result.public) is result_type  # Pydantic v1 only compares the fields.
    assert result == SuccessData(
        public=result_type(z_position=15.0, position=DeckPoint(x=1, y=2, z=3)),
        private=None,
        state_update=update_types.StateUpdate(
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="abc",
                new_location=update_types.Well(labware_id="123", well_name="A3"),
                new_deck_point=DeckPoint(x=1, y=2, z=3),
            )
        ),
    )


async def test_liquid_not_found_error(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    subject: EitherImplementation,
    params_type: EitherParamsType,
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

    data = params_type(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )

    decoy.when(state_view.pipettes.get_aspirated_volume(pipette_id)).then_return(0)

    decoy.when(
        await movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        ),
    ).then_return(position)

    decoy.when(
        await pipetting.liquid_probe_in_place(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        ),
    ).then_raise(PipetteLiquidNotFoundError())

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_timestamp)

    result = await subject.execute(data)

    expected_state_update = update_types.StateUpdate(
        pipette_location=update_types.PipetteLocationUpdate(
            pipette_id=pipette_id,
            new_location=update_types.Well(labware_id=labware_id, well_name=well_name),
            new_deck_point=DeckPoint(x=position.x, y=position.y, z=position.z),
        )
    )
    if isinstance(subject, LiquidProbeImplementation):
        assert result == DefinedErrorData(
            public=LiquidNotFoundError.construct(
                id=error_id,
                createdAt=error_timestamp,
                wrappedErrors=[matchers.Anything()],
            ),
            state_update=expected_state_update,
        )
    else:
        assert result == SuccessData(
            public=TryLiquidProbeResult(
                z_position=None,
                position=DeckPoint(x=position.x, y=position.y, z=position.z),
            ),
            private=None,
            state_update=expected_state_update,
        )


async def test_liquid_probe_tip_checking(
    decoy: Decoy,
    state_view: StateView,
    subject: EitherImplementation,
    params_type: EitherParamsType,
) -> None:
    """It should raise a TipNotAttached error if the state view indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = params_type(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )

    decoy.when(state_view.pipettes.get_aspirated_volume(pipette_id)).then_raise(
        TipNotAttachedError()
    )
    with pytest.raises(TipNotAttachedError):
        await subject.execute(data)


async def test_liquid_probe_plunger_preparedness_checking(
    decoy: Decoy,
    state_view: StateView,
    subject: EitherImplementation,
    params_type: EitherParamsType,
) -> None:
    """It should raise a PipetteNotReadyToAspirate error if the state view indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = params_type(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )

    decoy.when(state_view.pipettes.get_aspirated_volume(pipette_id)).then_return(None)
    with pytest.raises(PipetteNotReadyToAspirateError):
        await subject.execute(data)


async def test_liquid_probe_volume_checking(
    decoy: Decoy,
    state_view: StateView,
    subject: EitherImplementation,
    params_type: EitherParamsType,
) -> None:
    """It should return a TipNotEmptyError if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = params_type(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )

    decoy.when(
        state_view.pipettes.get_aspirated_volume(pipette_id=pipette_id),
    ).then_return(123)
    with pytest.raises(TipNotEmptyError):
        await subject.execute(data)

    decoy.when(
        state_view.pipettes.get_aspirated_volume(pipette_id=pipette_id),
    ).then_return(None)
    with pytest.raises(PipetteNotReadyToAspirateError):
        await subject.execute(data)


async def test_liquid_probe_location_checking(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    subject: EitherImplementation,
    params_type: EitherParamsType,
) -> None:
    """It should return a PositionUnkownError if the hardware API indicates that."""
    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = params_type(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location,
    )
    decoy.when(state_view.pipettes.get_aspirated_volume(pipette_id)).then_return(0)
    decoy.when(
        await movement.check_for_valid_position(
            mount=MountType.LEFT,
        ),
    ).then_return(False)
    with pytest.raises(MustHomeError):
        await subject.execute(data)
