"""Test that PD Python generation produces the same engine commands as JSON.

For each .json/.py pair of protocols in the __pd_protocols__ directory, run the protocols
and compare their commands.
"""

from copy import deepcopy
from decimal import Decimal
from pathlib import Path
from typing import Any, Tuple

import mock
import pytest

from opentrons.protocol_api import Well
from opentrons.protocol_api.core.engine import InstrumentCore
from opentrons.protocol_engine import (
    Command,
    WellOrigin,
)
from opentrons.protocol_engine.state.geometry import GeometryView
from opentrons.protocol_engine.types import WellLocationType
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner.create_simulating_orchestrator import (
    create_simulating_orchestrator,
)
from opentrons.types import Location


async def _get_engine_commands_for_protocol(
    protocol_path: Path,
) -> list[dict[str, Any]]:
    """This is the top-level function to run a protocol.

    Given a path to a JSON or Python protocol, run the protocol and get the list
    of commands from the Protocol Engine, cleaning up the commands. Returns a list of
    JSON commands.
    """
    protocol_source = await ProtocolReader().read_saved(
        files=[protocol_path],
        directory=protocol_path.parent,
    )
    orchestrator = await create_simulating_orchestrator(
        protocol_source.robot_type, protocol_source.config
    )
    run_result = await orchestrator.run(
        deck_configuration=[], protocol_source=protocol_source
    )
    await orchestrator.finish()

    commands = _commands_to_json_rename_ids(run_result.commands)
    _sort_load_commands(commands)
    _expand_load_liquid(commands)
    _sort_load_liquid(commands)
    _expand_thermocycler_profiles(commands)
    return commands


def _commands_to_json_rename_ids(  # noqa: C901
    commands: list[Command],
) -> list[dict[str, Any]]:
    """Convert RunResult Commands into something that looks like JSON commands.

    Renames the labwareIds/moduleIds/etc. in commands so that they're deterministic.
    """
    json_commands = [
        command.model_dump(mode="json", exclude_none=True) for command in commands
    ]

    # JSON protocols specify the labwareId/moduleId/etc. in the load commands, whereas
    # Python protocols let the engine assign the IDs. For consistency, always populate
    # the ID in the commands.
    for command in json_commands:
        match command["commandType"]:
            case "loadPipette":
                command["params"].setdefault(
                    "pipetteId", command["result"]["pipetteId"]
                )
            case "loadModule":
                command["params"].setdefault("moduleId", command["result"]["moduleId"])
            case "loadLabware":
                command["params"].setdefault(
                    "labwareId", command["result"]["labwareId"]
                )

    # Now we rename all the IDs to make them deterministic (instead of random UUIDs) ...

    # These are maps of engine ID -> renamed ID:
    pipette_id_map: dict[str, str] = {}  # e.g. "p1000_single_flex@left"
    module_id_map: dict[str, str] = {}  # e.g. "temperatureModuleV2@D1"
    labware_id_map: dict[str, str] = {}  # e.g. "opentrons_flex_96_tiprack_200ul@B2"

    # Compute the mappings of engine ID -> renamed IDs:
    for command in json_commands:
        match command["commandType"]:
            case "loadPipette":
                old_id = command["params"]["pipetteId"]
                new_id = (
                    f"{command['params']['pipetteName']}@{command['params']['mount']}"
                )
                pipette_id_map[old_id] = new_id
            case "loadModule":
                old_id = command["params"]["moduleId"]
                new_id = f"{command['params']['model']}@{command['params']['location']['slotName']}"
                module_id_map[old_id] = new_id
            case "loadLabware":
                old_id = command["params"]["labwareId"]
                if "slotName" in command["params"]["location"]:
                    location = command["params"]["location"]["slotName"]
                elif "addressableAreaName" in command["params"]["location"]:
                    location = command["params"]["location"]["addressableAreaName"]
                elif "moduleId" in command["params"]["location"]:
                    location = module_id_map[command["params"]["location"]["moduleId"]]
                elif "labwareId" in command["params"]["location"]:
                    location = labware_id_map[
                        command["params"]["location"]["labwareId"]
                    ]
                new_id = f"{command['params']['loadName']}@{location}"
                labware_id_map[old_id] = new_id

    # Rewrite all the IDs in the commands:
    for command in json_commands:
        if "pipetteId" in command["params"]:
            command["params"]["pipetteId"] = pipette_id_map[
                command["params"]["pipetteId"]
            ]
        if "moduleId" in command["params"]:
            command["params"]["moduleId"] = module_id_map[command["params"]["moduleId"]]
        if "labwareId" in command["params"]:
            command["params"]["labwareId"] = labware_id_map[
                command["params"]["labwareId"]
            ]
        for sub_param in command["params"].values():
            if isinstance(sub_param, dict):
                if "moduleId" in sub_param:
                    sub_param["moduleId"] = module_id_map[sub_param["moduleId"]]
                if "labwareId" in sub_param:
                    sub_param["labwareId"] = labware_id_map[sub_param["labwareId"]]

    # For liquidIds, there is no good way to assign consistent names to them, so just
    # delete them.
    for command in json_commands:
        command["params"].pop("liquidId", None)

    # Remove some default values that the PAPI adds to loadPipette commands.
    for command in json_commands:
        if command["commandType"] == "loadPipette":
            if command["params"].get("liquidPresenceDetection") is False:
                command["params"].pop("liquidPresenceDetection")

    for command in json_commands:
        command["params"].pop("tipOverlapNotAfterVersion", None)

    # JSON protocols always adds a displayName to labware, whereas Python protocols omit
    # the displayName if it's the same as the labware definition:
    for command in json_commands:
        if command["commandType"] == "loadLabware":
            if (
                command["params"].get("displayName")
                == command["result"]["definition"]["metadata"]["displayName"]
            ):
                command["params"].pop("displayName")

    # The RunResult commands also have a lot of fields like `createdAt` and `result` that
    # we don't want. Keep only the `params`.
    json_commands = [
        {"commandType": command["commandType"], "params": command["params"]}
        for command in json_commands
    ]

    # Also drop the `home` command that the protocol runner inserted at the beginning:
    if json_commands[0]["commandType"] == "home":
        json_commands = json_commands[1:]

    return json_commands


