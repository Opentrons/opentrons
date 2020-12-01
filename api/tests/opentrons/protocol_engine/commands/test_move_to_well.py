"""Test move to well commands."""
from mock import AsyncMock  # type: ignore[attr-defined]

from opentrons.protocol_engine.commands import (
    MoveToWellRequest,
    MoveToWellResult,
)


def test_move_to_well_request() -> None:
    """It should be able to create a MoveToWellRequest."""
    request = MoveToWellRequest(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    assert request.pipetteId == "abc"
    assert request.labwareId == "123"
    assert request.wellName == "A3"


def test_move_to_well_result() -> None:
    """It should be able to create a MoveToWellResult."""
    # NOTE(mc, 2020-11-17): this model has no properties at this time
    result = MoveToWellResult()

    assert result


async def test_move_to_well_implementation(mock_handlers: AsyncMock) -> None:
    """A MoveToWellRequest should have an execution implementation."""
    mock_handlers.movement.move_to_well.return_value = None

    request = MoveToWellRequest(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    impl = request.get_implementation()
    result = await impl.execute(mock_handlers)

    assert result == MoveToWellResult()
    mock_handlers.movement.move_to_well.assert_called_with(
        pipette_id="abc",
        labware_id="123",
        well_name="A3",
    )
