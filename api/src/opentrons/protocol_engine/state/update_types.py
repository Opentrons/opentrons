"""Structures to represent changes that commands want to make to engine state."""


import dataclasses
import enum
import typing

from opentrons.protocol_engine.resources.models import (
    LoadedLabwareData,
    ReloadedLabwareData,
)
from opentrons.protocol_engine.types import DeckPoint, LabwareLocation


class _NoChangeEnum(enum.Enum):
    NO_CHANGE = enum.auto()


NO_CHANGE: typing.Final = _NoChangeEnum.NO_CHANGE
"""A sentinel value to indicate that a value shouldn't be changed.

Useful when `None` is semantically unclear or already has some other meaning.
"""


NoChangeType: typing.TypeAlias = typing.Literal[_NoChangeEnum.NO_CHANGE]
"""The type of `NO_CHANGE`, as `NoneType` is to `None`.

Unfortunately, mypy doesn't let us write `Literal[NO_CHANGE]`. Use this instead.
"""


@dataclasses.dataclass(frozen=True)
class StateDataUpdate:
    """Base class for updating results."""

    id: str
    new_location: LabwareLocation
    offset_id: typing.Optional[str]


@dataclasses.dataclass(frozen=True)
class Well:
    """Designates a well in a labware."""

    labware_id: str
    well_name: str


@dataclasses.dataclass(frozen=True)
class AddressableArea:
    """Designates an addressable area."""

    addressable_area_name: str


@dataclasses.dataclass
class PipetteLocationUpdate:
    """Represents an update to perform on a pipette's location."""

    pipette_id: str

    new_location: Well | AddressableArea | None | NoChangeType
    """The pipette's new logical location.

    Note: `new_location=None` means "change the location to `None` (unknown)",
    not "do not change the location".
    """

    new_deck_point: DeckPoint | NoChangeType


@dataclasses.dataclass
class LabwareLocationUpdate:
    """Represents an update to perform on a labware's location."""

    labware_id: typing.Optional[str]

    display_name: typing.Optional[str]

    new_location: LabwareLocation | None | NoChangeType
    """The labware's new logical location.

    Note: `new_location=None` means "change the location to `None` (unknown)",
    not "do not change the location".
    """


@dataclasses.dataclass
class StateUpdate:
    """Represents an update to perform on engine state."""

    # todo(mm, 2024-08-29): Extend this with something to represent clearing both the
    # deck point and the logical location, for e.g. home commands. Consider an explicit
    # `CLEAR` sentinel if `None` is confusing.
    pipette_location: PipetteLocationUpdate | NoChangeType = NO_CHANGE

    labware_location: LabwareLocationUpdate | NoChangeType = NO_CHANGE

    loaded_labware: typing.Optional[LoadedLabwareData] = None

    reloaded_labware: typing.Optional[ReloadedLabwareData] = None

    lid_status: typing.Optional[StateDataUpdate] = None

    # These convenience functions let the caller avoid the boilerplate of constructing a
    # complicated dataclass tree, and they give us a

    @typing.overload
    def set_pipette_location(
        self,
        *,
        pipette_id: str,
        new_labware_id: str,
        new_well_name: str,
        new_deck_point: DeckPoint,
    ) -> None:
        """Schedule a pipette's location to be set to a well."""

    @typing.overload
    def set_pipette_location(
        self,
        *,
        pipette_id: str,
        new_addressable_area_name: str,
        new_deck_point: DeckPoint,
    ) -> None:
        """Schedule a pipette's location to be set to an addressable area."""
        pass

    def set_pipette_location(  # noqa: D102
        self,
        *,
        pipette_id: str,
        new_labware_id: str | NoChangeType = NO_CHANGE,
        new_well_name: str | NoChangeType = NO_CHANGE,
        new_addressable_area_name: str | NoChangeType = NO_CHANGE,
        new_deck_point: DeckPoint,
    ) -> None:
        if new_addressable_area_name != NO_CHANGE:
            self.pipette_location = PipetteLocationUpdate(
                pipette_id=pipette_id,
                new_location=AddressableArea(
                    addressable_area_name=new_addressable_area_name
                ),
                new_deck_point=new_deck_point,
            )
        else:
            # These asserts should always pass because of the overloads.
            assert new_labware_id != NO_CHANGE
            assert new_well_name != NO_CHANGE

            self.pipette_location = PipetteLocationUpdate(
                pipette_id=pipette_id,
                new_location=Well(labware_id=new_labware_id, well_name=new_well_name),
                new_deck_point=new_deck_point,
            )

    def set_loaded_labware(self, labware: LoadedLabwareData) -> None:
        self.loaded_labware = labware

    def set_location_and_display_name(
        self,
        location: LabwareLocation,
        labware_id: typing.Optional[str],
        display_name: typing.Optional[str],
    ) -> None:
        self.labware_location = LabwareLocationUpdate(
            labware_id=labware_id, display_name=display_name, new_location=location
        )
