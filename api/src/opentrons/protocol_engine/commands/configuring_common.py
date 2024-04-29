"""Common configuration command base models."""

from dataclasses import dataclass
from opentrons.hardware_control.nozzle_manager import (
    NozzleMap,
)
from ..resources import pipette_data_provider


@dataclass
class PipetteConfigUpdateResultMixin:
    """A mixin-suitable model for adding pipette config to private results."""

    pipette_id: str
    serial_number: str
    config: pipette_data_provider.LoadedStaticPipetteData


@dataclass
class PipetteNozzleLayoutResultMixin:
    """A nozzle layout result for updating the pipette state."""

    pipette_id: str

    nozzle_map: NozzleMap
    """A dataclass object holding information about the current nozzle configuration."""
