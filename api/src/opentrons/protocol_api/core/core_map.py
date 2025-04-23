"""Map equipment cores to public PAPI objects."""

from __future__ import annotations

from typing import TYPE_CHECKING, Dict, Union
from typing import overload, Callable

from .common import ModuleCore, LabwareCore

if TYPE_CHECKING:
    from ..labware import Labware
    from ..protocol_context import ModuleTypes


class LoadedCoreMap:
    """A map of equipment (labware, modules) cores to public PAPI instances.

    This object keeps track of every core instance that has been created
    so that later, those cores can be used to look up the public PAPI objects
    they represent.

    This linkage creates a circular dependency, but keeps it contained to this instance.
    """

    def __init__(self) -> None:
        self._contexts_by_core: Dict[
            Union[LabwareCore, ModuleCore],
            Union[Labware, ModuleTypes],
        ] = {}

    @overload
    def add(self, core: LabwareCore, context: Labware) -> None:
        ...

    @overload
    def add(self, core: ModuleCore, context: ModuleTypes) -> None:
        ...

    def add(
        self,
        core: Union[LabwareCore, ModuleCore],
        context: Union[Labware, ModuleTypes],
    ) -> None:
        """Add a core and its associated public PAPI object."""
        self._contexts_by_core[core] = context

    @overload
    def get(self, core: LabwareCore) -> Labware:
        ...

    @overload
    def get(self, core: ModuleCore) -> ModuleTypes:
        ...

    @overload
    def get(self, core: None) -> None:
        ...

    def get(
        self, core: Union[LabwareCore, ModuleCore, None]
    ) -> Union[Labware, ModuleTypes, None]:
        """Given a core, get the public PAPI object it represents."""
        return self._contexts_by_core[core] if core is not None else None

    def get_or_add(
        self, core: LabwareCore, context_builder: Callable[[LabwareCore], Labware]
    ) -> Labware:
        try:
            return self.get(core)
        except KeyError:
            pass
        context = context_builder(core)
        self.add(core, context)
        return context
