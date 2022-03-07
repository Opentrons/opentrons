"""Types for an APIv2 protocol to report its activity.

This module is not part of the public Python Protocol API.
It's only for internal Opentrons use.
"""


from dataclasses import dataclass
from typing import Optional, Union
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons.hardware_control.modules.types import ModuleModel
from opentrons.types import Mount, DeckSlotName


@dataclass(frozen=True)
class LabwareLoadInfo:
    """Information about a successful labware load.

    :meta private:

    This is a separate class from the main user-facing `Labware` class
    because this is easier to construct in unit tests.
    """

    labware_definition: LabwareDefinition

    # todo(mm, 2021-10-11): Namespace, load name, and version can be derived from the
    # definition. Should they be removed from here?
    labware_namespace: str
    labware_load_name: str
    labware_version: int

    # If on_module is True, deck_slot is the slot occupied by the module that the
    # labware is on.
    deck_slot: DeckSlotName
    on_module: bool

    # The ID of the labware offset resource that applied to this labware load,
    # if there was one.
    offset_id: Optional[str]

    # user-specified label if present
    labware_display_name: Optional[str]


@dataclass(frozen=True)
class InstrumentLoadInfo:
    """Like `LabwareLoadInfo`, but for instruments (pipettes).

    :meta private:
    """

    instrument_load_name: str
    mount: Mount


@dataclass(frozen=True)
class ModuleLoadInfo:
    """Like `LabwareLoadInfo`, but for hardware modules.

    :meta private:
    """

    requested_model: ModuleModel
    loaded_model: ModuleModel

    deck_slot: DeckSlotName
    configuration: Optional[str]
    module_serial: str


LoadInfo = Union[LabwareLoadInfo, InstrumentLoadInfo, ModuleLoadInfo]
