"""Build analysis previews from SQL-extracted JSON fragments.

Avoid parsing the full analysis document or Protocol Engine Command models.
"""

from dataclasses import dataclass
from functools import lru_cache
from typing import List, Optional, Sequence, get_args

from opentrons.protocol_engine import LoadedLabware
from opentrons.protocol_engine.commands import (
    LoadLabwareCommandType,
    LoadLidCommandType,
    LoadLidStackCommandType,
    LoadModuleCommandType,
    MoveLabwareCommandType,
    MoveToAddressableAreaCommandType,
    MoveToAddressableAreaForDropTipCommandType,
)
from opentrons.protocol_engine.resources.labware_validation import is_flex_trash
from opentrons.protocol_engine.types import (
    AreaType,
    DeckSlotLocation,
    LabwareMovementStrategy,
    ModuleModel,
    ModuleType,
)
from opentrons.protocols.api_support.deck_type import (
    STANDARD_OT2_DECK,
    STANDARD_OT3_DECK,
)
from opentrons.types import DeckSlotName
from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.types import CutoutFixture, DeckDefinitionV5
from opentrons_shared_data.robot.types import RobotType

_LOAD_LABWARE = get_args(LoadLabwareCommandType)[0]
_LOAD_LID = get_args(LoadLidCommandType)[0]
_LOAD_LID_STACK = get_args(LoadLidStackCommandType)[0]
_LOAD_MODULE = get_args(LoadModuleCommandType)[0]
_MOVE_LABWARE = get_args(MoveLabwareCommandType)[0]
_MOVE_TO_ADDRESSABLE_AREA = get_args(MoveToAddressableAreaCommandType)[0]
_MOVE_TO_ADDRESSABLE_AREA_FOR_DROP_TIP = get_args(
    MoveToAddressableAreaForDropTipCommandType
)[0]

# Command types whose params/results the preview needs.
PREVIEW_COMMAND_TYPES = (
    _MOVE_LABWARE,
    _LOAD_LABWARE,
    _LOAD_LID,
    _LOAD_LID_STACK,
    _LOAD_MODULE,
    _MOVE_TO_ADDRESSABLE_AREA,
    _MOVE_TO_ADDRESSABLE_AREA_FOR_DROP_TIP,
)

_LOAD_LABWARE_COMMANDS = frozenset({_LOAD_LABWARE, _LOAD_LID, _LOAD_LID_STACK})
_MOVE_TO_ADDRESSABLE_AREA_COMMANDS = frozenset(
    {_MOVE_TO_ADDRESSABLE_AREA, _MOVE_TO_ADDRESSABLE_AREA_FOR_DROP_TIP}
)


@dataclass(frozen=True)
class ExtractedCommand:
    """Command fields extracted."""

    command_type: str
    strategy: Optional[str] = None
    new_location_slot: Optional[str] = None
    new_location_aa: Optional[str] = None
    location_slot: Optional[str] = None
    location_aa: Optional[str] = None
    load_name: Optional[str] = None
    module_model: Optional[str] = None
    addressable_area_name: Optional[str] = None


def uses_gripper(commands: Sequence[ExtractedCommand]) -> bool:
    """True if any moveLabware command uses the gripper."""
    return any(
        command.command_type == _MOVE_LABWARE
        and command.strategy == LabwareMovementStrategy.USING_GRIPPER
        for command in commands
    )


def required_addressable_areas(
    commands: Sequence[ExtractedCommand],
    labware: Sequence[LoadedLabware],
    robot_type: Optional[RobotType],
) -> List[str]:
    """Port of getAddressableAreasInProtocol over extracted command fields."""
    deck_def = _deck_def_for_robot_type(robot_type)
    areas: List[str] = []

    for command in commands:
        _append_areas_from_command(areas, command, deck_def)

    if _has_legacy_a3_trash(labware):
        trash_area = _movable_trash_a3_area(deck_def)
        if trash_area is not None and trash_area not in areas:
            areas.append(trash_area)

    return areas


@lru_cache(maxsize=2)
def _deck_def_for_robot_type(robot_type: Optional[RobotType]) -> DeckDefinitionV5:
    deck_name = (
        STANDARD_OT3_DECK if robot_type == "OT-3 Standard" else STANDARD_OT2_DECK
    )
    return load_deck(deck_name)


def _append_areas_from_command(
    areas: List[str], command: ExtractedCommand, deck_def: DeckDefinitionV5
) -> None:
    if command.command_type == _MOVE_LABWARE:
        _append_move_labware_areas(areas, command, deck_def)
    elif command.command_type in _LOAD_LABWARE_COMMANDS:
        _append_load_labware_areas(areas, command, deck_def)
    elif command.command_type == _LOAD_MODULE:
        _append_load_module_areas(areas, command, deck_def)
    elif command.command_type in _MOVE_TO_ADDRESSABLE_AREA_COMMANDS:
        if command.addressable_area_name is not None:
            _append_unique(areas, command.addressable_area_name)


def _append_move_labware_areas(
    areas: List[str], command: ExtractedCommand, deck_def: DeckDefinitionV5
) -> None:
    if command.new_location_slot is not None:
        _append_slot_area(areas, command.new_location_slot, deck_def)
    elif command.new_location_aa is not None:
        _append_unique(areas, command.new_location_aa)


