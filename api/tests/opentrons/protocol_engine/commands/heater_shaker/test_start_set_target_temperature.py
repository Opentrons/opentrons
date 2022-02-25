"""Test Heater Shaker start set temperature command implementation."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine import execution
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.start_set_target_temperature import (  # noqa: E501
    StartSetTargetTemperatureImpl,
)


@pytest.fixture()
def subject(
    equipment: execution.EquipmentHandler,
    movement: execution.MovementHandler,
    pipetting: execution.PipettingHandler,
    run_control: execution.RunControlHandler,
) -> StartSetTargetTemperatureImpl:
    """Get the command implementation with mocked out dependencies."""
    return StartSetTargetTemperatureImpl(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )


# TODO(mc, 2022-02-25): verify hardware interaction
@pytest.mark.xfail(raises=NotImplementedError, strict=True)
async def test_set_target_shake_speed(
    decoy: Decoy,
    subject: StartSetTargetTemperatureImpl,
) -> None:
    """It should be able to set the module's target temperature."""
    data = heater_shaker.StartSetTargetTemperatureParams(
        moduleId="shake-shaker-id",
        temperature=42,
    )

    result = await subject.execute(data)

    assert result == heater_shaker.StartSetTargetTemperatureResult()
