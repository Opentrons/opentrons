"""Test seRailLights command."""
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    RailLightsHandler,
)

from opentrons.protocol_engine.commands.set_rail_lights import (
    SetRailLightsParams,
    SetRailLightsResult,
    SetRailLightsImplementation,
)


async def test_set_rail_lights_implementation(
    decoy: Decoy,
    rail_lights: RailLightsHandler,
) -> None:
    """A setRailLights should have an execution implementation."""
    subject = SetRailLightsImplementation(rail_lights=rail_lights)

    data = SetRailLightsParams(
        on=True,
    )

    result = await subject.execute(data)

    assert result == SetRailLightsResult()

    decoy.verify(await rail_lights.set_rail_lights(True), times=1)
