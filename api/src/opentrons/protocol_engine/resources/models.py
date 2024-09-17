from dataclasses import dataclass
from typing import Optional

from opentrons_shared_data.labware.labware_definition import LabwareDefinition


@dataclass(frozen=True)
class LoadedLabwareData:
    """The result of a load labware procedure."""

    labware_id: str
    definition: LabwareDefinition
    offsetId: Optional[str]
