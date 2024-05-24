from __future__ import annotations

import asyncio
import re
from concurrent.futures.thread import ThreadPoolExecutor
from functools import partial
from typing import Optional, List, Dict


from .hid_protocol import (
    AbsorbanceHidInterface as AbsProtocol,
    ErrorCodeNames,
    DeviceStateNames,
)
from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderPlatePresence,
    AbsorbanceReaderDeviceState,
)
from opentrons.drivers.rpi_drivers.types import USBPort


SN_PARSER = re.compile(r'ATTRS{serial}=="(?P<serial>.+?)"')


class AsyncByonoy:
    """Async wrapper around Byonoy Device Library."""

    @staticmethod
    def match_device_with_sn(
        sn: str, devices: List[AbsProtocol.Device]
    ) -> AbsProtocol.Device:
        for device in devices:
            if device.sn == sn:
                return device
        raise RuntimeError(f"Unavailble module with serial number: {sn}")

    @staticmethod
    def serial_number_from_port(name: str) -> str:
        """
        Get the serial number from a port using pyusb.
        """
        import usb.core as usb_core  # type: ignore[import-untyped]

        port_numbers = tuple(int(s) for s in name.split("-")[1].split("."))
        device = usb_core.find(port_numbers=port_numbers)
        if device:
            return str(device.serial_number)
        raise RuntimeError(f"Could not find serial number for port: {name}")

    @classmethod
    async def create(
        cls,
        port: str,
        usb_port: USBPort,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> AsyncByonoy:
        """
        Create an AsyncByonoy instance.

        Args:
            port: url or port name
            baud_rate: the baud rate
            timeout: optional timeout in seconds
            write_timeout: optional write timeout in seconds
            loop: optional event loop. if None get_running_loop will be used
            reset_buffer_before_write: reset the serial input buffer before
             writing to it
        """
        loop = loop or asyncio.get_running_loop()
        executor = ThreadPoolExecutor(max_workers=1)

        import pybyonoy_device_library as byonoy  # type: ignore[import-not-found]

        interface: AbsProtocol = byonoy

        device_sn = cls.serial_number_from_port(usb_port.name)
        found: List[AbsProtocol.Device] = await loop.run_in_executor(
            executor=executor, func=byonoy.byonoy_available_devices
        )
        device = cls.match_device_with_sn(device_sn, found)

        return cls(
            interface=interface,
            device=device,
            executor=executor,
            loop=loop,
        )

    def __init__(
        self,
        interface: AbsProtocol,
        device: AbsProtocol.Device,
        executor: ThreadPoolExecutor,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        """
        Constructor

        Args:
            serial: connected Serial object
            executor: a thread pool executor
            loop: event loop
        """
        self._interface = interface
        self._device = device
        self._executor = executor
        self._loop = loop
        self._supported_wavelengths: Optional[list[int]] = None
        self._device_handle: Optional[int] = None
        self._current_config: Optional[AbsProtocol.MeasurementConfig] = None

    def _cleanup(self) -> None:
        self._device_handle = None

    def _open(self) -> None:
        err, device_handle = self._interface.byonoy_open_device(self._device)
        if err.name != "BYONOY_ERROR_NO_ERROR":
            raise RuntimeError(f"Error opening device: {err}")
        self._device_handle = device_handle

    def _free(self) -> None:
        if self._device_handle:
            self._interface.byonoy_free_device(self._device_handle)
            self._cleanup()

    def verify_device_handle(self) -> int:
        assert self._device_handle is not None, RuntimeError(
            "Device handle not set up."
        )
        return self._device_handle

    def _raise_if_error(
        self,
        err_name: ErrorCodeNames,
        msg: str = "Error occurred: ",
    ) -> None:
        if err_name != "BYONOY_ERROR_NO_ERROR":
            raise RuntimeError(msg, err_name)

    def _get_device_information(self) -> AbsProtocol.DeviceInfo:
        handle = self.verify_device_handle()
        err, device_info = self._interface.byonoy_get_device_information(handle)
        self._raise_if_error(err.name, "Error getting device information: ")
        return device_info

    def _get_device_status(self) -> AbsProtocol.DeviceState:
        handle = self.verify_device_handle()
        err, status = self._interface.byonoy_get_device_status(handle)
        self._raise_if_error(err.name, "Error getting device status: ")
        return status

    def _get_slot_status(self) -> AbsProtocol.SlotState:
        handle = self.verify_device_handle()
        err, slot_status = self._interface.byonoy_get_device_slot_status(handle)
        self._raise_if_error(err.name, "Error getting slot status: ")
        return slot_status

    def _get_lid_status(self) -> bool:
        handle = self.verify_device_handle()
        lid_on: bool
        err, lid_on = self._interface.byonoy_get_device_parts_aligned(handle)
        self._raise_if_error(err.name, "Error getting lid status: ")
        return lid_on

    def _get_supported_wavelengths(self) -> List[int]:
        handle = self.verify_device_handle()
        wavelengths: List[int]
        err, wavelengths = self._interface.byonoy_abs96_get_available_wavelengths(
            handle
        )
        self._raise_if_error(err.name, "Error getting available wavelengths: ")
        self._supported_wavelengths = wavelengths
        return wavelengths

    def _initialize_measurement(self, conf: AbsProtocol.MeasurementConfig) -> None:
        handle = self.verify_device_handle()
        err = self._interface.byonoy_abs96_initialize_single_measurement(handle, conf)
        self._raise_if_error(err.name, "Error initializing measurement: ")
        self._current_config = conf

    def _single_measurement(self, conf: AbsProtocol.MeasurementConfig) -> List[float]:
        handle = self.verify_device_handle()
        measurements: List[float]
        err, measurements = self._interface.byonoy_abs96_single_measure(handle, conf)
        self._raise_if_error(err.name, "Error getting single measurement: ")
        return measurements

    def _set_sample_wavelength(self, wavelength: int) -> AbsProtocol.MeasurementConfig:
        if not self._supported_wavelengths:
            self._get_supported_wavelengths()
        assert self._supported_wavelengths
        if wavelength in self._supported_wavelengths:
            conf = self._interface.ByonoyAbs96SingleMeasurementConfig()
            conf.sample_wavelength = wavelength
            return conf
        else:
            raise ValueError(
                f"Unsupported wavelength: {wavelength}, expected: {self._supported_wavelengths}"
            )

    def _initialize(self, wavelength: int) -> None:
        conf = self._set_sample_wavelength(wavelength)
        self._initialize_measurement(conf)

    def _get_single_measurement(self, wavelength: int) -> List[float]:
        initialized = self._current_config
        assert initialized and initialized.sample_wavelength == wavelength
        return self._single_measurement(initialized)

    async def open(self) -> None:
        """
        Open the connection.

        Returns: None
        """
        return await self._loop.run_in_executor(
            executor=self._executor, func=self._open
        )

    async def close(self) -> None:
        """
        Close the connection

        Returns: None
        """
        await self._loop.run_in_executor(executor=self._executor, func=self._free)

    async def is_open(self) -> bool:
        """
        Check if connection is open.

        Returns: boolean
        """
        return self._device_handle is not None

    async def get_device_static_info(self) -> Dict[str, str]:
        return {
            "serial": self._device.sn,
            "model": "ABS96",
            "version": "1.0",
        }

    async def get_device_information(self) -> Dict[str, str]:
        device_info = await self._loop.run_in_executor(
            executor=self._executor, func=self._get_device_information
        )
        return {
            "serial_number": device_info.sn,
            "reference_number": device_info.ref_no,
            "version": device_info.version,
        }

    async def get_lid_status(self) -> AbsorbanceReaderLidStatus:
        lid_info = await self._loop.run_in_executor(
            executor=self._executor, func=self._get_lid_status
        )
        return (
            AbsorbanceReaderLidStatus.ON if lid_info else AbsorbanceReaderLidStatus.OFF
        )

    async def get_supported_wavelengths(self) -> list[int]:
        return await self._loop.run_in_executor(
            executor=self._executor, func=self._get_supported_wavelengths
        )

    async def initialize(self, wavelength: int) -> None:
        return await self._loop.run_in_executor(
            executor=self._executor, func=partial(self._initialize, wavelength)
        )

    async def get_single_measurement(self, wavelength: int) -> List[float]:
        return await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._get_single_measurement, wavelength),
        )

    async def get_plate_presence(self) -> AbsorbanceReaderPlatePresence:
        return AbsorbanceReaderPlatePresence.UNKNOWN

    async def get_device_status(self) -> AbsorbanceReaderDeviceState:
        status = await self._loop.run_in_executor(
            executor=self._executor,
            func=self._get_device_status,
        )
        return self.convert_device_state(status.name)

    @staticmethod
    def convert_device_state(
        device_state: DeviceStateNames,
    ) -> AbsorbanceReaderDeviceState:
        state_map: Dict[DeviceStateNames, AbsorbanceReaderDeviceState] = {
            "BYONOY_DEVICE_STATE_UNKNOWN": AbsorbanceReaderDeviceState.UNKNOWN,
            "BYONOY_DEVICE_STATE_OK": AbsorbanceReaderDeviceState.OK,
            "BYONOY_DEVICE_STATE_BROKEN_FW": AbsorbanceReaderDeviceState.BROKEN_FW,
            "BYONOY_DEVICE_STATE_ERROR": AbsorbanceReaderDeviceState.ERROR,
        }
        return state_map[device_state]
