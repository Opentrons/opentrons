# from .abstract import AbstractPlateReaderDriver
from dataclasses import dataclass
from typing import Optional, Dict, List, Literal
import pybyonoy_device_library as byonoy


VENDOR_ID = Literal[208]
PRODUCT_ID = Literal[153]



class AbsorbanceReaderDriver:

    def __init__(self, device: byonoy.ByonoyDevice):
        self._device = device
        self._device_handle = None
        self._measurement_config = byonoy.ByonoyAbs96SingleMeasurementConfig()
        self._info = ByonoyDeviceInfo.create(device)

    def create(cls, serial_number: str) -> byonoy.ByonoyDevice:
        for d in byonoy.byonoy_available_devices():
            if d.sn == serial_number and \
                d.type == byonoy.ByonoyDeviceTypes.Byonoy_Absorbance96:
                return cls(device=d)

    def connect(self) -> None:
        """Connect to plate reader"""
        err, handle = byonoy.byonoy_open_device(self._device)
        if err == byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            self._device_handle = handle

    def disconnect(self) -> None:
        """Disconnect from thermocycler"""
        byonoy.byonoy_free_device(self._device_handle)

    def is_connected(self) -> bool:
        """Check connection"""
        return self._device_handle is not None

    def is_lid_on(self) -> bool:
        """Send get lid status command"""
        err, lid_on = byonoy.byonoy_get_device_parts_aligned(self._device_handle)
        if err == byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            return lid_on

    def set_wavelength(self, wavelength_nm: int) -> None:
        """Set the wavelength."""
        supported = self.supported_wavelengths()
        if wavelength_nm in supported:
            self._measurement_config.sample_wavelength = wavelength_nm

    def get_supported_wavelengths(self) -> List[int]:
        """Send get supported wavelength command."""
        err, wavelengths = byonoy.byonoy_abs96_available_wavelengths_supported(self._device_handle)
        if err == byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            return wavelengths

    def get_plate_status(self) -> byonoy.ByonoyDeviceSlotState:
        """Send get plate status command."""
        err, status = byonoy.byonoy_device_slot_status_supported(self._device_handle)
        if err == byonoy.ByonoyErrorCode.BYONOY_ERROR_NO_ERROR:
            return status

    def get_device_info(self) -> ByonoyDeviceInfo:
        """Send get device info command."""
        return self._info
