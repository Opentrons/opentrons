from mock import MagicMock
import pytest
import asyncio
from enum import Enum
from concurrent.futures.thread import ThreadPoolExecutor

from opentrons.drivers.absorbance_reader import (
    AbsorbanceReaderDriver,
    AbsorbanceHidInterface,
)
from opentrons.drivers.absorbance_reader.async_byonoy import AsyncByonoy
from opentrons.drivers.types import AbsorbanceReaderLidStatus


@pytest.fixture
def mock_interface() -> MagicMock:
    return MagicMock(spec=AbsorbanceHidInterface)


@pytest.fixture
def mock_device() -> MagicMock:
    return MagicMock(spec=AbsorbanceHidInterface.Device)


class MockErrorCode(Enum):
    BYONOY_ERROR_NO_ERROR = "no_error"
    BYONOY_ERROR = "error"


@pytest.fixture
async def mock_async_byonoy(mock_interface, mock_device) -> AsyncByonoy:
    loop = asyncio.get_running_loop()
    return AsyncByonoy(
        mock_interface, mock_device, ThreadPoolExecutor(max_workers=1), loop
    )


@pytest.fixture
async def driver(mock_async_byonoy: AsyncByonoy) -> AbsorbanceReaderDriver:
    return AbsorbanceReaderDriver(mock_async_byonoy)


@pytest.fixture
async def connected_driver(driver: AbsorbanceReaderDriver) -> AbsorbanceReaderDriver:
    driver._connection._device_handle = 1
    return driver


async def test_driver_connect_disconnect(
    mock_interface: MagicMock,
    driver: AbsorbanceReaderDriver,
) -> None:
    mock_interface.byonoy_open_device.return_value = (
        MockErrorCode.BYONOY_ERROR_NO_ERROR,
        1,
    )

    assert not await driver.is_connected()
    await driver.connect()

    mock_interface.byonoy_open_device.assert_called_once()
    assert await driver.is_connected()
    assert driver._connection.verify_device_handle()
    assert driver._connection._device_handle == 1

    mock_interface.byonoy_free_device.return_value = MockErrorCode.BYONOY_ERROR_NO_ERROR
    await driver.disconnect()

    assert not await driver.is_connected()
    assert driver._connection._device_handle is None


async def test_driver_get_device_info(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
) -> None:

    DEVICE_INFO = MagicMock(AbsorbanceHidInterface.DeviceInfo)
    DEVICE_INFO.ref_no = "456"
    DEVICE_INFO.sn = "123"
    DEVICE_INFO.version = "1.0"

    mock_interface.byonoy_get_device_information.return_value = (
        MockErrorCode.BYONOY_ERROR_NO_ERROR,
        DEVICE_INFO,
    )

    info = await connected_driver.get_device_info()

    mock_interface.byonoy_get_device_information.assert_called_once()
    assert info == {"serial_number": "123", "reference_number": "456", "version": "1.0"}


@pytest.mark.parametrize(
    "parts_aligned, module_status",
    [(True, AbsorbanceReaderLidStatus.ON), (False, AbsorbanceReaderLidStatus.OFF)],
)
async def test_driver_get_lid_status(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
    parts_aligned: bool,
    module_status: AbsorbanceReaderLidStatus,
) -> None:

    mock_interface.byonoy_get_device_parts_aligned.return_value = (
        MockErrorCode.BYONOY_ERROR_NO_ERROR,
        parts_aligned,
    )

    status = await connected_driver.get_lid_status()

    mock_interface.byonoy_get_device_parts_aligned.assert_called_once()
    assert status == module_status


async def test_driver_get_supported_wavelengths(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
) -> None:
    SUPPORTED_WAVELENGTHS = [450, 500]
    mock_interface.byonoy_abs96_get_available_wavelengths.return_value = (
        MockErrorCode.BYONOY_ERROR_NO_ERROR,
        SUPPORTED_WAVELENGTHS,
    )

    assert not connected_driver._connection._supported_wavelengths

    wavelengths = await connected_driver.get_available_wavelengths()

    mock_interface.byonoy_abs96_get_available_wavelengths.assert_called_once()
    assert connected_driver._connection._supported_wavelengths == SUPPORTED_WAVELENGTHS
    assert wavelengths == SUPPORTED_WAVELENGTHS


async def test_driver_initialize_and_read(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
) -> None:
    # set up mock interface
    connected_driver._connection._supported_wavelengths = [450, 500]
    mock_interface.byonoy_abs96_initialize_single_measurement.return_value = (
        MockErrorCode.BYONOY_ERROR_NO_ERROR
    )
    mock_interface.ByonoyAbs96SingleMeasurementConfig = MagicMock(
        spec=AbsorbanceHidInterface.MeasurementConfig
    )

    # current config should not have been setup yet
    assert not connected_driver._connection._current_config
    await connected_driver.initialize_measurement(450)

    conf = connected_driver._connection._current_config
    assert conf and conf.sample_wavelength == 450
    mock_interface.byonoy_abs96_initialize_single_measurement.assert_called_once_with(
        1, conf
    )

    # setup up mock interface
    MEASURE_RESULT = [0.1] * 96
    mock_interface.byonoy_abs96_single_measure.return_value = (
        MockErrorCode.BYONOY_ERROR_NO_ERROR,
        MEASURE_RESULT,
    )

    result = await connected_driver.get_single_measurement(450)
    mock_interface.byonoy_abs96_single_measure.assert_called_once_with(1, conf)

    assert result == MEASURE_RESULT
