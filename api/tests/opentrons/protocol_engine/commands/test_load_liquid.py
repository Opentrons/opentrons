"""Test load-liquid command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands import (
    LoadLiquidResult,
    LoadLiquidImplementation,
    LoadLiquidParams,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.resources.model_utils import ModelUtils


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def subject(
    mock_state_view: StateView, model_utils: ModelUtils
) -> LoadLiquidImplementation:
    """Load liquid implementation test subject."""
    return LoadLiquidImplementation(state_view=mock_state_view, model_utils=model_utils)


async def test_load_liquid_implementation(
    decoy: Decoy,
    subject: LoadLiquidImplementation,
    mock_state_view: StateView,
) -> None:
    """Test LoadLiquid command execution."""
    data = LoadLiquidParams(
        labwareId="labware-id",
        liquidId="liquid-id",
        volumeByWell={"A1": 30, "B2": 100},
    )
    result = await subject.execute(data)

    assert result == SuccessData(public=LoadLiquidResult(), private=None)

    decoy.verify(mock_state_view.liquid.validate_liquid_id("liquid-id"))

    decoy.verify(
        mock_state_view.labware.validate_liquid_allowed_in_labware(
            "labware-id", {"A1": 30.0, "B2": 100.0}
        )
    )
