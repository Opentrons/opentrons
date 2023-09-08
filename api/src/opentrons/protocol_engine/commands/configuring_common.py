"""Common configuration command base models."""

from pydantic import BaseModel
from ..resources import pipette_data_provider


class PipetteConfigUpdateResultMixin(BaseModel):
    """A mixin-suitable model for adding pipette config to results."""

    pipette_id: str
    serial_number: str
    config: pipette_data_provider.LoadedStaticPipetteData
