from enum import Enum, auto
from typing import TYPE_CHECKING, Any, List, Optional, Tuple, Union, cast

if TYPE_CHECKING:
    from opentrons.protocol_api._types import OffDeckType
    from opentrons.protocol_api.labware import Labware, Well
    from opentrons.protocol_api.module_contexts import ModuleContext

WrappableLabwareLike = Union[
    "Labware",
    "Well",
    str,
    "LabwareLike",
    None,
    "OffDeckType",
    "ModuleContext",
]


class LabwareLikeType(int, Enum):
    LABWARE = auto()
    SLOT = auto()
    WELL = auto()
    MODULE = auto()
    NONE = auto()
    OFF_DECK = auto()


class LabwareLike:
    """A wrapper for a labware like object."""

    def __init__(self, labware_like: WrappableLabwareLike):
        """
        Create a labware like object. Used by Location object's labware field.
        """
        # Import locally to avoid circular dependency
        from opentrons.protocol_api._types import OffDeckType
        from opentrons.protocol_api.labware import Labware, Well
        from opentrons.protocol_api.module_contexts import ModuleContext

        self._labware_like = labware_like
        self._type = LabwareLikeType.NONE

        # TODO(mc 2022-10-28): for the love of all that is holy
        # do not use __repr__ or __str__ to do this; it's so confusing
        if isinstance(self._labware_like, Well):
            self._type = LabwareLikeType.WELL
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, Labware):
            self._type = LabwareLikeType.LABWARE
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, str):
            self._type = LabwareLikeType.SLOT
            self._as_str = self._labware_like
        elif isinstance(self._labware_like, ModuleContext):
            self._type = LabwareLikeType.MODULE
            self._as_str = repr(self._labware_like)
        elif isinstance(self._labware_like, LabwareLike):
            self._type = self._labware_like._type
            self._as_str = self._labware_like._as_str
            self._labware_like = self._labware_like.object
        elif isinstance(self._labware_like, OffDeckType):
            self._type = LabwareLikeType.OFF_DECK
            self._as_str = repr(self._labware_like)
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

    def quirks_from_any_parent(self) -> set[str]:
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

    def __str__(self) -> str:
        return self._as_str

    def __repr__(self) -> str:
        return str(self)

    def __eq__(self, other: Any) -> bool:
        return (
            other is not None
            and isinstance(other, LabwareLike)
            and self.object == other.object
        )

    def __hash__(self) -> int:
        return id(self)
