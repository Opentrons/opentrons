"""Test begin-probe command."""
from decoy import Decoy

from opentrons.protocol_engine.commands.calibration.probe import (
    BeginProbeResult,
    BeginProbeImplementation,
    BeginProbeParams,
)

from opentrons.types import Mount
from opentrons.hardware_control import HardwareControlAPI


async def test_begin_probe_implementation(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
) -> None:
    """Test BeginProbe command execution."""
    subject = BeginProbeImplementation(hardware_api=hardware_api)

    data = BeginProbeParams(
        mount=Mount.LEFT,
    )

    result = await subject.execute(data)

    assert result == BeginProbeResult(offsets=[])

    # TODO (tz, 8-9-22): verify call to harware_api.probe()
