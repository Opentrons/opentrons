"""Test begin-probe command."""
from decoy import Decoy

from opentrons.protocol_engine.commands.calibration.probe import (
    ProbeResult,
    ProbeImplementation,
    ProbeParams,
)

from opentrons.types import Mount
from opentrons.hardware_control import HardwareControlAPI


async def test_probe_implementation(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
) -> None:
    """Test Probe command execution."""
    subject = ProbeImplementation(hardware_api=hardware_api)

    data = ProbeParams(
        mount=Mount.LEFT,
    )

    result = await subject.execute(data)

    assert result == ProbeResult(offsets=[])

    # TODO (tz, 8-9-22): verify call to harware_api.probe()
