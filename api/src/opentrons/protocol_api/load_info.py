from dataclasses import dataclass
from typing import Optional
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons.hardware_control.modules.types import ModuleModel
from opentrons.types import Mount, DeckSlotName


@dataclass(frozen=True)
class LabwareLoadInfo:
    """For Opentrons internal use only.

    :meta private:

    Information about a successful labware load.

    This is a separate class from the main user-facing `Labware` class
    because this is easier to construct in unit tests.
    """

    labware_definition: LabwareDefinition
    # todo(mm, 2021-10-11): Namespace, load name, and version can be derived from the
    # definition. Should they be removed from here?
    labware_namespace: str
    labware_load_name: str
    labware_version: int
    deck_slot: DeckSlotName
    on_module: bool = False


@dataclass(frozen=True)
class InstrumentLoadInfo:
    """For Opentrons internal use only.

    :meta private:

    Like `LabwareLoadInfo`, but for instruments (pipettes).
    """

    instrument_load_name: str
    mount: Mount


@dataclass(frozen=True)
class ModuleLoadInfo:
    """For Opentrons internal use only.

    :meta private:

    Like `LabwareLoadInfo`, but for hardware modules.
    """

    module_model: ModuleModel
    deck_slot: DeckSlotName
    configuration: Optional[str]
    module_serial: Optional[str]
