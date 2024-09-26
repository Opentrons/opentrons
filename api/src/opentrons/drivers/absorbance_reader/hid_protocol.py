from typing import (
    Dict,
    Optional,
    Protocol,
    List,
    Literal,
    Tuple,
    Union,
    runtime_checkable,
    TypeVar,
)

Response = TypeVar("Response")

ErrorCodeNames = Literal[
    "NO_ERROR",
    "UNKNOWN_ERROR",
    "DEVICE_CLOSED",
    "INVALID_ARGUMENT",
    "NO_MEMORY",
    "UNSUPPORTED_OPERATION",
    "DEVICE_COMMUNICATION_FAILURE",
    "DEVICE_OPERATION_FAILED",
    "DEVICE_OPEN_PREFIX",
    "DEVICE_NOT_FOUND",
    "DEVICE_TOO_NEW",
    "DEVICE_ALREADY_OPEN",
    "FIRMWARE_UPDATE_ERROR_PREFIX",
    "FIRMWARE_UPDATE_FILE_NOT_FOUND",
    "FIRMWARE_UPDATE_FILE_NOT_VALID",
    "FIRMWARE_UPDATE_FAILED",
    "FILE_ERROR_PREFIX",
    "FILE_WRITE_ERROR",
    "MEASUTEMNT_ERROR_PREFIX",
    "MEASUTEMNT_SLOT_NOT_EMPTY",
    "NOT_INITIALIZED",
    "INTERNAL",
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
    class SingleMeasurementConfig(Protocol):
        sample_wavelength: int
        reference_wavelength: Optional[int]

    @runtime_checkable
    class MultiMeasurementConfig(Protocol):
        sample_wavelengths: List[int]

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

    def Abs96SingleMeasurementConfig(self) -> SingleMeasurementConfig:
        ...

    def Abs96MultipleMeasurementConfig(self) -> MultiMeasurementConfig:
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
        self, device_handle: int, conf: SingleMeasurementConfig
    ) -> ErrorCode:
        ...

    def abs96_initialize_multiple_measurement(
        self, device_handle: int, conf: MultiMeasurementConfig
    ) -> ErrorCode:
        ...

    def abs96_single_measure(
        self, device_handle: int, conf: SingleMeasurementConfig
    ) -> Tuple[ErrorCode, List[float]]:
        ...

    def abs96_multiple_measure(
        self, device_handle: int, conf: MultiMeasurementConfig
    ) -> Tuple[ErrorCode, List[List[float]]]:
        ...

    def available_devices(self) -> List[Device]:
        ...


MeasurementConfig = Union[
    AbsorbanceHidInterface.SingleMeasurementConfig,
    AbsorbanceHidInterface.MultiMeasurementConfig,
]