def _sort_load_commands(commands: list[dict[str, Any]]) -> None:
    """Reorder loadPipette/loadModule/loadLabware commands to match PD Python export."""
    sort_order = {"loadModule": 1, "loadLabware": 2, "loadPipette": 3}
    load_cmd_start = 0
    while (
        load_cmd_start < len(commands)
        and commands[load_cmd_start]["commandType"] not in sort_order
    ):
        load_cmd_start += 1
    load_cmd_end = load_cmd_start + 1
    while (
        load_cmd_end < len(commands)
        and commands[load_cmd_end]["commandType"] in sort_order
    ):
        load_cmd_end += 1

    commands[load_cmd_start:load_cmd_end] = sorted(
        commands[load_cmd_start:load_cmd_end],
        key=lambda command: sort_order[command["commandType"]],
    )


def _sort_load_liquid(commands: list[dict[str, Any]]) -> None:
    """Sort the loadLiquid commands in commands."""
    load_liquid_start = 0
    while (
        load_liquid_start < len(commands)
        and commands[load_liquid_start]["commandType"] != "loadLiquid"
    ):
        load_liquid_start += 1
    load_liquid_end = load_liquid_start + 1
    while (
        load_liquid_end < len(commands)
        and commands[load_liquid_end]["commandType"] == "loadLiquid"
    ):
        load_liquid_end += 1

    commands[load_liquid_start:load_liquid_end] = sorted(
        commands[load_liquid_start:load_liquid_end],
        key=lambda command: (
            command["params"]["labwareId"],
            sorted(command["params"]["volumeByWell"].items()),
        ),
    )


def _expand_load_liquid(commands: list[dict[str, Any]]) -> None:
    """Expand any multi-well loadLiquid commands to match PD Python export."""
    expanded_commands = []
    for command in commands:
        if command["commandType"] == "loadLiquid":
            original_volume_by_well = command["params"].pop("volumeByWell")
            for well, volume in original_volume_by_well.items():
                load_liquid_command = deepcopy(command)
                load_liquid_command["params"]["volumeByWell"] = {well: volume}
                expanded_commands.append(load_liquid_command)
        else:
            expanded_commands.append(command)
    commands[:] = expanded_commands


def _expand_thermocycler_profiles(commands: list[dict[str, Any]]) -> None:
    """Expand any repetitions in thermocycler profiles so that we can compare them."""
    for command in commands:
        if command["commandType"] == "thermocycler/runExtendedProfile":
            command["commandType"] = "thermocycler/runProfile"
            profile = []
            profile_elements = command["params"].pop("profileElements")
            for element in profile_elements:
                repetitions = element.get("repetitions", 1)
                profile.extend(element["steps"] * repetitions)
            command["params"]["profile"] = profile


