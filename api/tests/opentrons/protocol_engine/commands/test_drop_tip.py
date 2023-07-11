"""Test drop tip commands."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine import (
    DropTipWellLocation,
    DropTipWellOrigin,
    WellLocation,
    WellOffset,
    DeckPoint,
)
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.execution import MovementHandler, TipHandler
from opentrons.types import Point

from opentrons.protocol_engine.commands.drop_tip import (
    DropTipParams,
    DropTipResult,
    DropTipImplementation,
)


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Get a mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def mock_movement_handler(decoy: Decoy) -> MovementHandler:
    """Get a mock MovementHandler."""
    return decoy.mock(cls=MovementHandler)


@pytest.fixture
def mock_tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mock TipHandler."""
    return decoy.mock(cls=TipHandler)


def test_drop_tip_params_defaults() -> None:
    """A drop tip should use a `WellOrigin.DROP_TIP` by default."""
    default_params = DropTipParams.parse_obj(
        {"pipetteId": "abc", "labwareId": "def", "wellName": "ghj"}
    )

    assert default_params.wellLocation == DropTipWellLocation(
        origin=DropTipWellOrigin.DEFAULT, offset=WellOffset(x=0, y=0, z=0)
    )


def test_drop_tip_params_default_origin() -> None:
    """A drop tip should drop a `WellOrigin.DROP_TIP` by default even if an offset is given."""
    default_params = DropTipParams.parse_obj(
        {
            "pipetteId": "abc",
            "labwareId": "def",
            "wellName": "ghj",
            "wellLocation": {"offset": {"x": 1, "y": 2, "z": 3}},
        }
    )

    assert default_params.wellLocation == DropTipWellLocation(
        origin=DropTipWellOrigin.DEFAULT, offset=WellOffset(x=1, y=2, z=3)
    )


async def test_drop_tip_implementation(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_movement_handler: MovementHandler,
    mock_tip_handler: TipHandler,
) -> None:
    """A DropTip command should have an execution implementation."""
    subject = DropTipImplementation(
        state_view=mock_state_view,
        movement=mock_movement_handler,
        tip_handler=mock_tip_handler,
    )

    params = DropTipParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=DropTipWellLocation(offset=WellOffset(x=1, y=2, z=3)),
        homeAfter=True,
    )

    decoy.when(
        mock_state_view.geometry.get_tip_drop_location(
            pipette_id="abc",
            labware_id="123",
            well_location=DropTipWellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    ).then_return(WellLocation(offset=WellOffset(x=4, y=5, z=6)))

    decoy.when(
        await mock_movement_handler.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=4, y=5, z=6)),
        )
    ).then_return(Point(x=111, y=222, z=333))

    result = await subject.execute(params)

    assert result == DropTipResult(position=DeckPoint(x=111, y=222, z=333))

    decoy.verify(
        await mock_tip_handler.drop_tip(pipette_id="abc", home_after=True),
        times=1,
    )


async def test_drop_tip_with_randomization(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_movement_handler: MovementHandler,
    mock_tip_handler: TipHandler,
) -> None:
    """It should drop tip at random location within the labware every time."""
    subject = DropTipImplementation(
        state_view=mock_state_view,
        movement=mock_movement_handler,
        tip_handler=mock_tip_handler,
    )
    params = DropTipParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=DropTipWellLocation(offset=WellOffset(x=1, y=2, z=3)),
        homeAfter=True,
        randomizeDropLocation=True,
    )
    drop_location = DropTipWellLocation(
        origin=DropTipWellOrigin.DEFAULT, offset=WellOffset(x=10, y=20, z=30)
    )
    decoy.when(
        mock_state_view.labware.get_random_drop_tip_location(
            labware_id="123", well_name="A3"
        )
    ).then_return(drop_location)

    decoy.when(
        mock_state_view.geometry.get_tip_drop_location(
            pipette_id="abc",
            labware_id="123",
            well_location=drop_location,
        )
    ).then_return(WellLocation(offset=WellOffset(x=4, y=5, z=6)))

    decoy.when(
        await mock_movement_handler.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=4, y=5, z=6)),
        )
    ).then_return(Point(x=111, y=222, z=333))

    result = await subject.execute(params)
    assert result == DropTipResult(position=DeckPoint(x=111, y=222, z=333))
