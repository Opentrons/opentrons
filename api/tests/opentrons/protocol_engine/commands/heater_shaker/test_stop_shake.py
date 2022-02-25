"""Test Heater Shaker stop shake command implementation."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine import execution
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.stop_shake import (
    StopShakeImpl,
)


@pytest.fixture()
def subject(
    equipment: execution.EquipmentHandler,
    movement: execution.MovementHandler,
    pipetting: execution.PipettingHandler,
    run_control: execution.RunControlHandler,
) -> StopShakeImpl:
    """Get the command implementation with mocked out dependencies."""
    return StopShakeImpl(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )


# TODO(mc, 2022-02-25): verify hardware interaction
@pytest.mark.xfail(raises=NotImplementedError, strict=True)
async def test_stop_shake(decoy: Decoy, subject: StopShakeImpl) -> None:
    """It should be able to stop the module's shake."""
    data = heater_shaker.StopShakeParams(moduleId="shake-shaker-id")

    result = await subject.execute(data)

    assert result == heater_shaker.StopShakeResult()
