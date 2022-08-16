"""Test load-liquid command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import (
    LoadLiquidResult,
    LoadLiquidImplementation,
    LoadLiquidParams,
)
from opentrons.protocol_engine.types import Liquid
from opentrons.protocol_engine.errors.exceptions import LiquidNotFoundError
from opentrons.protocol_engine.state import StateView


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def subject(mock_state_view: StateView) -> LoadLiquidImplementation:
    """Load liquid implementation test subject."""
    return LoadLiquidImplementation(state_view=mock_state_view)


async def test_load_liquid_implementation(
    decoy: Decoy, subject: LoadLiquidImplementation, mock_state_view: StateView
) -> None:
    """Test LoadLiquid command execution."""
    decoy.when(mock_state_view.liquid.get_all()).then_return(
        [Liquid(id="liquid-id", displayName="liquid", description="desc")]
    )

    data = LoadLiquidParams(
        labwareId="labware-id",
        liquidId="liquid-id",
        volumeByWell={"A1": 30, "B2": 100},
    )
    result = await subject.execute(data)

    assert result == LoadLiquidResult()


async def test_load_liquid_liquid_not_found(
    decoy: Decoy, subject: LoadLiquidImplementation, mock_state_view: StateView
) -> None:
    """Should raise an error that liquid not found."""
    decoy.when(mock_state_view.liquid.get_all()).then_return(
        [Liquid(id="liquid-id", displayName="liquid", description="desc")]
    )

    data = LoadLiquidParams(
        labwareId="labware-id",
        liquidId="liquid-not-found",
        volumeByWell={"A1": 30, "B2": 100},
    )
    with pytest.raises(LiquidNotFoundError):
        await subject.execute(data)
