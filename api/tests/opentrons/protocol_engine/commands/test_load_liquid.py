"""Test load-liquid command."""
from decoy import Decoy

from opentrons.protocol_engine.commands import (
    LoadLiquidResult,
    LoadLiquidImplementation,
    LoadLiquidParams,
)


async def test_load_liquid_implementation(decoy: Decoy) -> None:
    """Test LoadLiquid command execution."""
    subject = LoadLiquidImplementation()

    data = LoadLiquidParams(
        labwareId="labware-id",
        liquidId="liquid-id",
        volumeByWell={"A1": 30, "B2": 100},
    )
    result = await subject.execute(data)

    assert result == LoadLiquidResult()
