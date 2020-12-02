"""Test pick up tip commands."""
from mock import AsyncMock  # type: ignore[attr-defined]

from opentrons.protocol_engine.commands import (
    DropTipRequest,
    DropTipResult,
)


def test_pick_up_tip_request() -> None:
    """It should be able to create a DropTipRequest."""
    request = DropTipRequest(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    assert request.pipetteId == "abc"
    assert request.labwareId == "123"
    assert request.wellName == "A3"


def test_pick_up_tip_result() -> None:
    """It should be able to create a DropTipResult."""
    # NOTE(mc, 2020-11-17): this model has no properties at this time
    result = DropTipResult()

    assert result


async def test_pick_up_tip_implementation(mock_handlers: AsyncMock) -> None:
    """A DropTipRequest should have an execution implementation."""
    mock_handlers.pipetting.drop_tip.return_value = None

    request = DropTipRequest(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    impl = request.get_implementation()
    result = await impl.execute(mock_handlers)

    assert result == DropTipResult()
    mock_handlers.pipetting.drop_tip.assert_called_with(
        pipette_id="abc",
        labware_id="123",
        well_name="A3",
    )
