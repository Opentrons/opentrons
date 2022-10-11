"""Basic labware data state and store."""
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Any, Mapping

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3, SlotDefV3
from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN
from opentrons_shared_data.pipette.dev_types import LabwareUri

from opentrons.types import DeckSlotName, Point
from opentrons.protocols.models import LabwareDefinition, WellDefinition
from opentrons.calibration_storage.helpers import uri_from_details

from .. import errors
from ..resources import DeckFixedLabware
from ..commands import (
    Command,
    LoadLabwareResult,
    MoveLabwareResult,
    MoveLabwareOffDeckResult,
)
from ..types import (
    DeckSlotLocation,
    Dimensions,
    LabwareOffset,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    LabwareLocation,
    LoadedLabware,
    OFF_DECK_LOCATION,
)
from ..actions import (
    Action,
    UpdateCommandAction,
    AddLabwareOffsetAction,
    AddLabwareDefinitionAction,
)
from .abstract_store import HasState, HandlesActions


_TRASH_LOCATION = DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH)


@dataclass
class LabwareState:
    """State of all loaded labware resources."""

    # Indexed by LoadedLabware.id.
    # If a LoadedLabware here has a non-None offsetId,
    # it must point to an existing element of labware_offsets_by_id.
    labware_by_id: Dict[str, LoadedLabware]

    # Indexed by LabwareOffset.id.
    # We rely on Python 3.7+ preservation of dict insertion order.
    labware_offsets_by_id: Dict[str, LabwareOffset]

    definitions_by_uri: Dict[str, LabwareDefinition]
    deck_definition: DeckDefinitionV3


class LabwareStore(HasState[LabwareState], HandlesActions):
    """Labware state container."""

    _state: LabwareState

    def __init__(
        self,
        deck_definition: DeckDefinitionV3,
        deck_fixed_labware: Sequence[DeckFixedLabware],
    ) -> None:
        """Initialize a labware store and its state."""
        definitions_by_uri: Dict[str, LabwareDefinition] = {
            uri_from_details(
                load_name=fixed_labware.definition.parameters.loadName,
                namespace=fixed_labware.definition.namespace,
                version=fixed_labware.definition.version,
            ): fixed_labware.definition
            for fixed_labware in deck_fixed_labware
        }
        labware_by_id = {
            fixed_labware.labware_id: LoadedLabware.construct(
                id=fixed_labware.labware_id,
                location=fixed_labware.location,
                loadName=fixed_labware.definition.parameters.loadName,
                definitionUri=uri_from_details(
                    load_name=fixed_labware.definition.parameters.loadName,
                    namespace=fixed_labware.definition.namespace,
                    version=fixed_labware.definition.version,
                ),
                offsetId=None,
            )
            for fixed_labware in deck_fixed_labware
        }

        self._state = LabwareState(
            definitions_by_uri=definitions_by_uri,
            labware_offsets_by_id={},
            labware_by_id=labware_by_id,
            deck_definition=deck_definition,
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)

        elif isinstance(action, AddLabwareOffsetAction):
            labware_offset = LabwareOffset.construct(
                id=action.labware_offset_id,
                createdAt=action.created_at,
                definitionUri=action.request.definitionUri,
                location=action.request.location,
                vector=action.request.vector,
            )
            self._add_labware_offset(labware_offset)

        elif isinstance(action, AddLabwareDefinitionAction):
            uri = uri_from_details(
                namespace=action.definition.namespace,
                load_name=action.definition.parameters.loadName,
                version=action.definition.version,
            )
            self._state.definitions_by_uri[uri] = action.definition

    def _handle_command(self, command: Command) -> None:
        """Modify state in reaction to a command."""
        if isinstance(command.result, LoadLabwareResult):
            # If the labware load refers to an offset, that offset must actually exist.
            if command.result.offsetId is not None:
                assert command.result.offsetId in self._state.labware_offsets_by_id

            labware_id = command.result.labwareId
            definition_uri = uri_from_details(
                namespace=command.result.definition.namespace,
                load_name=command.result.definition.parameters.loadName,
                version=command.result.definition.version,
            )

            self._state.labware_by_id[labware_id] = LoadedLabware.construct(
                id=labware_id,
                location=command.params.location,
                loadName=command.result.definition.parameters.loadName,
                definitionUri=definition_uri,
                offsetId=command.result.offsetId,
                displayName=command.params.displayName,
            )

            self._state.definitions_by_uri[definition_uri] = command.result.definition

        elif isinstance(command.result, MoveLabwareResult):
            labware_id = command.params.labwareId
            new_location = command.params.newLocation
            new_offset_id = command.result.offsetId

            self._state.labware_by_id[labware_id].offsetId = new_offset_id
            self._state.labware_by_id[labware_id].location = new_location

        elif isinstance(command.result, MoveLabwareOffDeckResult):
            labware_id = command.params.labwareId
            self._state.labware_by_id[labware_id].location = OFF_DECK_LOCATION
            self._state.labware_by_id[labware_id].offsetId = None

    def _add_labware_offset(self, labware_offset: LabwareOffset) -> None:
        """Add a new labware offset to state.

        `labware_offset.id` must not match any existing labware offset ID.
        `LoadLabwareCommand`s retain references to their corresponding labware offsets
        and expect them to be immutable.
        """
        assert labware_offset.id not in self._state.labware_offsets_by_id

        self._state.labware_offsets_by_id[labware_offset.id] = labware_offset


