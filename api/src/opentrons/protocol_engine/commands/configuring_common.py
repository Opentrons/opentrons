"""Common configuration command base models."""

from pydantic import BaseModel, Field
from typing import Optional
from dataclasses import dataclass
from opentrons.hardware_control.nozzle_manager import (
    NozzleMap,
)
from ..resources import pipette_data_provider

NOZZLE_NAME_REGEX = "[A-Z][0-100]"


@dataclass
class PipetteConfigUpdateResultMixin:
    """A mixin-suitable model for adding pipette config to results."""

    pipette_id: str
    serial_number: str
    config: pipette_data_provider.LoadedStaticPipetteData


class PipetteNozzleLayoutResultMixin(BaseModel):
    pipette_id: str
    nozzle_map: Optional[NozzleMap] = Field(
        default=None,
        description="A dataclass object holding information about the current nozzle configuration.",
    )


class EmptyNozzleLayoutConfiguration(BaseModel):
    """Empty basemodel to represent a reset to the nozzle configuration. Sending no parameters resets to default."""

    pass


class BaseNozzleLayoutConfiguration(BaseModel):
    """Minimum information required for a new nozzle configuration."""

    primary_nozzle: str = Field(
        ...,
        regex=NOZZLE_NAME_REGEX,
        description="The primary nozzle to use in the layout configuration. This nozzle will update the critical point of the current pipette.",
    )


class RowColumnNozzleLayoutConfiguration(BaseNozzleLayoutConfiguration):
    """Information required for nozzle configurations of type ROW and COLUMN."""

    front_right_nozzle: str = Field(
        ...,
        regex=NOZZLE_NAME_REGEX,
        description="The front right nozzle in your configuration. It should be different than the primary nozzle and form either a full ROW/COLUMN.",
    )


class QuadrantNozzleLayoutConfiguration(RowColumnNozzleLayoutConfiguration):
    """Information required for nozzle configurations of type QUADRANT."""

    back_left_nozzle: str = Field(
        ...,
        regex=NOZZLE_NAME_REGEX,
        description="The back left nozzle in your configuration, which is not necessarily the primary nozzle.",
    )