# Ugh ... In the PAPI, if you use a Location like well.bottom(), the API turns it into a
# Point with an absolute position, and doesn't remember that it is a position relative to
# the bottom of the well. Then when the API generates engine commands, it takes the Point
# and recomputes its relative position from the TOP of the well. So the offsets in the
# engine commands that the PAPI generates are completely different from the offsets in
# the JSON protocol.
#
# To hack around this limitation, this test patches Well.bottom() to add a secret
# field `._well_bottom_z` to the Location object that it returns. Then in aspirate() and
# dispense(), if the Location has the secret field `._well_bottom_z`, we emit offsets
# from the bottom of the well instead of from the top.

_original_well_bottom = Well.bottom
_original_instrument_aspirate = InstrumentCore.aspirate
_original_instrument_dispense = InstrumentCore.dispense
_original_instrument_move_to = InstrumentCore.move_to
_original_get_relative_liquid_handling_well_location = (
    GeometryView._get_relative_liquid_handling_well_location
)


def _patched_well_bottom(self: Well, z: float = 0.0) -> Location:
    location = _original_well_bottom(self, z)
    location._well_bottom_z = _original_well_bottom(self, 0).point.z  # type: ignore[attr-defined]
    return location


def _make_patched_get_relative_liquid_handling_well_location(location: Location) -> Any:
    # This is a nested helper function, sorry.
    # The outer function is a factory that captures the `location` that aspirate()/etc was
    # called with. We return this inner function that will be used to patch the call to
    # _get_relative_liquid_handling_well_location().
    def patched_get_relative_liquid_handling_well_location(
        *args: Any, **kwargs: Any
    ) -> Tuple[WellLocationType, bool]:
        well_location, dynamic = _original_get_relative_liquid_handling_well_location(
            *args, **kwargs
        )
        if hasattr(location, "_well_bottom_z"):
            well_location.origin = WellOrigin.BOTTOM
            well_location.offset.z = float(
                Decimal(repr(location.point.z)) - Decimal(repr(location._well_bottom_z))
            )
        return well_location, dynamic

    return patched_get_relative_liquid_handling_well_location


def _patched_instrument_aspirate(
    self: InstrumentCore, location: Location, *args: Any, **kwargs: Any
) -> None:
    # Patch GeometryView._get_relative_liquid_handling_well_location() only during aspirate()
    with mock.patch.object(
        GeometryView,
        "_get_relative_liquid_handling_well_location",
        _make_patched_get_relative_liquid_handling_well_location(location),
    ):
        _original_instrument_aspirate(self, location, *args, **kwargs)


def _patched_instrument_dispense(
    self: InstrumentCore, location: Location, *args: Any, **kwargs: Any
) -> None:
    # Patch GeometryView._get_relative_liquid_handling_well_location() only during dispense()
    with mock.patch.object(
        GeometryView,
        "_get_relative_liquid_handling_well_location",
        _make_patched_get_relative_liquid_handling_well_location(location),
    ):
        _original_instrument_dispense(self, location, *args, **kwargs)


def _patched_instrument_move_to(
    self: InstrumentCore, location: Location, *args: Any, **kwargs: Any
) -> None:
    # Patch GeometryView._get_relative_liquid_handling_well_location() only during move_to()
    with mock.patch.object(
        GeometryView,
        "_get_relative_liquid_handling_well_location",
        _make_patched_get_relative_liquid_handling_well_location(location),
    ):
        _original_instrument_move_to(self, location, *args, **kwargs)


PROTOCOL_PATH_ROOTS = [
    path.with_suffix("")
    for path in (Path(__file__).parent / "__pd_protocols__").glob("*.json")
]
"""The filenames of the protocols in the test directory, without the .json/.py suffixes."""


@pytest.mark.parametrize(
    "protocol_path_root", PROTOCOL_PATH_ROOTS, ids=lambda path: path.name
)
@mock.patch.object(Well, "bottom", _patched_well_bottom)
@mock.patch.object(InstrumentCore, "aspirate", _patched_instrument_aspirate)
@mock.patch.object(InstrumentCore, "dispense", _patched_instrument_dispense)
@mock.patch.object(InstrumentCore, "move_to", _patched_instrument_move_to)
async def test_python_interoperability(protocol_path_root: Path) -> None:
    """Compare the commands in the .py and .json protocol."""
    python_protocol_path = protocol_path_root.with_suffix(".py")
    python_commands = await _get_engine_commands_for_protocol(python_protocol_path)

    json_protocol_path = protocol_path_root.with_suffix(".json")
    json_commands = await _get_engine_commands_for_protocol(json_protocol_path)

    assert python_commands == json_commands

    # If you're looking at test failures in the PyCharm IDE, the `Expected` window is
    # the JSON protocol, and the `Actual` window is the Python protocol.
