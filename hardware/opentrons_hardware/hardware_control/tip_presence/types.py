import dataclasses
from typing import Callable
from typing_extensions import Literal

from opentrons_hardware.firmware_bindings.constants import SensorId


@dataclasses.dataclass
class TipNotification:
    sensor: SensorId
    presence: bool


TipChangeListener = Callable[[TipNotification], None]
