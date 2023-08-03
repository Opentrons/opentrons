"""RailLights handler."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution.rail_lights import RailLightsHandler
from opentrons.hardware_control import HardwareControlAPI, OT2HardwareControlAPI


@pytest.fixture
def subject(
    hardware_api: HardwareControlAPI,
) -> RailLightsHandler:
    """Create a RailLightsHandler with its dependencies mocked out."""
    return RailLightsHandler(hardware_api=hardware_api)


@pytest.mark.parametrize("binary", [True, False])
async def test_set_rail_lights(
    decoy: Decoy,
    subject: RailLightsHandler,
    hardware_api: OT2HardwareControlAPI,
    binary: bool,
) -> None:
    """The hardware controller should be called."""
    await subject.set_rail_lights(on=binary)

    decoy.verify(await hardware_api.set_lights(rails=binary), times=1)
