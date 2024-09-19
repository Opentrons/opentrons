from dataclasses import dataclass
from typing import Optional

from opentrons.protocol_engine.types import LabwareLocation
from opentrons_shared_data.labware.labware_definition import LabwareDefinition


@dataclass(frozen=True)
class LoadedLabwareData:
    """The result of a load labware procedure."""

    labware_id: str
    definition: LabwareDefinition
    offsetId: Optional[str]


@dataclass(frozen=True)
class ReloadedLabwareData:
    """The result of a reload labware procedure."""

    location: LabwareLocation
    offsetId: Optional[str]
