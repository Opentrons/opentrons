from typing import (
    Dict,
    Protocol,
    List,
    Literal,
    Tuple,
    runtime_checkable,
    TypeVar,
)

Response = TypeVar("Response")

ErrorCodeNames = Literal[
    "BYONOY_ERROR_NO_ERROR",
    "BYONOY_ERROR_UNKNOWN_ERROR",
    "BYONOY_ERROR_DEVICE_CLOSED",
    "BYONOY_ERROR_INVALID_ARGUMENT",
    "BYONOY_ERROR_NO_MEMORY",
    "BYONOY_ERROR_UNSUPPORTED_OPERATION",
    "BYONOY_ERROR_DEVICE_COMMUNICATION_FAILURE",
    "BYONOY_ERROR_DEVICE_OPERATION_FAILED",
    "BYONOY_ERROR_DEVICE_OPEN_PREFIX",
    "BYONOY_ERROR_DEVICE_NOT_FOUND",
    "BYONOY_ERROR_DEVICE_TOO_NEW",
    "BYONOY_ERROR_DEVICE_ALREADY_OPEN",
    "BYONOY_ERROR_FIRMWARE_UPDATE_ERROR_PREFIX",
    "BYONOY_ERROR_FIRMWARE_UPDATE_FILE_NOT_FOUND",
    "BYONOY_ERROR_FIRMWARE_UPDATE_FILE_NOT_VALID",
    "BYONOY_ERROR_FIRMWARE_UPDATE_FAILED",
    "BYONOY_ERROR_FILE_ERROR_PREFIX",
    "BYONOY_ERROR_FILE_WRITE_ERROR",
    "BYONOY_ERROR_MEASUTEMNT_ERROR_PREFIX",
    "BYONOY_ERROR_MEASUTEMNT_SLOT_NOT_EMPTY",
    "BYONOY_ERROR_NOT_INITIALIZED",
    "BYONOY_ERROR_INTERNAL",
]

SlotStateNames = Literal[
    "BYONOY_SLOT_UNKNOWN",
    "BYONOY_SLOT_EMPTY",
    "BYONOY_SLOT_OCCUPIED",
    "BYONOY_SLOT_UNDETERMINED",
]

DeviceStateNames = Literal[
    "BYONOY_DEVICE_STATE_UNKNOWN",
    "BYONOY_DEVICE_STATE_OK",
    "BYONOY_DEVICE_STATE_BROKEN_FW",
    "BYONOY_DEVICE_STATE_ERROR",
]


@runtime_checkable
class AbsorbanceHidInterface(Protocol):
    @runtime_checkable
    class Device(Protocol):
        sn: str

    @runtime_checkable
    class ErrorCode(Protocol):
        __members__: Dict[ErrorCodeNames, int]
        name: ErrorCodeNames
        value: int

    @runtime_checkable
    class SlotState(Protocol):
        __members__: Dict[SlotStateNames, int]
        name: SlotStateNames
        value: int

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
        __members__: Dict[DeviceStateNames, int]
        name: DeviceStateNames
        value: int

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
