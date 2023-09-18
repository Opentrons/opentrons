"""Common configuration command base models."""

from dataclasses import dataclass
from ..resources import pipette_data_provider


@dataclass
class PipetteConfigUpdateResultMixin:
    """A mixin-suitable model for adding pipette config to results."""

    pipette_id: str
    serial_number: str
    config: pipette_data_provider.LoadedStaticPipetteData
