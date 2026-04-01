import asyncio
from concurrent.futures.thread import ThreadPoolExecutor
from enum import Enum
from typing import cast

import pytest
from mock import MagicMock

from opentrons.drivers.absorbance_reader import (
    AbsorbanceHidInterface,
    AbsorbanceReaderDriver,
)
from opentrons.drivers.absorbance_reader.async_byonoy import AsyncByonoy
from opentrons.drivers.types import ABSMeasurementMode, AbsorbanceReaderLidStatus


@pytest.fixture
def mock_interface() -> MagicMock:
    return MagicMock(spec=AbsorbanceHidInterface)


@pytest.fixture
def mock_device() -> MagicMock:
    return MagicMock(spec=AbsorbanceHidInterface.Device)


class MockErrorCode(Enum):
    NO_ERROR = "no_error"
    ERROR = "error"


@pytest.fixture
async def mock_async_byonoy(
    mock_interface: MagicMock, mock_device: MagicMock
) -> AsyncByonoy:
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
    mock_interface.open_device.return_value = (
        MockErrorCode.NO_ERROR,
        1,
    )

    assert not await driver.is_connected()
    await driver.connect()

    mock_interface.open_device.assert_called_once()
    assert await driver.is_connected()
    assert driver._connection._verify_device_handle()
    assert driver._connection._device_handle == 1

    mock_interface.free_device.return_value = MockErrorCode.NO_ERROR
    await driver.disconnect()

    assert not await driver.is_connected()
    assert driver._connection._device_handle is None


async def test_driver_get_device_info(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
) -> None:
    DEVICE_INFO = MagicMock(AbsorbanceHidInterface.DeviceInfo)
    DEVICE_INFO.ref_no = "DE MAA 001"
    DEVICE_INFO.sn = "BYOMAA00013"
    DEVICE_INFO.version = "Absorbance V1.0.2 2024-04-18"

    mock_interface.get_device_information.return_value = (
        MockErrorCode.NO_ERROR,
        DEVICE_INFO,
    )

    info = await connected_driver.get_device_info()

    assert info == {"serial": "BYOMAA00013", "model": "ABS96", "version": "v1.0.2"}
    mock_interface.get_device_information.assert_called_once()
    mock_interface.reset_mock()

    # Test Device info with updated serial format
    DEVICE_INFO.sn = "OPTMAA00034"
    DEVICE_INFO.version = "Absorbance V1.0.2 2024-04-18"

    mock_interface.get_device_information.return_value = (
        MockErrorCode.NO_ERROR,
        DEVICE_INFO,
    )

    info = await connected_driver.get_device_info()

    assert info == {"serial": "OPTMAA00034", "model": "ABS96", "version": "v1.0.2"}
    mock_interface.get_device_information.assert_called_once()
    mock_interface.reset_mock()

    # Test Device info with invalid serial format
    DEVICE_INFO.sn = "YRFGHVMAA00034"
    DEVICE_INFO.version = "Absorbance V1.0.2 2024-04-18"

    mock_interface.get_device_information.return_value = (
        MockErrorCode.NO_ERROR,
        DEVICE_INFO,
    )

    info = await connected_driver.get_device_info()

    assert info == {"serial": "OPTMAA00000", "model": "ABS96", "version": "v1.0.2"}
    mock_interface.get_device_information.assert_called_once()
    mock_interface.reset_mock()

    # Test Device info with updated version format
    DEVICE_INFO.sn = "OPTMAA00034"
    DEVICE_INFO.version = "8"

    mock_interface.get_device_information.return_value = (
        MockErrorCode.NO_ERROR,
        DEVICE_INFO,
    )

    info = await connected_driver.get_device_info()

    assert info == {"serial": "OPTMAA00034", "model": "ABS96", "version": "8"}
    mock_interface.get_device_information.assert_called_once()
    mock_interface.reset_mock()

    # Test Device info with invalid version format
    DEVICE_INFO.sn = "OPTMAA00034"
    DEVICE_INFO.version = "asd"

    mock_interface.get_device_information.return_value = (
        MockErrorCode.NO_ERROR,
        DEVICE_INFO,
    )

    info = await connected_driver.get_device_info()

    assert info == {"serial": "OPTMAA00034", "model": "ABS96", "version": "v0"}
    mock_interface.get_device_information.assert_called_once()
    mock_interface.reset_mock()


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
    mock_interface.get_device_parts_aligned.return_value = (
        MockErrorCode.NO_ERROR,
        parts_aligned,
    )

    status = await connected_driver.get_lid_status()

    mock_interface.get_device_parts_aligned.assert_called_once()
    assert status == module_status


