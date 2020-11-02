from enum import Enum, auto
from typing import TYPE_CHECKING, Optional, Union, cast, Tuple

if TYPE_CHECKING:
    from opentrons.protocol_api.labware import Labware, Well
    from opentrons.protocols.geometry.module_geometry import ModuleGeometry


LabwareLike = Union[
    'Labware',
    'Well',
    str,
    'ModuleGeometry',
    'LabwareLikeWrapper',
    None
]


class LabwareLikeType(int, Enum):
    LABWARE = auto()
    SLOT = auto()
    WELL = auto()
    MODULE = auto()
    NONE = auto()


class LabwareLikeWrapper:
    def __init__(self, labware_like: LabwareLike):
        """
        Create a labware like object. Used by Location object's labware field.
        """
        # Import locally to avoid circular dependency
        from opentrons.protocol_api.labware import Labware, Well
        from opentrons.protocols.geometry.module_geometry import ModuleGeometry

        self._labware_like = labware_like
        self._type = LabwareLikeType.NONE

        if isinstance(self._labware_like, Well):
            self._type = LabwareLikeType.WELL
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, Labware):
            self._type = LabwareLikeType.LABWARE
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, str):
            self._type = LabwareLikeType.SLOT
            self._as_str = self._labware_like
        elif isinstance(self._labware_like, ModuleGeometry):
            self._type = LabwareLikeType.MODULE
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, LabwareLikeWrapper):
            self._type = self._labware_like._type
            self._labware_like = self._labware_like.object
        else:
            self._as_str = ""

    @property
    def object(self) -> LabwareLike:
        return self._labware_like

    @property
    def object_type(self) -> LabwareLikeType:
        return self._type

    @property
    def has_parent(self) -> bool:
        return self._type in {LabwareLikeType.LABWARE,
                              LabwareLikeType.WELL,
                              LabwareLikeType.MODULE}

    @property
    def parent(self) -> Optional['LabwareLikeWrapper']:
        if self.has_parent:
            return LabwareLikeWrapper(self.object.parent)
        return None

    @property
    def is_well(self) -> bool:
        return self.object_type == LabwareLikeType.WELL

    @property
    def is_labware(self) -> bool:
        return self.object_type == LabwareLikeType.LABWARE

    @property
    def is_slot(self) -> bool:
        return self.object_type == LabwareLikeType.SLOT

    def as_well(self) -> 'Well':
        # Import locally to avoid circular dependency
        from opentrons.protocol_api.labware import Well
        return cast(Well, self.object)

    def as_labware(self) -> 'Labware':
        # Import locally to avoid circular dependency
        from opentrons.protocol_api.labware import Labware
        return cast(Labware, self.object)

    def split_labware(self) -> Tuple[Optional['Labware'], Optional['Well']]:
        """Attempt to split into a labware and well."""
        if self.is_labware:
            return self.as_labware(), None
        elif self.is_well and self.parent:
            return self.parent.as_labware(), self.as_well(),
        else:
            return None, None

    def __str__(self) -> str:
        return self._as_str

    def __repr__(self) -> str:
        return str(self)

    def __eq__(self, other):
        return other is not None and \
               isinstance(other, LabwareLikeWrapper) and \
               self.object == other.object
