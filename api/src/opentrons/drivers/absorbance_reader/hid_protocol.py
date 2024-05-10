from typing import (
    Dict,
    Protocol,
    List,
    Tuple,
    ClassVar,
    Literal,
    runtime_checkable,
    TypeVar,
    Generic,
)
from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderPlatePresence,
)
from enum import Enum

Response = TypeVar("Response")


@runtime_checkable
class AbsorbanceHidInterface(Protocol):
    @runtime_checkable
    class Device(Protocol):
        sn: str

    @runtime_checkable
    class ErrorCode(Protocol):
        __members__: Dict[str, int]
        name: str
        value: int

    @runtime_checkable
    class SlotState(Protocol):
        __members__: ClassVar[Dict[str, int]]

    @runtime_checkable
    class MeasurementConfig(Protocol):
        sample_wavelength: int

    @runtime_checkable
    class DeviceInfo(Protocol):
        ref_no: str
        sn: str
        version: str

    @runtime_checkable
    class DeviceState(Protocol):
        __members__: ClassVar[Dict[str, int]]

    def ByonoyAbs96SingleMeasurementConfig(self) -> MeasurementConfig:
        ...

    def byonoy_open_device(self, device: Device) -> Tuple[ErrorCode, int]:
        ...

    def byonoy_free_device(self, device_handle: int) -> Tuple[ErrorCode, bool]:
        ...

    def byonoy_get_device_information(
        self, device_handle: int
    ) -> Tuple[ErrorCode, DeviceInfo]:
        ...

    def byonoy_get_device_status(
        self, device_handle: int
    ) -> Tuple[ErrorCode, DeviceState]:
        ...

    def byonoy_get_device_slot_status(
        self, device_handle: int
    ) -> Tuple[ErrorCode, SlotState]:
        ...

    def byonoy_get_device_parts_aligned(
        self, device_handle: int
    ) -> Tuple[ErrorCode, bool]:
        ...

    def byonoy_abs96_get_available_wavelengths(
        self, device_handle: int
    ) -> Tuple[ErrorCode, List[int]]:
        ...

    def byonoy_abs96_initialize_single_measurement(
        self, device_handle: int, conf: MeasurementConfig
    ) -> ErrorCode:
        ...

    def byonoy_abs96_single_measure(
        self, device_handle: int, conf: MeasurementConfig
    ) -> Tuple[ErrorCode, List[float]]:
        ...

    def byonoy_available_devices(self) -> List[Device]:
        ...
