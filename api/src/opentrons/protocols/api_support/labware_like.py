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
    labware = auto()
    slot_name = auto()
    well = auto()
    module = auto()
    none = auto()


class LabwareLikeWrapper:
    def __init__(self, labware_like: LabwareLike):
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
            self._type = LabwareLikeType.slot_name
            self._as_str = self._labware_like
        elif isinstance(self._labware_like, ModuleGeometry):
            self._type = LabwareLikeType.module
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
        return self._type in {LabwareLikeType.labware,
                              LabwareLikeType.well,
                              LabwareLikeType.module}

    @property
    def parent(self) -> Optional['LabwareLikeWrapper']:
        if self.has_parent:
            return LabwareLikeWrapper(self.object.parent)
        return None

    @property
    def is_well(self) -> bool:
        return self.object_type == LabwareLikeType.well

    @property
    def is_labware(self) -> bool:
        return self.object_type == LabwareLikeType.labware

    @property
    def is_slot(self) -> bool:
        return self.object_type == LabwareLikeType.slot_name

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
