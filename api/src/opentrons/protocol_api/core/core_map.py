"""Map equipment cores to public PAPI objects."""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, Union

from .common import ModuleCore, LabwareCore

if TYPE_CHECKING:
    from ..labware import Labware
    from ..module_contexts import ModuleContext


class LoadedCoreMap:
    """A map of equipment (labware, modules) cores to public PAPI instances.

    This object keeps track of every core instance that has been created
    so that later, those cores can be used to look up the public PAPI objects
    they represent.

    This linkage creates a circular dependency, but keeps it contained to this instance.
    """

    def get(
        self, equipment_core: Union[LabwareCore, ModuleCore, None]
    ) -> Union[Labware, ModuleContext[Any]]:
        """Given a core, get the public PAPI object it represents."""
        raise NotImplementedError("LoadedCoreMap.get not implemented")
