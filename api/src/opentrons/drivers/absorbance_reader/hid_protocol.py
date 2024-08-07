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
    "ERROR_NO_ERROR",
    "ERROR_UNKNOWN_ERROR",
    "ERROR_DEVICE_CLOSED",
    "ERROR_INVALID_ARGUMENT",
    "ERROR_NO_MEMORY",
    "ERROR_UNSUPPORTED_OPERATION",
    "ERROR_DEVICE_COMMUNICATION_FAILURE",
    "ERROR_DEVICE_OPERATION_FAILED",
    "ERROR_DEVICE_OPEN_PREFIX",
    "ERROR_DEVICE_NOT_FOUND",
    "ERROR_DEVICE_TOO_NEW",
    "ERROR_DEVICE_ALREADY_OPEN",
    "ERROR_FIRMWARE_UPDATE_ERROR_PREFIX",
    "ERROR_FIRMWARE_UPDATE_FILE_NOT_FOUND",
    "ERROR_FIRMWARE_UPDATE_FILE_NOT_VALID",
    "ERROR_FIRMWARE_UPDATE_FAILED",
    "ERROR_FILE_ERROR_PREFIX",
    "ERROR_FILE_WRITE_ERROR",
    "ERROR_MEASUTEMNT_ERROR_PREFIX",
    "ERROR_MEASUTEMNT_SLOT_NOT_EMPTY",
    "ERROR_NOT_INITIALIZED",
    "ERROR_INTERNAL",
]

SlotStateNames = Literal[
    "UNKNOWN",
    "EMPTY",
    "OCCUPIED",
    "UNDETERMINED",
]

DeviceStateNames = Literal[
    "UNKNOWN",
    "OK",
    "BROKEN_FW",
    "ERROR",
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

    def open_device(self, device: Device) -> Tuple[ErrorCode, int]:
        ...

    def free_device(self, device_handle: int) -> Tuple[ErrorCode, bool]:
        ...

    def device_open(self, device_handle: int) -> bool:
        ...

    def get_device_information(
        self, device_handle: int
    ) -> Tuple[ErrorCode, DeviceInfo]:
        ...

    def update_device(self, device_handle: int, firmware_file_path: str) -> ErrorCode:
        ...

    def get_device_status(self, device_handle: int) -> Tuple[ErrorCode, DeviceState]:
        ...

    def get_device_uptime(self, device_handle: int) -> Tuple[ErrorCode, int]:
        ...

    def get_device_slot_status(self, device_handle: int) -> Tuple[ErrorCode, SlotState]:
        ...

    def get_device_parts_aligned(self, device_handle: int) -> Tuple[ErrorCode, bool]:
        ...

    def abs96_get_available_wavelengths(
        self, device_handle: int
    ) -> Tuple[ErrorCode, List[int]]:
        ...

    def abs96_initialize_single_measurement(
        self, device_handle: int, conf: MeasurementConfig
    ) -> ErrorCode:
        ...

    def abs96_single_measure(
        self, device_handle: int, conf: MeasurementConfig
    ) -> Tuple[ErrorCode, List[float]]:
        ...

    def available_devices(self) -> List[Device]:
        ...