class LabwareView(HasState[LabwareState]):
    """Read-only labware state view."""

    _state: LabwareState

    def __init__(self, state: LabwareState) -> None:
        """Initialize the computed view of labware state.

        Arguments:
            state: Labware state dataclass used for all calculations.
        """
        self._state = state

    def get(self, labware_id: str) -> LoadedLabware:
        """Get labware data by the labware's unique identifier."""
        try:
            return self._state.labware_by_id[labware_id]
        except KeyError as e:
            raise errors.LabwareNotLoadedError(
                f"Labware {labware_id} not found."
            ) from e

    def get_id_by_module(self, module_id: str) -> Optional[str]:
        """Return the ID of the labware loaded on the given module."""
        raise NotImplementedError()

    def get_definition(self, labware_id: str) -> LabwareDefinition:
        """Get labware definition by the labware's unique identifier."""
        return self.get_definition_by_uri(
            LabwareUri(self.get(labware_id).definitionUri)
        )

    def get_display_name(self, labware_id: str) -> Optional[str]:
        """Get the labware's user-specified display name, if set."""
        return self.get(labware_id).displayName

    def get_deck_definition(self) -> DeckDefinitionV3:
        """Get the current deck definition."""
        return self._state.deck_definition

    def get_slot_definition(self, slot: DeckSlotName) -> SlotDefV3:
        """Get the definition of a slot in the deck."""
        deck_def = self.get_deck_definition()

        for slot_def in deck_def["locations"]["orderedSlots"]:
            if slot_def["id"] == str(slot):
                return slot_def

        raise errors.SlotDoesNotExistError(
            f"Slot ID {slot} does not exist in deck {deck_def['otId']}"
        )

    def get_slot_position(self, slot: DeckSlotName) -> Point:
        """Get the position of a deck slot."""
        slot_def = self.get_slot_definition(slot)
        position = slot_def["position"]

        return Point(x=position[0], y=position[1], z=position[2])

    def get_slot_center_position(self, slot: DeckSlotName) -> Point:
        """Get the (x, y, z) position of the center of the slot."""
        slot_def = self.get_slot_definition(slot)
        position = slot_def["position"]

        return Point(
            x=position[0] + slot_def["boundingBox"]["xDimension"] / 2,
            y=position[1] + slot_def["boundingBox"]["yDimension"] / 2,
            z=position[2] + slot_def["boundingBox"]["zDimension"] / 2,
        )

    def get_definition_by_uri(self, uri: LabwareUri) -> LabwareDefinition:
        """Get the labware definition matching loadName namespace and version."""
        try:
            return self._state.definitions_by_uri[uri]
        except KeyError as e:
            raise errors.LabwareDefinitionDoesNotExistError(
                f"Labware definition for matching {uri} not found."
            ) from e

    def get_location(self, labware_id: str) -> LabwareLocation:
        """Get labware location by the labware's unique identifier."""
        return self.get(labware_id).location

    def get_all(self) -> List[LoadedLabware]:
        """Get a list of all labware entries in state."""
        return list(self._state.labware_by_id.values())

    def get_has_quirk(self, labware_id: str, quirk: str) -> bool:
        """Get if a labware has a certain quirk."""
        return quirk in self.get_quirks(labware_id=labware_id)

    def get_quirks(self, labware_id: str) -> List[str]:
        """Get a labware's quirks."""
        definition = self.get_definition(labware_id)
        return definition.parameters.quirks or []

    def get_well_definition(
        self,
        labware_id: str,
        well_name: Optional[str] = None,
    ) -> WellDefinition:
        """Get a well's definition by labware and well name.

        If `well_name` is omitted, the first well in the labware
        will be used.
        """
        definition = self.get_definition(labware_id)

        if well_name is None:
            well_name = definition.ordering[0][0]

        try:
            return definition.wells[well_name]
        except KeyError as e:
            raise errors.WellDoesNotExistError(
                f"{well_name} does not exist in {labware_id}."
            ) from e

    def get_wells(self, labware_id: str) -> List[str]:
        """Get labware wells as a list of well names."""
        definition = self.get_definition(labware_id=labware_id)
        wells = list()
        for col in definition.ordering:
            for well_name in col:
                wells.append(well_name)
        return wells

    def validate_liquid_allowed_in_labware(
        self, labware_id: str, wells: Mapping[str, Any]
    ) -> List[str]:
        """Check if wells associated to a labware_id has well by name and that labware is not tiprack."""
        labware_definition = self.get_definition(labware_id)
        labware_wells = labware_definition.wells
        contains_wells = all(well_name in labware_wells for well_name in iter(wells))
        if labware_definition.parameters.isTiprack:
            raise errors.LabwareIsTipRackError(
                f"Given labware: {labware_id} is a tiprack. Can not load liquid."
            )
        if not contains_wells:
            raise errors.WellDoesNotExistError(
                f"Some of the supplied wells do not match the labwareId: {labware_id}."
            )
        return list(wells)

    def get_well_columns(self, labware_id: str) -> Dict[str, List[str]]:
        """Get well columns."""
        definition = self.get_definition(labware_id=labware_id)
        wells_by_cols = defaultdict(list)
        for i, col in enumerate(definition.ordering):
            wells_by_cols[f"{i+1}"] = col
        return wells_by_cols

    def get_well_rows(self, labware_id: str) -> Dict[str, List[str]]:
        """Get well rows."""
        definition = self.get_definition(labware_id=labware_id)
        wells_by_rows = defaultdict(list)
        pattern = re.compile(WELL_NAME_PATTERN, re.X)
        for col in definition.ordering:
            for well_name in col:
                match = pattern.match(well_name)
                assert match, f"Well name did not match pattern {pattern}"
                wells_by_rows[match.group(1)].append(well_name)
        return wells_by_rows

    def get_tip_length(self, labware_id: str) -> float:
        """Get the tip length of a tip rack."""
        definition = self.get_definition(labware_id)
        if definition.parameters.tipLength is None:
            raise errors.LabwareIsNotTipRackError(
                f"Labware {labware_id} has no tip length defined."
            )
        return definition.parameters.tipLength

    def get_definition_uri(self, labware_id: str) -> str:
        """Get a labware's definition URI."""
        return self.get(labware_id).definitionUri

    def get_uri_from_definition(
        self,
        labware_definition: LabwareDefinition,
    ) -> LabwareUri:
        """Get a definition URI from a full labware definition."""
        return uri_from_details(
            load_name=labware_definition.parameters.loadName,
            namespace=labware_definition.namespace,
            version=labware_definition.version,
        )

    def is_tiprack(self, labware_id: str) -> bool:
        """Get whether labware is a tiprack."""
        definition = self.get_definition(labware_id)
        return definition.parameters.isTiprack

    def get_load_name(self, labware_id: str) -> str:
        """Get the labware's load name."""
        definition = self.get_definition(labware_id)
        return definition.parameters.loadName

    def get_dimensions(self, labware_id: str) -> Dimensions:
        """Get the labware's dimensions."""
        definition = self.get_definition(labware_id)
        dims = definition.dimensions

        return Dimensions(
            x=dims.xDimension,
            y=dims.yDimension,
            z=dims.zDimension,
        )

    def get_default_magnet_height(self, labware_id: str) -> Optional[float]:
        """Return a labware's default Magnetic Module engage height.

        The returned value is measured in millimeters above the labware base plane.
        """
        raise NotImplementedError()

    def get_labware_offset_vector(self, labware_id: str) -> LabwareOffsetVector:
        """Get the labware's calibration offset."""
        offset_id = self.get(labware_id=labware_id).offsetId
        if offset_id is None:
            return LabwareOffsetVector(x=0, y=0, z=0)
        else:
            return self._state.labware_offsets_by_id[offset_id].vector

    def get_labware_offset(self, labware_offset_id: str) -> LabwareOffset:
        """Get a labware offset by the offset's unique ID.

        Raises:
            LabwareOffsetDoesNotExistError: If the given ID does not match any
                                            previously added offset.
        """
        try:
            return self._state.labware_offsets_by_id[labware_offset_id]
        except KeyError as e:
            raise errors.LabwareOffsetDoesNotExistError(
                f"Labware offset {labware_offset_id} not found."
            ) from e

    def get_labware_offsets(self) -> List[LabwareOffset]:
        """Get all labware offsets, in the order they were added."""
        return list(self._state.labware_offsets_by_id.values())

    # TODO: Make this slightly more ergonomic for the caller by
    # only returning the optional str ID, at the cost of baking redundant lookups
    # into the API?
    def find_applicable_labware_offset(
        self,
        definition_uri: str,
        location: LabwareOffsetLocation,
    ) -> Optional[LabwareOffset]:
        """Find a labware offset that applies to the given definition and location.

        Returns the *most recently* added matching offset,
        so later offsets can override earlier ones.
        Or, ``None`` if no offsets match at all.

        An offset "matches"
        if its ``definition_uri`` and ``location`` *exactly* match what's provided.
        This implies that if the location involves a module,
        it will *not* match a module that's compatible but not identical.
        """
        for candidate in reversed(list(self._state.labware_offsets_by_id.values())):
            if (
                candidate.definitionUri == definition_uri
                and candidate.location == location
            ):
                return candidate
        return None
