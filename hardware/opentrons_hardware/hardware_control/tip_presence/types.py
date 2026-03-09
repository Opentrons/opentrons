"""Tip presence types."""
import dataclasses
from typing import Callable

from opentrons_hardware.firmware_bindings.constants import SensorId


@dataclasses.dataclass
class TipNotification:
    """Represents a tip update received from a pipette."""

    sensor: SensorId
    presence: bool


TipChangeListener = Callable[[TipNotification], None]
