from __future__ import annotations

import asyncio
import re
import subprocess
from dataclasses import dataclass
from concurrent.futures.thread import ThreadPoolExecutor
from functools import partial
from typing import Optional, Union, List, Dict, Literal


from .hid_protocol import HidInterface
from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderPlatePresence,
)
from opentrons.drivers.rpi_drivers.types import USBPort

import pybyonoy_device_library as byonoy  # type: ignore[import-not-found]


TimeoutProperties = Union[Literal["write_timeout"], Literal["timeout"]]


SN_PARSER = re.compile(r'ATTRS{serial}=="(?P<serial>.+?)"')


@dataclass
class DeviceInfo:
    """Dataclass for device information."""

    serial_number: str
    reference_number: str
    version: str


class AsyncByonoy(HidInterface):
    """Async wrapper around Byonoy Device Library."""

    @staticmethod
    def get_byonoy_device_from_sn(sn: str) -> byonoy.ByonoyDevice:
        found = byonoy.byonoy_available_devices()
        for device in found:
            if device.sn == sn:
                return device

    @staticmethod
    def serial_number_from_port(port: str) -> str:
        """
        Get the serial number from a port using udevadm.

        We need to walk up the chain of parent devices to look for the first
        serial number value because the hid interface doesn't provide it.
        """
        output = subprocess.check_output(
            f"udevadm info --name {port} --attribute-walk | grep serial -m1", shell=True
        ).decode()
        m = SN_PARSER.search(output)
        if m:
            return m.group("serial")
        raise RuntimeError(f"Could not find serial number for port: {port}")

    @classmethod
    async def create(
        cls,
        port: str,
        usb_port: USBPort,
        baud_rate: Optional[int] = None,
        timeout: Optional[float] = None,
        write_timeout: Optional[float] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        reset_buffer_before_write: bool = False,
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
        device_sn = cls.serial_number_from_port(port)
        device = await loop.run_in_executor(
            executor=executor, func=partial(cls.get_byonoy_device_from_sn, device_sn)
        )
        return cls(
            device=device,
            executor=executor,
            loop=loop,
            reset_buffer_before_write=reset_buffer_before_write,
        )

    def __init__(
        self,
        device: byonoy.ByonoyDevice,
        executor: ThreadPoolExecutor,
        loop: asyncio.AbstractEventLoop,
        reset_buffer_before_write: bool,
    ) -> None:
        """
        Constructor

        Args:
            serial: connected Serial object
            executor: a thread pool executor
            loop: event loop
        """
        self._device = device
        self._device_handle: Optional[int] = None
        self._executor = executor
        self._loop = loop
        self._reset_buffer_before_write = reset_buffer_before_write
        self._measurement_conf = byonoy.ByonoyAbs96SingleMeasurementConfig()
        self._supported_wavelengths: Optional[list[int]] = None

    def _cleanup(self) -> None:
        self._device_handle = None

    def _open(self) -> None:
        err, device_handle = byonoy.byonoy_open_device(self._device)
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error opening device: {err}")
        self._device_handle = device_handle

    def _free(self) -> None:
        if self._device_handle:
            byonoy.byonoy_free_device(self._device_handle)
            self._cleanup()

    def verify_device_handle(self) -> None:
        assert self._device_handle, RuntimeError("Device handle not set up.")

    def _get_device_information(self) -> byonoy.ByonoyDeviceInfo:
        self.verify_device_handle()
        err, device_info = byonoy.byonoy_get_device_information(self._device_handle)
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error getting device information: {err}")
        return device_info

    def _get_device_status(self) -> byonoy.ByonoyDeviceStatus:
        self.verify_device_handle()
        err, status = byonoy.byonoy_get_device_status(self._device_handle)
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error getting device status: {err}")
        return status

    def _get_slot_status(self) -> byonoy.ByonoyDeviceSlotStatus:
        self.verify_device_handle()
        err, slot_status = byonoy.byonoy_get_device_slot_status(self._device_handle)
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error getting slot status: {err}")
        return slot_status

    def _get_lid_status(self) -> bool:
        self.verify_device_handle()
        lid_on: bool
        err, lid_on = byonoy.byonoy_get_device_parts_aligned(self._device_handle)
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error getting slot status: {err}")
        return lid_on

    def _get_supported_wavelengths(self) -> List[int]:
        self.verify_device_handle()
        wavelengths: List[int]
        err, wavelengths = byonoy.byonoy_abs96_get_available_wavelengths(
            self._device_handle
        )
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error getting supported wavelengths: {err}")
        self._supported_wavelengths = wavelengths
        return wavelengths

    def _initialize_measurement(
        self, conf: byonoy.ByonoyAbs96SingleMeasurementConfig
    ) -> None:
        self.verify_device_handle()
        err = byonoy.byonoy_abs96_initialize_single_measurement(
            self._device_handle, conf
        )
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error initializing measurement: {err}")

    def _single_measurement(
        self, conf: byonoy.ByonoyAbs96SingleMeasurementConfig
    ) -> List[float]:
        self.verify_device_handle()
        measurements: List[float]
        err, measurements = byonoy.byonoy_abs96_single_measure(
            self._device_handle, conf
        )
        if err != byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            raise RuntimeError(f"Error getting single measurement: {err}")
        return measurements

    def _set_sample_wavelength(
        self, wavelength: int
    ) -> byonoy.ByonoyAbs96SingleMeasurementConfig:
        self.verify_device_handle()
        if not self._supported_wavelengths:
            self._get_supported_wavelengths()
        assert self._supported_wavelengths
        if wavelength in self._supported_wavelengths:
            conf = byonoy.ByonoyAbs96SingleMeasurementConfig()
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
        conf = self._set_sample_wavelength(wavelength)
        return self._single_measurement(conf)

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
