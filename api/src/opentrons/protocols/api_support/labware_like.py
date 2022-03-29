from enum import Enum, auto
from typing import TYPE_CHECKING, Optional, Union, cast, Tuple, List, Set

if TYPE_CHECKING:
    from opentrons.protocol_api.labware import Labware, Well
    from opentrons.protocols.geometry.module_geometry import ModuleGeometry


WrappableLabwareLike = Union[
    "Labware", "Well", str, "ModuleGeometry", "LabwareLike", None
]


class LabwareLikeType(int, Enum):
    LABWARE = auto()
    SLOT = auto()
    WELL = auto()
    MODULE = auto()
    NONE = auto()


class LabwareLike:
    """A wrapper for a labware like object."""

    def __init__(self, labware_like: WrappableLabwareLike):
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
        elif isinstance(self._labware_like, LabwareLike):
            self._type = self._labware_like._type
            self._as_str = self._labware_like._as_str
            self._labware_like = self._labware_like.object
        else:
            self._as_str = ""

    @property
    def object(self) -> WrappableLabwareLike:
        return self._labware_like

    @property
    def object_type(self) -> LabwareLikeType:
        return self._type

    @property
    def has_parent(self) -> bool:
        return self._type in {
            LabwareLikeType.LABWARE,
            LabwareLikeType.WELL,
            LabwareLikeType.MODULE,
        }

    @property
    def parent(self) -> "LabwareLike":
        # Type ignoring because type checker is not aware that has_parent
        # performs the validation.
        parent = None
        if self.has_parent:
            parent = self.object.parent  # type: ignore
        return LabwareLike(parent)

    @property
    def is_well(self) -> bool:
        return self.object_type == LabwareLikeType.WELL

    @property
    def is_labware(self) -> bool:
        return self.object_type == LabwareLikeType.LABWARE

    @property
    def is_slot(self) -> bool:
        return self.object_type == LabwareLikeType.SLOT

    @property
    def is_empty(self) -> bool:
        return self.object_type == LabwareLikeType.NONE

    @property
    def is_module(self) -> bool:
        return self.object_type == LabwareLikeType.MODULE

    def as_well(self) -> "Well":
        # Import locally to avoid circular dependency
        from opentrons.protocol_api.labware import Well

        return cast(Well, self.object)

    def as_labware(self) -> "Labware":
        # Import locally to avoid circular dependency
        from opentrons.protocol_api.labware import Labware

        return cast(Labware, self.object)

    def as_module(self) -> "ModuleGeometry":
        from opentrons.protocols.geometry.module_geometry import ModuleGeometry

        return cast(ModuleGeometry, self.object)

    def get_parent_labware_and_well(
        self,
    ) -> Tuple[Optional["Labware"], Optional["Well"]]:
        """Attempt to split into a labware and well."""
        if self.is_labware:
            return self.as_labware(), None
        elif self.is_well and self.parent:
            return (
                self.parent.as_labware(),
                self.as_well(),
            )
        else:
            return None, None

    def first_parent(self) -> Optional[str]:
        """Return the topmost parent of this location. It should be
        either a string naming a slot or a None if the location isn't
        associated with a slot"""

        # cycle-detecting recursive climbing
        seen: Set[LabwareLike] = set()

        # internal function to have the cycle detector different per call
        def _fp_recurse(location: LabwareLike):
            if location in seen:
                raise RuntimeError("Cycle in labware parent")
            seen.add(location)
            if location.is_empty:
                return None
            elif location.is_slot:
                return str(location)
            else:
                return location.parent.first_parent()

        return _fp_recurse(self)

    def module_parent(self) -> Optional["ModuleGeometry"]:
        """
        Return the closest parent of this LabwareLike (including, possibly,
        the wrapped object) that is a ModuleGeometry
        """

        def recursive_get_module_parent(obj: LabwareLike) -> Optional["ModuleGeometry"]:
            if obj.is_module:
                return obj.as_module()
            next_obj = obj.parent
            if next_obj.is_empty:
                return None
            else:
                return recursive_get_module_parent(obj.parent)

        if self.is_empty:
            return None
        return recursive_get_module_parent(self)

    def quirks_from_any_parent(self) -> Set[str]:
        """Walk the tree of wells and labwares and extract quirks"""

        def recursive_get_quirks(obj: LabwareLike, found: List[str]) -> List[str]:
            if obj.is_labware:
                return found + obj.as_labware().quirks
            elif obj.is_well:
                return recursive_get_quirks(obj.parent, found)
            else:
                return found

        return set(recursive_get_quirks(self, []))

    def is_fixed_trash(self) -> bool:
        """Check if fixedTrash quirk is in any parent."""
        return "fixedTrash" in self.quirks_from_any_parent()

    def center_multichannel_on_wells(self) -> bool:
        """Check if centerMultichannelOnWells quirk is in any parent."""
        return "centerMultichannelOnWells" in self.quirks_from_any_parent()

    def __str__(self) -> str:
        return self._as_str

    def __repr__(self) -> str:
        return str(self)

    def __eq__(self, other):
        return (
            other is not None
            and isinstance(other, LabwareLike)
            and self.object == other.object
        )

    def __hash__(self):
        return id(self)
