"""Structures to represent changes that commands want to make to engine state."""


import dataclasses
import enum
import typing

from opentrons.protocol_engine.types import DeckPoint, LabwareLocation
from opentrons_shared_data.labware.labware_definition import LabwareDefinition


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


class _ClearEnum(enum.Enum):
    CLEAR = enum.auto()


CLEAR: typing.Final = _ClearEnum.CLEAR
"""A sentinel value to indicate that a value should be cleared.

Useful when `None` is semantically unclear or has some other meaning.
"""


ClearType: typing.TypeAlias = typing.Literal[_ClearEnum.CLEAR]
"""The type of `CLEAR`, as `NoneType` is to `None`.

Unfortunately, mypy doesn't let us write `Literal[CLEAR]`. Use this instead.
"""


@dataclasses.dataclass(frozen=True)
class BaseLabwareData:
    """Base class for updating labware resutls."""

    id: str
    offset_id: typing.Optional[str]


@dataclasses.dataclass(frozen=True)
class UpdateLabwareDefenition(BaseLabwareData):
    """Update labware defention from command result."""

    definition: LabwareDefinition


@dataclasses.dataclass(frozen=True)
class UpdateLabwareLocation(BaseLabwareData):
    """Update labware location from command result."""

    location: LabwareLocation


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

    labware_id: str

    new_location: LabwareLocation | None | NoChangeType = NO_CHANGE
    """The labware's new logical location.

    Note: `new_location=None` means "change the location to `None` (unknown)",
    not "do not change the location".
    """

    display_name: typing.Optional[str] | NoChangeType = NO_CHANGE

    definition: LabwareDefinition | NoChangeType = NO_CHANGE

    offset_id: typing.Optional[str] | NoChangeType = NO_CHANGE


@dataclasses.dataclass
class StateUpdate:
    """Represents an update to perform on engine state."""

    pipette_location: PipetteLocationUpdate | NoChangeType | ClearType = NO_CHANGE

    labware_location: LabwareLocationUpdate | NoChangeType = NO_CHANGE

    # labware_location: UpdateLabwareDisplayNameAndLocation | NoChangeType = NO_CHANGE

    loaded_labware: UpdateLabwareDefenition | NoChangeType = NO_CHANGE

    reloaded_labware: BaseLabwareData | NoChangeType = NO_CHANGE

    lid_status: UpdateLabwareLocation | NoChangeType = NO_CHANGE

    move_labware: UpdateLabwareLocation | NoChangeType = NO_CHANGE

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

    @typing.overload
    def set_labware_location(
        self, *, labware_id: str, new_location: LabwareLocation, new_offset_id: str
    ) -> None:
        """Schedule a labware's location to be set."""

    @typing.overload
    def set_labware_location(
        self,
        *,
        labware_id: str,
        definition: LabwareDefinition,
    ) -> None:
        """Schedule a labware's definition to be set."""

    @typing.overload
    def set_labware_location(
        self,
        *,
        labware_id: str,
        display_name: str,
        new_location: LabwareLocation | None,
    ) -> None:
        """Schedule a labware's display name to be set."""
        pass

    def set_labware_location(  # noqa: D102
        self,
        *,
        labware_id: str,
        new_location: LabwareLocation | None | NoChangeType = NO_CHANGE,
        new_offset_id: str | NoChangeType = NO_CHANGE,
        display_name: str | NoChangeType = NO_CHANGE,
        definition: LabwareDefinition | NoChangeType = NO_CHANGE,
    ) -> None:
        if new_location != NO_CHANGE:
            self.labware_location = LabwareLocationUpdate(
                labware_id=labware_id,
                new_location=new_location,
                offset_id=new_offset_id,
                display_name=display_name,
            )
        elif display_name != NO_CHANGE:
            self.labware_location = LabwareLocationUpdate(
                labware_id=labware_id,
                display_name=display_name,
                new_location=new_location,
            )
        else:
            assert definition != NO_CHANGE

            self.labware_location = LabwareLocationUpdate(
                definition=definition, labware_id=labware_id
            )

    def set_loaded_labware(
        self,
        defenition: LabwareDefinition,
        labware_id: str,
        offset_id: typing.Optional[str],
    ) -> None:
        """Add loaded labware to state."""
        self.loaded_labware = UpdateLabwareDefenition(
            definition=defenition, id=labware_id, offset_id=offset_id
        )

    def set_reloaded_labware(
        self,
        location: LabwareLocation,
        labware_id: str,
        offset_id: typing.Optional[str],
    ) -> None:
        """Set re-loaded labware on state."""
        self.reloaded_labware = UpdateLabwareLocation(
            id=labware_id, location=location, offset_id=offset_id
        )

    def set_lid_status(
        self,
        location: LabwareLocation,
        labware_id: str,
        offset_id: typing.Optional[str],
    ) -> None:
        """Set move lid on state."""
        self.lid_status = UpdateLabwareLocation(
            id=labware_id, location=location, offset_id=offset_id
        )

    def set_move_labware(
        self,
        location: LabwareLocation,
        labware_id: str,
        offset_id: typing.Optional[str],
    ) -> None:
        """Set move labware on state."""
        self.move_labware = UpdateLabwareLocation(
            id=labware_id, location=location, offset_id=offset_id
        )

    def clear_all_pipette_locations(self) -> None:
        """Mark all pipettes as having an unknown location."""
        self.pipette_location = CLEAR
