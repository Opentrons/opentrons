"""Test load-liquid command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import (
    LoadLiquidResult,
    LoadLiquidImplementation,
    LoadLiquidParams,
)
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.commands.load_liquid import InvalidLoadVolumeError


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def subject(mock_state_view: StateView) -> LoadLiquidImplementation:
    """Load liquid implementation test subject."""
    return LoadLiquidImplementation(state_view=mock_state_view)


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

    decoy.when(
        mock_state_view.labware.get_well_max_volume("labware-id", "A1")
    ).then_return(30)

    decoy.when(
        mock_state_view.labware.get_well_max_volume("labware-id", "B2")
    ).then_return(100)

    result = await subject.execute(data)

    assert result == LoadLiquidResult()

    decoy.verify(mock_state_view.liquid.validate_liquid_id("liquid-id"))

    decoy.verify(
        mock_state_view.labware.validate_liquid_allowed_in_labware(
            "labware-id", {"A1": 30.0, "B2": 100.0}
        )
    )


async def test_load_liquid_implementation_raises_max_volume(
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

    decoy.when(
        mock_state_view.labware.get_well_max_volume("labware-id", "A1")
    ).then_return(20)

    with pytest.raises(InvalidLoadVolumeError):
        await subject.execute(data)