async def test_driver_get_supported_wavelengths(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
) -> None:
    SUPPORTED_WAVELENGTHS = [450, 500]
    mock_interface.abs96_get_available_wavelengths.return_value = (
        MockErrorCode.NO_ERROR,
        SUPPORTED_WAVELENGTHS,
    )

    assert not connected_driver._connection._supported_wavelengths

    wavelengths = await connected_driver.get_available_wavelengths()

    mock_interface.abs96_get_available_wavelengths.assert_called_once()
    assert connected_driver._connection._supported_wavelengths == SUPPORTED_WAVELENGTHS
    assert wavelengths == SUPPORTED_WAVELENGTHS


async def test_driver_initialize_and_read_single(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
) -> None:
    # set up mock interface
    connected_driver._connection._supported_wavelengths = [450, 500]
    mock_interface.abs96_initialize_single_measurement.return_value = (
        MockErrorCode.NO_ERROR
    )

    class MeasurementConfig(AbsorbanceHidInterface.SingleMeasurementConfig):
        def __init__(self) -> None:
            self.sample_wavelength = 0
            self.reference_wavelength = 0

    mock_interface.Abs96SingleMeasurementConfig = MeasurementConfig

    # current config should not have been setup yet
    assert not connected_driver._connection._current_config
    await connected_driver.initialize_measurement([450], mode=ABSMeasurementMode.SINGLE)

    conf = cast(
        AbsorbanceHidInterface.SingleMeasurementConfig,
        connected_driver._connection._current_config,
    )
    assert conf and conf.sample_wavelength == 450
    mock_interface.abs96_initialize_single_measurement.assert_called_once_with(1, conf)

    # setup up mock interface with a single reading
    MEASURE_RESULT = [[0.1] * 96]
    mock_interface.abs96_single_measure.return_value = (
        MockErrorCode.NO_ERROR,
        MEASURE_RESULT,
    )

    result = await connected_driver.get_measurement()
    mock_interface.abs96_single_measure.assert_called_once_with(1, conf)

    assert result == MEASURE_RESULT


async def test_driver_initialize_and_read_multi(
    mock_interface: MagicMock,
    connected_driver: AbsorbanceReaderDriver,
) -> None:
    # set up mock interface
    connected_driver._connection._supported_wavelengths = [450, 500, 600]
    mock_interface.abs96_initialize_multiple_measurement.return_value = (
        MockErrorCode.NO_ERROR
    )

    class MeasurementConfig(AbsorbanceHidInterface.MultiMeasurementConfig):
        def __init__(self) -> None:
            self.sample_wavelengths = [0]

    mock_interface.Abs96MultipleMeasurementConfig = MeasurementConfig

    # current config should not have been setup yet
    assert not connected_driver._connection._current_config
    await connected_driver.initialize_measurement(
        [450, 500, 600], mode=ABSMeasurementMode.MULTI
    )

    conf = cast(
        AbsorbanceHidInterface.MultiMeasurementConfig,
        connected_driver._connection._current_config,
    )
    assert conf and conf.sample_wavelengths == [450, 500, 600]
    mock_interface.abs96_initialize_multiple_measurement.assert_called_once_with(
        1, conf
    )

    # setup up mock interface with multiple readings
    MEASURE_RESULT = [[0.1] * 96, [0.2] * 96, [0.3] * 96]
    mock_interface.abs96_multiple_measure.return_value = (
        MockErrorCode.NO_ERROR,
        MEASURE_RESULT,
    )

    result = await connected_driver.get_measurement()
    mock_interface.abs96_multiple_measure.assert_called_once_with(1, conf)

    assert result == MEASURE_RESULT
