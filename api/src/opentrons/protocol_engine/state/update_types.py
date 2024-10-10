"""Structures to represent changes that commands want to make to engine state."""


import dataclasses
import enum
import typing

from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine.resources import pipette_data_provider
from opentrons.protocol_engine.types import DeckPoint, LabwareLocation, TipGeometry
from opentrons.types import MountType
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.pipette.types import PipetteNameType


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

    new_location: LabwareLocation
    """The labware's new logical location."""

    offset_id: typing.Optional[str]


@dataclasses.dataclass
class LoadedLabwareUpdate(LabwareLocationUpdate):
    """Update loaded labware."""

    display_name: typing.Optional[str]

    definition: LabwareDefinition


@dataclasses.dataclass
class LoadPipetteUpdate:
    """Update loaded pipette."""

    pipette_id: str
    pipette_name: PipetteNameType
    mount: MountType
    liquid_presence_detection: typing.Optional[bool]


@dataclasses.dataclass
class PipetteConfigUpdate:
    """Update pipette config."""

    pipette_id: str
    serial_number: str
    config: pipette_data_provider.LoadedStaticPipetteData


@dataclasses.dataclass
class PipetteNozzleMapUpdate:
    """Update pipette nozzle map."""

    pipette_id: str
    nozzle_map: NozzleMap


@dataclasses.dataclass
class PipetteTipStateUpdate:
    """Update pipette tip state."""

    pipette_id: str
    tip_geometry: typing.Optional[TipGeometry]


@dataclasses.dataclass
class TipsUsedUpdate:
    """Represents an update that marks tips in a tip rack as used."""

    pipette_id: str
    """The pipette that did the tip pickup."""

    labware_id: str

    well_name: str
    """The well that the pipette's primary nozzle targeted.

    Wells in addition to this one will also be marked as used, depending on the
    pipette's nozzle layout.
    """


@dataclasses.dataclass
class StateUpdate:
    """Represents an update to perform on engine state."""

    pipette_location: PipetteLocationUpdate | NoChangeType | ClearType = NO_CHANGE

    loaded_pipette: LoadPipetteUpdate | NoChangeType = NO_CHANGE

    pipette_config: PipetteConfigUpdate | NoChangeType = NO_CHANGE

    pipette_nozzle_map: PipetteNozzleMapUpdate | NoChangeType = NO_CHANGE

    pipette_tip_state: PipetteTipStateUpdate | NoChangeType = NO_CHANGE

    labware_location: LabwareLocationUpdate | NoChangeType = NO_CHANGE

    loaded_labware: LoadedLabwareUpdate | NoChangeType = NO_CHANGE

    tips_used: TipsUsedUpdate | NoChangeType = NO_CHANGE

    # These convenience functions let the caller avoid the boilerplate of constructing a
    # complicated dataclass tree.

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

    def clear_all_pipette_locations(self) -> None:
        """Mark all pipettes as having an unknown location."""
        self.pipette_location = CLEAR

    def set_labware_location(
        self,
        *,
        labware_id: str,
        new_location: LabwareLocation,
        new_offset_id: str | None,
    ) -> None:
        """Set labware location."""
        self.labware_location = LabwareLocationUpdate(
            labware_id=labware_id,
            new_location=new_location,
            offset_id=new_offset_id,
        )

    def set_loaded_labware(
        self,
        definition: LabwareDefinition,
        labware_id: str,
        offset_id: typing.Optional[str],
        display_name: typing.Optional[str],
        location: LabwareLocation,
    ) -> None:
        """Add loaded labware to state."""
        self.loaded_labware = LoadedLabwareUpdate(
            definition=definition,
            labware_id=labware_id,
            offset_id=offset_id,
            new_location=location,
            display_name=display_name,
        )

    def set_load_pipette(
        self,
        pipette_id: str,
        pipette_name: PipetteNameType,
        mount: MountType,
        liquid_presence_detection: typing.Optional[bool],
    ) -> None:
        """Add loaded pipette to state."""
        self.loaded_pipette = LoadPipetteUpdate(
            pipette_id=pipette_id,
            pipette_name=pipette_name,
            mount=mount,
            liquid_presence_detection=liquid_presence_detection,
        )

    def update_pipette_config(
        self,
        pipette_id: str,
        config: pipette_data_provider.LoadedStaticPipetteData,
        serial_number: str,
    ) -> None:
        """Update pipette config."""
        self.pipette_config = PipetteConfigUpdate(
            pipette_id=pipette_id, config=config, serial_number=serial_number
        )

    def update_pipette_nozzle(self, pipette_id: str, nozzle_map: NozzleMap) -> None:
        """Update pipette nozzle map."""
        self.pipette_nozzle_map = PipetteNozzleMapUpdate(
            pipette_id=pipette_id, nozzle_map=nozzle_map
        )

    def update_pipette_tip_state(
        self, pipette_id: str, tip_geometry: typing.Optional[TipGeometry]
    ) -> None:
        """Update tip state."""
        self.pipette_tip_state = PipetteTipStateUpdate(
            pipette_id=pipette_id, tip_geometry=tip_geometry
        )

    def mark_tips_as_used(
        self, pipette_id: str, labware_id: str, well_name: str
    ) -> None:
        """Mark tips in a tip rack as used. See `MarkTipsUsedState`."""
        self.tips_used = TipsUsedUpdate(
            pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
        )
