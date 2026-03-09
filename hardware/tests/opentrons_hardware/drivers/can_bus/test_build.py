"""Tests for build module."""
from opentrons_hardware.drivers.can_bus import DriverSettings, build
import pytest
from mock import patch, AsyncMock, Mock

from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver


@pytest.fixture
def driver_settings() -> DriverSettings:
    """Driver settings fixture."""
    return DriverSettings(interface="virtual")


@patch.object(build, "build_driver")
async def test_driver(patch_build: AsyncMock, driver_settings: DriverSettings) -> None:
    """It should create and destroy driver."""
    mock_driver = Mock(spec=AbstractCanDriver)
    patch_build.return_value = mock_driver
    async with build.driver(driver_settings):
        pass

    patch_build.assert_called_once_with(driver_settings)
    mock_driver.shutdown.assert_called_once()


@patch.object(build, "build_driver")
async def test_can_messenger(
    patch_build: AsyncMock, driver_settings: DriverSettings
) -> None:
    """It should create and destroy messenger and driver."""
    mock_driver = Mock()
    patch_build.return_value = mock_driver
    async with build.can_messenger(driver_settings):
        pass

    patch_build.assert_called_once_with(driver_settings)
    mock_driver.shutdown.assert_called_once()
