"""Test Heater Shaker set shake speed command implementation."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.set_target_shake_speed import (
    SetTargetShakeSpeedImpl,
)


@pytest.fixture()
def subject() -> SetTargetShakeSpeedImpl:
    """Get the command implementation with mocked out dependencies."""
    return SetTargetShakeSpeedImpl()


# TODO(mc, 2022-02-25): verify hardware interaction
@pytest.mark.xfail(raises=NotImplementedError, strict=True)
async def test_set_target_shake_speed(
    decoy: Decoy,
    subject: SetTargetShakeSpeedImpl,
) -> None:
    """It should be able to set the module's shake speed."""
    data = heater_shaker.SetTargetShakeSpeedParams(moduleId="shake-shaker-id", rpm=1234)

    result = await subject.execute(data)

    assert result == heater_shaker.SetTargetShakeSpeedResult()
