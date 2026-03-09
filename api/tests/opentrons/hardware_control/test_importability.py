import pytest
from opentrons.hardware_control.ot3api import OT3API


@pytest.mark.ot2_only
async def test_flex_simulator_always_importable() -> None:
    api = await OT3API.build_hardware_simulator()
    assert isinstance(api, OT3API)