def _append_load_labware_areas(
    areas: List[str], command: ExtractedCommand, deck_def: DeckDefinitionV5
) -> None:
    if command.location_slot is not None and not (
        command.load_name is not None and is_flex_trash(command.load_name)
    ):
        _append_slot_area(areas, command.location_slot, deck_def)
    elif command.location_aa is not None:
        _append_unique(areas, command.location_aa)


def _append_load_module_areas(
    areas: List[str], command: ExtractedCommand, deck_def: DeckDefinitionV5
) -> None:
    if command.location_slot is None or command.location_slot in areas:
        return

    module_areas = _addressable_areas_from_loaded_module(
        command.module_model, command.location_slot, deck_def
    )

    if module_areas:
        areas.append(module_areas[0])


def _append_slot_area(
    areas: List[str], slot_name: str, deck_def: DeckDefinitionV5
) -> None:
    if slot_name in areas:
        return
    if _slot_is_addressable_area(slot_name, deck_def):
        areas.append(slot_name)


def _append_unique(areas: List[str], area: str) -> None:
    if area not in areas:
        areas.append(area)


def _slot_is_addressable_area(slot_name: str, deck_def: DeckDefinitionV5) -> bool:
    return any(
        area["id"] == slot_name for area in deck_def["locations"]["addressableAreas"]
    )


def _addressable_areas_from_loaded_module(
    module_model: Optional[str],
    slot_name: str,
    deck_def: DeckDefinitionV5,
) -> List[str]:
    """Port of getAddressableAreaNamesFromLoadedModule."""
    if module_model is None:
        return []
    module_fixtures = _module_fixtures_for_model(module_model, deck_def)
    cutout_ids = _cutout_ids_from_module_slot(slot_name, module_fixtures, deck_def)
    areas: List[str] = []
    for fixture in module_fixtures:
        provided = fixture["providesAddressableAreas"]
        for cutout_id in cutout_ids:
            areas.extend(provided.get(cutout_id, []))
    return areas


def _cutout_ids_from_module_slot(
    slot_name: str,
    module_fixtures: Sequence[CutoutFixture],
    deck_def: DeckDefinitionV5,
) -> List[str]:
    anchor_cutout_id = _cutout_id_for_slot(slot_name, deck_def)
    if anchor_cutout_id is None:
        return []
    
    anchor_fixture = next(
        (
            fixture
            for fixture in module_fixtures
            if anchor_cutout_id in fixture["mayMountTo"]
        ),
        None,
    )
    if anchor_fixture is None:
        return []
    
    grouped = anchor_fixture.get("fixtureGroup", {}).get(anchor_cutout_id)
    if grouped:
        return list(grouped[0].keys())
    return [anchor_cutout_id]


def _cutout_id_for_slot(slot_name: str, deck_def: DeckDefinitionV5) -> Optional[str]:
    if not _slot_is_addressable_area(slot_name, deck_def):
        return None
    
    match: Optional[str] = None
    for fixture in deck_def["cutoutFixtures"]:
        for cutout_id, provided in fixture["providesAddressableAreas"].items():
            if slot_name in provided:
                match = cutout_id
    return match


def _module_fixtures_for_model(
    module_model: str, deck_def: DeckDefinitionV5
) -> List[CutoutFixture]:
    """Cutout fixtures for a module model, from the deck definition.

    Uses Protocol Engine's module-type to fixture-id mapping, then includes
    grouped fixtures (thermocycler front/rear) from that fixture's fixtureGroup.
    """
    fixtures_by_id = {fixture["id"]: fixture for fixture in deck_def["cutoutFixtures"]}
    try:
        primary_id = ModuleType.to_module_fixture_id(
            ModuleModel(module_model).as_type()
        )
    except ValueError:
        primary_id = module_model
    primary = fixtures_by_id.get(primary_id) or fixtures_by_id.get(module_model)
    if primary is None:
        return []
    fixture_ids = [primary["id"]]
    for groups in primary.get("fixtureGroup", {}).values():
        for group in groups:
            for fixture_id in group.values():
                if fixture_id not in fixture_ids:
                    fixture_ids.append(fixture_id)
    return [
        fixtures_by_id[fixture_id]
        for fixture_id in fixture_ids
        if fixture_id in fixtures_by_id
    ]


def _movable_trash_a3_area(deck_def: DeckDefinitionV5) -> Optional[str]:
    """Movable-trash addressable area on slot A3, from the deck definition."""
    slot_a3 = DeckSlotName.SLOT_A3.value
    for area in deck_def["locations"]["addressableAreas"]:
        if area.get("areaType") == AreaType.MOVABLE_TRASH.value and area["id"].endswith(
            slot_a3
        ):
            return area["id"]
    return None


def _has_legacy_a3_trash(labware: Sequence[LoadedLabware]) -> bool:
    return any(
        is_flex_trash(item.loadName)
        and isinstance(item.location, DeckSlotLocation)
        and item.location.slotName == DeckSlotName.SLOT_A3
        for item in labware
    )
