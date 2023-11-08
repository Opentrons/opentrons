"""Common configuration command base models."""

from pydantic import BaseModel, Field
from typing import Optional
from dataclasses import dataclass
from opentrons.hardware_control.nozzle_manager import (
    NozzleMap,
)
from ..resources import pipette_data_provider


@dataclass
class PipetteConfigUpdateResultMixin:
    """A mixin-suitable model for adding pipette config to results."""

    pipette_id: str
    serial_number: str
    config: pipette_data_provider.LoadedStaticPipetteData


class PipetteNozzleLayoutResultMixin(BaseModel):
    """A nozzle layout result for updating the pipette state."""

    pipette_id: str
    nozzle_map: Optional[NozzleMap] = Field(
        default=None,
        description="A dataclass object holding information about the current nozzle configuration.",
    )
