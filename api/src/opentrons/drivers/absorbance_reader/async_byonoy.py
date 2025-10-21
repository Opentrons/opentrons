import asyncio
import os
import re
from concurrent.futures.thread import ThreadPoolExecutor
from functools import partial
from typing import Any, Optional, List, Dict, Tuple

from .hid_protocol import (
    AbsorbanceHidInterface as AbsProtocol,
    ErrorCodeNames,
    DeviceStateNames,
    SlotStateNames,
    MeasurementConfig,
)
from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderPlatePresence,
    AbsorbanceReaderDeviceState,
    ABSMeasurementMode,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.modules.errors import AbsorbanceReaderDisconnectedError


SN_PARSER = re.compile(r'ATTRS{serial}=="(?P<serial>.+?)"')
# match semver V0.0.0 (old format) or one integer (latest format)
VERSION_PARSER = re.compile(r"(?P<version>(V\d+\.\d+\.\d+|^\d+$))")
SERIAL_PARSER = re.compile(r"(?P<serial>(OPT|BYO)[A-Z]{3}[0-9]+)")


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
    ) -> "AsyncByonoy":
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

        import byonoy_devices as byonoy  # type: ignore[import-not-found]

        interface: AbsProtocol = byonoy

        device_sn = cls.serial_number_from_port(usb_port.name)
        found: List[AbsProtocol.Device] = await loop.run_in_executor(
            executor=executor, func=byonoy.available_devices
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
        self._current_config: Optional[MeasurementConfig] = None

    async def open(self) -> bool:
        """
        Open the connection.

        Returns: boolean denoting connection success.
        """

        err, device_handle = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.open_device, self._device),
        )
        self._raise_if_error(err.name, f"Error opening device: {err}")
        self._device_handle = device_handle
        return bool(device_handle)

    async def close(self) -> None:
        """Close the connection."""
        handle = self._verify_device_handle()
        await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.free_device, handle),
        )
        self._device_handle = None

    async def is_open(self) -> bool:
        """True if connection is open."""
        if self._device_handle is None:
            return False
        handle = self._verify_device_handle()
        return await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.device_open, handle),
        )

    async def get_device_information(self) -> Dict[str, str]:
        """Get serial number and version info."""
        handle = self._verify_device_handle()
        err, device_info = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.get_device_information, handle),
        )
        self._raise_if_error(err.name, f"Error getting device information: {err}")
        serial_match = SERIAL_PARSER.match(device_info.sn)
        version_match = VERSION_PARSER.search(device_info.version)
        serial = serial_match["serial"].strip() if serial_match else "OPTMAA00000"
        version = version_match["version"].lower() if version_match else "v0"
        info = {
            "serial": serial,
            "version": version,
            "model": "ABS96",
        }
        return info

    async def get_device_status(self) -> AbsorbanceReaderDeviceState:
        """Get state information of the device."""
        handle = self._verify_device_handle()
        err, status = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.get_device_status, handle),
        )
        self._raise_if_error(err.name, f"Error getting device status: {err}")
        return self.convert_device_state(status.name)

    async def update_firmware(self, firmware_file_path: str) -> Tuple[bool, str]:
        """Updates the firmware of the device."""
        handle = self._verify_device_handle()
        if not os.path.exists(firmware_file_path):
            return False, f"Firmware file not found: {firmware_file_path}"
        err = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.update_device, handle, firmware_file_path),
        )
        if err.name != "NO_ERROR":
            return False, f"Byonoy update failed with error: {err}"
        return True, ""

    async def get_device_uptime(self) -> int:
        """Get how long in seconds the device has been running for."""
        handle = self._verify_device_handle()
        err, uptime = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.get_device_uptime, handle),
        )
        self._raise_if_error(err.name, "Error getting device uptime: ")
        return uptime

    async def get_lid_status(self) -> AbsorbanceReaderLidStatus:
        """Get the state of the absorbance lid."""
        handle = self._verify_device_handle()
        err, lid_info = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.get_device_parts_aligned, handle),
        )
        self._raise_if_error(err.name, f"Error getting lid status: {err}")
        return (
            AbsorbanceReaderLidStatus.ON if lid_info else AbsorbanceReaderLidStatus.OFF
        )

    async def get_supported_wavelengths(self) -> list[int]:
        """Get a list of the wavelength readings this device supports."""
        handle = self._verify_device_handle()
        err, wavelengths = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.abs96_get_available_wavelengths, handle),
        )
        self._raise_if_error(err.name, "Error getting available wavelengths: ")
        self._supported_wavelengths = wavelengths
        return wavelengths

    async def get_measurement(self) -> List[List[float]]:
        """Gets one or more measurements based on the current configuration."""
        handle = self._verify_device_handle()
        assert (
            self._current_config is not None
        ), "Cannot get measurement without initializing."
        measure_func: Any = self._interface.abs96_single_measure
        if isinstance(self._current_config, AbsProtocol.MultiMeasurementConfig):
            measure_func = self._interface.abs96_multiple_measure
        err, measurements = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(
                measure_func,
                handle,
                self._current_config,
            ),
        )
        self._raise_if_error(err.name, f"Error getting measurement: {err}")
        return measurements if isinstance(measurements[0], List) else [measurements]  # type: ignore

    async def get_plate_presence(self) -> AbsorbanceReaderPlatePresence:
        """Get the state of the plate for the reader."""
        handle = self._verify_device_handle()
        err, presence = await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._interface.get_device_slot_status, handle),
        )
        self._raise_if_error(err.name, f"Error getting slot status: {err}")
        return self.convert_plate_presence(presence.name)

    def _get_supported_wavelengths(self) -> List[int]:
        handle = self._verify_device_handle()
        wavelengths: List[int]
        err, wavelengths = self._interface.abs96_get_available_wavelengths(handle)
        self._raise_if_error(err.name, f"Error getting available wavelengths: {err}")
        self._supported_wavelengths = wavelengths
        return wavelengths

    def _initialize_measurement(self, conf: MeasurementConfig) -> None:
        handle = self._verify_device_handle()
        if isinstance(conf, AbsProtocol.SingleMeasurementConfig):
            err = self._interface.abs96_initialize_single_measurement(handle, conf)
        else:
            err = self._interface.abs96_initialize_multiple_measurement(handle, conf)
        self._raise_if_error(err.name, f"Error initializing measurement: {err}")
        self._current_config = conf

    def _initialize(
        self,
        mode: ABSMeasurementMode,
        wavelengths: List[int],
        reference_wavelength: Optional[int] = None,
    ) -> None:
        if not self._supported_wavelengths:
            self._get_supported_wavelengths()
        assert self._supported_wavelengths
        conf: MeasurementConfig
        if set(wavelengths).issubset(self._supported_wavelengths):
            if mode == ABSMeasurementMode.SINGLE:
                conf = self._interface.Abs96SingleMeasurementConfig()
                conf.sample_wavelength = wavelengths[0] or 0
                conf.reference_wavelength = reference_wavelength or 0
            else:
                conf = self._interface.Abs96MultipleMeasurementConfig()
                conf.sample_wavelengths = wavelengths
        else:
            raise ValueError(
                f"Unsupported wavelength: {wavelengths}, expected: {self._supported_wavelengths}"
            )
        self._initialize_measurement(conf)

    async def initialize(
        self,
        mode: ABSMeasurementMode,
        wavelengths: List[int],
        reference_wavelength: Optional[int] = None,
    ) -> None:
        """initialize the device so we can start reading samples from it."""
        await self._loop.run_in_executor(
            executor=self._executor,
            func=partial(self._initialize, mode, wavelengths, reference_wavelength),
        )

    def _verify_device_handle(self) -> int:
        assert self._device_handle is not None, RuntimeError(
            "Device handle not set up."
        )
        return self._device_handle

    def _raise_if_error(
        self,
        err_name: ErrorCodeNames,
        msg: str = "Error occurred: ",
    ) -> None:
        if err_name in [
            "DEVICE_CLOSED",
            "DEVICE_COMMUNICATION_FAILURE",
            "UNSUPPORTED_OPERATION",
        ]:
            raise AbsorbanceReaderDisconnectedError(self._device.sn)
        if err_name != "NO_ERROR":
            raise RuntimeError(msg, err_name)

    @staticmethod
    def convert_device_state(
        device_state: DeviceStateNames,
    ) -> AbsorbanceReaderDeviceState:
        state_map: Dict[DeviceStateNames, AbsorbanceReaderDeviceState] = {
            "UNKNOWN": AbsorbanceReaderDeviceState.UNKNOWN,
            "OK": AbsorbanceReaderDeviceState.OK,
            "BROKEN_FW": AbsorbanceReaderDeviceState.BROKEN_FW,
            "ERROR": AbsorbanceReaderDeviceState.ERROR,
        }
        return state_map[device_state]

    @staticmethod
    def convert_plate_presence(
        slot_state: SlotStateNames,
    ) -> AbsorbanceReaderPlatePresence:
        state_map: Dict[SlotStateNames, AbsorbanceReaderPlatePresence] = {
            "UNKNOWN": AbsorbanceReaderPlatePresence.UNKNOWN,
            "EMPTY": AbsorbanceReaderPlatePresence.ABSENT,
            "OCCUPIED": AbsorbanceReaderPlatePresence.PRESENT,
            "UNDETERMINED": AbsorbanceReaderPlatePresence.UNKNOWN,
        }
        return state_map[slot_state]
