import pybyonoy_device_library as byonoy
from typing import Dict
from enum import Enum
from dataclasses import dataclass
import asyncio


class ErrorCode(Enum):
    
    no_error = 1

class PlateReaderType(Enum):

    ABSORBANCE: int = 1


def get_plate_reader_type(type: byonoy.ByonoyDeviceTypes) -> PlateReaderType:
    _MAP = {
        byonoy.ByonoyDeviceTypes.Byonoy_Absorbance96: PlateReaderType.ABSORBANCE,
    }
    found = _MAP.get(type)


@dataclass(frozen=True)
class ByonoyDeviceInfo:

    device_type: PlateReaderType
    serial_number: str
    vendor_id: int
    product_id: int

    @classmethod
    def create(cls, device: byonoy.ByonoyDevice):
        return cls(
            device_type=PlateReaderType.from_byonoy_type(device.type),
            serial_number=device.sn,
            vendor_id=device.vid,
            product_id=device.pid
        )


class ByonoyInterface:
    def __init__(self):
        self._task = None
        
    def start(self) -> None:
        if self._task:
            log.warning("hid interface task already running")
            return
        self._task = asyncio.get_event_loop().create_task(self._read_task_shield())
    
    async def available_devices() -> List[ByonoyDeviceInfo]:
        return [
            ByonoyDeviceInfo.create(d)
            for d in byonoy.byonoy_available_devices()
        ]

    async def connect():
        handle = byonoy.
        return handle
        
    async def send(self)
    async def ensure_send(self):
    
    