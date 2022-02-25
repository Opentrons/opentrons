"""Test Heater Shaker start set temperature command implementation."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.start_set_target_temperature import (  # noqa: E501
    StartSetTargetTemperatureImpl,
)


@pytest.fixture()
def subject() -> StartSetTargetTemperatureImpl:
    """Get the command implementation with mocked out dependencies."""
    return StartSetTargetTemperatureImpl()


# TODO(mc, 2022-02-25): verify hardware interaction
@pytest.mark.xfail(raises=NotImplementedError, strict=True)
async def test_start_set_target_temperature(
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
