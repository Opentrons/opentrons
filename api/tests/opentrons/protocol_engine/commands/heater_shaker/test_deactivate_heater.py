"""Test Heater Shaker deactivate heater command implementation."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.deactivate_heater import (
    DeactivateHeaterImpl,
)


@pytest.fixture()
def subject() -> DeactivateHeaterImpl:
    """Get the command implementation with mocked out dependencies."""
    return DeactivateHeaterImpl()


# TODO(mc, 2022-02-25): verify hardware interaction
@pytest.mark.xfail(raises=NotImplementedError, strict=True)
async def test_deactivate_heater(decoy: Decoy, subject: DeactivateHeaterImpl) -> None:
    """It should be able to deactivate the module's heater."""
    data = heater_shaker.DeactivateHeaterParams(moduleId="heater-shaker-id")

    result = await subject.execute(data)

    assert result == heater_shaker.DeactivateHeaterResult()
