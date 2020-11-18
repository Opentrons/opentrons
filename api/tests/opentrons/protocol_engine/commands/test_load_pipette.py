"""Test load pipette commands."""
from mock import AsyncMock  # type: ignore[attr-defined]

from opentrons.types import MountType
from opentrons.protocol_engine.execution import LoadedPipette
from opentrons.protocol_engine.commands import (
    LoadPipetteRequest,
    LoadPipetteResult,
)


def test_load_pipette_request() -> None:
    """It should have a LoadPipetteRequest model."""
    request = LoadPipetteRequest(
        pipetteName="p300_single",
        mount=MountType.LEFT
    )

    assert request.pipetteName == "p300_single"
    assert request.mount == MountType.LEFT


def test_load_pipette_result() -> None:
    """It should have a LoadPipetteResult model."""
    result = LoadPipetteResult(pipetteId="pipette-id")

    assert result.pipetteId == "pipette-id"


async def test_load_pipette_implementation(mock_handlers: AsyncMock) -> None:
    """A LoadPipetteRequest should have an execution implementation."""
    mock_handlers.equipment.load_pipette.return_value = LoadedPipette(
        pipette_id="pipette-id",
    )

    request = LoadPipetteRequest(pipetteName="p300_single", mount=MountType.LEFT)
    impl = request.get_implementation()
    result = await impl.execute(mock_handlers)

    assert result == LoadPipetteResult(pipetteId="pipette-id")
    mock_handlers.equipment.load_pipette.assert_called_with(
        pipette_name="p300_single",
        mount=MountType.LEFT,
    )
