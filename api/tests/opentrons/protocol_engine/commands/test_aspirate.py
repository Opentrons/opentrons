"""Test aspirate commands."""
from decoy import Decoy

from opentrons.protocol_engine import CommandHandlers, WellLocation, WellOrigin
from opentrons.protocol_engine.commands import AspirateRequest, AspirateResult


def test_aspirate_request() -> None:
    """It should be able to create a AspirateRequest."""
    request = AspirateRequest(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1)),
        volume=50,
    )

    assert request.pipetteId == "abc"
    assert request.labwareId == "123"
    assert request.wellName == "A3"
    assert request.wellLocation == WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=(0, 0, 1),
    )
    assert request.volume == 50


def test_aspirate_result() -> None:
    """It should be able to create a AspirateResult."""
    result = AspirateResult(volume=50)

    assert result.volume == 50


async def test_aspirate_implementation(
    decoy: Decoy,
    mock_cmd_handlers: CommandHandlers,
) -> None:
    """A PickUpTipRequest should have an execution implementation."""
    location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

    request = AspirateRequest(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
        volume=50,
    )

    decoy.when(
        await mock_cmd_handlers.pipetting.aspirate(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
            volume=50,
        )
    ).then_return(42)

    impl = request.get_implementation()
    result = await impl.execute(mock_cmd_handlers)

    assert result == AspirateResult(volume=42)
