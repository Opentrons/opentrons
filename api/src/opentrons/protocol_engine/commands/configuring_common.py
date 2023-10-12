"""Common configuration command base models."""

from pydantic import BaseModel, Field
from dataclasses import dataclass
from ..resources import pipette_data_provider

NOZZLE_NAME_REGEX = "[A-Z][0-100]"


@dataclass
class PipetteConfigUpdateResultMixin:
    """A mixin-suitable model for adding pipette config to results."""

    pipette_id: str
    serial_number: str
    config: pipette_data_provider.LoadedStaticPipetteData


class BaseNozzleLayoutConfiguration(BaseModel):
    """Minimum information required for a nozzle configuration."""

    primary_nozzle: str = Field(
        ...,
        regex=NOZZLE_NAME_REGEX,
        description="The primary nozzle to use in the layout configuration. This nozzle will update the critical point of the current pipette.",
    )


class RowColumnNozzleLayoutConfiguration(BaseNozzleLayoutConfiguration):
    """Information required for nozzle configurations of type ROW and COLUMN."""

    ending_nozzle: str = Field(
        ...,
        regex=NOZZLE_NAME_REGEX,
        description="The ending nozzle of your configuration. It should be different than the primary nozzle and form either a full ROW/COLUMN.",
    )


class QuadrantNozzleLayoutConfiguration(BaseNozzleLayoutConfiguration):
    """Information required for nozzle configurations of type QUADRANT."""

    back_left_nozzle: str = Field(
        ...,
        regex=NOZZLE_NAME_REGEX,
        description="The back left nozzle in your configuration, which is not necessarily the primary nozzle.",
    )
    front_right_nozzle: str = Field(
        ...,
        regex=NOZZLE_NAME_REGEX,
        description="The front right nozzle in your configuration, which is not necessarily the primary nozzle.",
    )
