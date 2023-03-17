"""Tests for build module."""
from mock import patch, AsyncMock, Mock

from opentrons_hardware.drivers.binary_usb import (
    SerialUsbDriver,
    build,
)


@patch.object(build, "build_rear_panel_driver")
async def test_driver(patch_build: AsyncMock) -> None:
    """It should create and destroy driver."""
    mock_driver = Mock(spec=SerialUsbDriver)
    mock_driver.__exit__ = Mock(return_value=None)
    patch_build.return_value = mock_driver
    async with build.usb_driver():
        pass

    patch_build.assert_called_once()
    mock_driver.__exit__.assert_called_once()
