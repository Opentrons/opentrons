"""Test Heater Shaker close latch command implementation."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.close_latch import (
    CloseLatchImpl,
)


@pytest.fixture()
def subject() -> CloseLatchImpl:
    """Get the command implementation with mocked out dependencies."""
    return CloseLatchImpl()


# TODO(mc, 2022-02-25): verify hardware interaction
@pytest.mark.xfail(raises=NotImplementedError, strict=True)
async def test_close_latch(decoy: Decoy, subject: CloseLatchImpl) -> None:
    """It should be able to close the module's labware latch."""
    data = heater_shaker.CloseLatchParams(moduleId="heater-shaker-id")

    result = await subject.execute(data)

    assert result == heater_shaker.CloseLatchResult()
