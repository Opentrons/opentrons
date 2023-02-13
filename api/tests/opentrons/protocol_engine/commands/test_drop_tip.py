"""Test pick up tip commands."""
from decoy import Decoy

from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.execution import PipettingHandler

from opentrons.protocol_engine.commands.drop_tip import (
    DropTipParams,
    DropTipResult,
    DropTipImplementation,
)


def test_drop_tip_params_defaults() -> None:
    """A drop tip should use a `WellOrigin.DROP_TIP` by default."""
    default_params = DropTipParams.parse_obj(
        {"pipetteId": "abc", "labwareId": "def", "wellName": "ghj"}
    )

    assert default_params.wellLocation == WellLocation(
        origin=WellOrigin.DROP_TIP, offset=WellOffset(x=0, y=0, z=0)
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

    assert default_params.wellLocation == WellLocation(
        origin=WellOrigin.DROP_TIP, offset=WellOffset(x=1, y=2, z=3)
    )


async def test_drop_tip_implementation(
    decoy: Decoy,
    pipetting: PipettingHandler,
) -> None:
    """A DropTip command should have an execution implementation."""
    subject = DropTipImplementation(pipetting=pipetting)

    data = DropTipParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
    )

    result = await subject.execute(data)

    assert result == DropTipResult()

    decoy.verify(
        await pipetting.drop_tip(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
            home_after=None,
        )
    )
