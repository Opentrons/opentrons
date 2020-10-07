from enum import Enum, auto
from typing import TYPE_CHECKING, Optional

from opentrons.types import LocationLabware

if TYPE_CHECKING:
    from opentrons.protocol_api.labware import Labware, Well
    from opentrons.protocols.geometry.module_geometry import ModuleGeometry


class LabwareLikeType(int, Enum):
    labware = auto()
    name_only = auto()
    well = auto()
    module = auto()
    none = auto()


class LabwareLike:
    def __init__(self, labware_like: LocationLabware):
        """
        Create a labware like object. Used by Location object's labware field.
        """
        # Import locally to avoid circular dependency
        from opentrons.protocol_api.labware import Labware, Well
        from opentrons.protocols.geometry.module_geometry import ModuleGeometry

        self._labware_like = labware_like
        self._type = LabwareLikeType.none

        if isinstance(self._labware_like, Well):
            self._type = LabwareLikeType.well
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, Labware):
            self._type = LabwareLikeType.labware
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, str):
            self._type = LabwareLikeType.name_only
            self._as_str = self._labware_like
        elif isinstance(self._labware_like, ModuleGeometry):
            self._type = LabwareLikeType.module
            self._as_str = repr(self._labware_like)
        else:
            self._as_str = ""

    @property
    def object(self) -> LocationLabware:
        return self._labware_like

    @property
    def object_type(self) -> LabwareLikeType:
        return self._type

    @property
    def has_parent(self) -> bool:
        return self._type in {LabwareLikeType.labware,
                              LabwareLikeType.well,
                              LabwareLikeType.module}

    @property
    def parent(self) -> Optional['LabwareLike']:
        if self.has_parent:
            return LabwareLike(self.object.parent)
        return None

    def __str__(self) -> str:
        return self._as_str

    def __repr__(self) -> str:
        return str(self)

    def __eq__(self, other):
        return other is not None and \
            isinstance(other, LabwareLike) and \
            self.object == other.object
