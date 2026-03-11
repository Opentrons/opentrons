from dataclasses import dataclass
from enum import Enum
from typing import Dict


class SoundProfile(Enum):
    FULL_SOUND = 1
    ONLY_ERROR = 2
    OFF = 3


@dataclass
class BarcodeModuleInfo:
    serial: str
    oem_serial: str
    manufacturing_date: str
    firmware_version: str
    decoder_version: str
    hardware_version: str
    product_name: str
    data_formating_version: str

    def to_dict(self) -> Dict[str, str]:
        """Build command."""
        return {
            "serial": self.serial,
            "oem_serial": self.oem_serial,
            "manufacturing_date": self.manufacturing_date,
            "firmware_version": self.firmware_version,
            "decoder_version": self.decoder_version,
            "hardware_version": self.hardware_version,
            "product_name": self.product_name,
            "data_formating_version": self.data_formating_version,
        }
