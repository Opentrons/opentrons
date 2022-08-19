"""Test load-liquid command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import (
    LoadLiquidResult,
    LoadLiquidImplementation,
    LoadLiquidParams,
)
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
    decoy.when(mock_state_view.liquid.validate_has_liquid("liquid-id")).then_return(
        "liquid-id"
    )

    decoy.when(
        mock_state_view.labware.validate_labware_has_wells(
            "labware-id", iter({"A1": None, "B2": None})
        )
    ).then_return({"A1": None, "B2": None})

    data = LoadLiquidParams(
        labwareId="labware-id",
        liquidId="liquid-id",
        volumeByWell={"A1": 30, "B2": 100},
    )
    result = await subject.execute(data)

    assert result == LoadLiquidResult()
