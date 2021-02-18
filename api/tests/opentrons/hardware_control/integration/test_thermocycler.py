import asyncio

import pytest
from mock import AsyncMock, patch
from opentrons.drivers.thermocycler.driver import TCPoller
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
    td = await Thermocycler.build(
        port=f"socket://127.0.0.1:{THERMOCYCLER_PORT}",
        execution_manager=AsyncMock(),
        loop=loop
    )
    yield td
    # Thermocycler class does not have a public interface to disconnect
    td._driver.disconnect()


def test_device_info(thermocycler: Thermocycler):
    """"""
    assert {'model': 'thermocycler_emulator', 'serial': 'fake_serial',
            'version': '1'} == thermocycler.device_info
