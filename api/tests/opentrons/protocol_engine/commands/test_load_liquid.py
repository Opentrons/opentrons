"""Test load-liquid command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import (
    LoadLiquidResult,
    LoadLiquidImplementation,
    LoadLiquidParams,
)
from opentrons.protocol_engine.errors import (
    LiquidDoesNotExistError,
    LabwareNotLoadedError,
    WellDoesNotExistError,
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
    decoy.when(mock_state_view.liquid.has("liquid-id")).then_return("liquid-id")

    decoy.when(
        mock_state_view.labware.validate_labware_has_wells("labware-id", ["A1", "B2"])
    ).then_return(["A1", "B2"])

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
    decoy.when(mock_state_view.liquid.has("liquid-not-found")).then_raise(
        LiquidDoesNotExistError()
    )

    data = LoadLiquidParams(
        labwareId="labware-id",
        liquidId="liquid-not-found",
        volumeByWell={"A1": 30, "B2": 100},
    )
    with pytest.raises(LiquidDoesNotExistError):
        await subject.execute(data)


async def test_load_liquid_labware_not_found(
    decoy: Decoy, subject: LoadLiquidImplementation, mock_state_view: StateView
) -> None:
    """Should raise an error that liquid not found."""
    decoy.when(mock_state_view.liquid.has("liquid-id")).then_return("liquid-id")

    decoy.when(
        mock_state_view.labware.validate_labware_has_wells(
            "labware-not-found", ["A1", "B2"]
        )
    ).then_raise(LabwareNotLoadedError())

    data = LoadLiquidParams(
        labwareId="labware-not-found",
        liquidId="liquid-id",
        volumeByWell={"A1": 30, "B2": 100},
    )
    with pytest.raises(LabwareNotLoadedError):
        await subject.execute(data)


async def test_load_liquid_well_not_found(
    decoy: Decoy, subject: LoadLiquidImplementation, mock_state_view: StateView
) -> None:
    """Should raise an error that liquid not found."""
    decoy.when(
        mock_state_view.labware.validate_labware_has_wells("labware-id", ["C1", "B2"])
    ).then_raise(WellDoesNotExistError())

    decoy.when(mock_state_view.liquid.has("liquid-id")).then_return("liquid-id")

    data = LoadLiquidParams(
        labwareId="labware-id",
        liquidId="liquid-id",
        volumeByWell={"C1": 30, "B2": 100},
    )

    with pytest.raises(WellDoesNotExistError):
        await subject.execute(data)
