import asyncio

import pytest
from mock import AsyncMock, patch
from opentrons.config import IS_WIN
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.thermocycler.driver import TCPoller
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.emulation.app import THERMOCYCLER_PORT
from opentrons.hardware_control.modules import Thermocycler


@pytest.fixture
async def patch_fd_path(tmpdir):
    """Thermocycler uses /var/run as directory for polling files. We need
    a directory that does not require root permission."""
    with patch.object(TCPoller, 'POLLING_FD_PATH', new=str(tmpdir)) as p:
        yield p


@pytest.fixture
async def thermocycler(
        loop: asyncio.BaseEventLoop,
        patch_fd_path,
        emulation_app) -> Thermocycler:
    """Thermocycler fixture."""
    execution_manager = ExecutionManager(loop)
    module = await Thermocycler.build(
        port=f"socket://127.0.0.1:{THERMOCYCLER_PORT}",
        execution_manager=AsyncMock(),
        usb_port=USBPort(name="", port_number=1, sub_names=[], device_path="",
                         hub=1),
        loop=loop
    )
    yield module
    module.cleanup()
    await execution_manager.cancel()


@pytest.mark.skipif(IS_WIN, reason="Cannot be run on Windows")
def test_device_info(thermocycler: Thermocycler):
    """It should have device info."""
    assert {'model': 'v02', 'serial': 'thermocycler_emulator',
            'version': 'v1.1.0'} == thermocycler.device_info
