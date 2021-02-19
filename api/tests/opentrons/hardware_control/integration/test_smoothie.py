import asyncio

import pytest
from opentrons.config.robot_configs import build_config
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieDriver_3_0_0
from opentrons.hardware_control.emulation.app import SMOOTHIE_PORT


@pytest.fixture
def smoothie(loop: asyncio.BaseEventLoop, emulation_app) -> SmoothieDriver_3_0_0:
    conf = build_config({})
    s = SmoothieDriver_3_0_0(config=conf)
    s.connect(f"socket://127.0.0.1:{SMOOTHIE_PORT}")
    yield s
    s.disconnect()


def test_get_fw_version(smoothie: SmoothieDriver_3_0_0):
    assert smoothie.get_fw_version() == 'EMULATOR'
