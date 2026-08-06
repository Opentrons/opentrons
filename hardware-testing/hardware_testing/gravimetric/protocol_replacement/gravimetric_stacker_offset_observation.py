"""Observe one Flex Stacker gripper drop offset on real hardware."""

from typing import Dict, Tuple, cast
import json
import os

from opentrons.protocol_api import Labware, ParameterContext, ProtocolContext
from opentrons.protocol_api.module_contexts import FlexStackerContext


metadata = {"protocolName": "Gravimetric Stacker Offset Observation"}
requirements = {"robotType": "Flex", "apiLevel": "2.29"}


STACKER_MODEL = "flexStackerModuleV1"
TIPRACK_ADAPTER = "opentrons_flex_96_tiprack_adapter"
CONFIG_FILE = "gravimetric_stacker_drop_offsets.json"
ROBOT_CONFIG_PATH = (
    f"/data/hardware_testing/gravimetric/protocol_replacement/{CONFIG_FILE}"
)
ZERO_OFFSET = {"x": 0.0, "y": 0.0, "z": 0.0}


def add_parameters(parameters: ParameterContext) -> None:
    """Add offset-observation parameters."""
    parameters.add_str(
        variable_name="direction",
        display_name="Move Direction",
        default="stacker_to_deck",
        choices=[
            {"display_name": "Stacker to Deck", "value": "stacker_to_deck"},
            {"display_name": "Deck to Stacker", "value": "deck_to_stacker"},
        ],
    )
    parameters.add_str(
        variable_name="stacker_slot",
        display_name="Stacker Slot",
        default="B4",
        choices=[
            {"display_name": slot, "value": slot} for slot in ["A4", "B4", "C4", "D4"]
        ],
    )
    parameters.add_str(
        variable_name="deck_slot",
        display_name="Deck Slot",
        default="B1",
        choices=[
            {"display_name": slot, "value": slot}
            for slot in [
                "D2",
                "D3",
                "C2",
                "C3",
                "B1",
                "B2",
                "B3",
                "A1",
                "A2",
                "A3",
            ]
        ],
    )
    parameters.add_str(
        variable_name="tip_size",
        display_name="Tip Rack Type",
        default="50",
        choices=[
            {"display_name": "T50", "value": "50"},
            {"display_name": "T200", "value": "200"},
            {"display_name": "T1000", "value": "1000"},
        ],
    )
    parameters.add_str(
        variable_name="offset_mode",
        display_name="Offset Source",
        default="robot_config",
        choices=[
            {
                "display_name": "Read Robot Config",
                "value": "robot_config",
            },
            {"display_name": "Manual XYZ", "value": "manual"},
        ],
    )
    for axis in ("x", "y", "z"):
        parameters.add_float(
            variable_name=f"offset_{axis}",
            display_name=f"Manual {axis.upper()} Offset (mm)",
            default=0.0,
            minimum=-5.0,
            maximum=5.0,
        )
    parameters.add_bool(
        variable_name="pause_before_move",
        display_name="Pause Before Move",
        default=True,
    )
    parameters.add_bool(
        variable_name="store_after_observation",
        display_name="Store Rack After Observation",
        default=False,
        description="Only applies to Deck to Stacker moves.",
    )


def _tiprack_load_name(tip_size: int) -> str:
    return f"opentrons_flex_96_tiprack_{tip_size}ul"


def _config_paths() -> list[str]:
    paths = []
    protocol_file = globals().get("__file__")
    if protocol_file:
        paths.append(
            os.path.join(
                os.path.dirname(os.path.abspath(str(protocol_file))),
                CONFIG_FILE,
            )
        )
    paths.append(ROBOT_CONFIG_PATH)
    return list(dict.fromkeys(paths))


def _normalize_offset(raw_offset: object, path: str) -> Dict[str, float]:
    if not isinstance(raw_offset, dict):
        raise ValueError(f"Offset in {path} must be a JSON object.")
    return {axis: float(raw_offset.get(axis, 0.0)) for axis in ("x", "y", "z")}


def _config_offset(
    ctx: ProtocolContext,
    direction: str,
    stacker_slot: str,
    deck_slot: str,
) -> Tuple[Dict[str, float], str]:
    source_slot, target_slot = (
        (stacker_slot, deck_slot)
        if direction == "stacker_to_deck"
        else (deck_slot, stacker_slot)
    )
    for path in _config_paths():
        if not os.path.exists(path):
            continue
        with open(path, "r") as config_file:
            config = json.load(config_file)
        try:
            raw_offset = config[direction][source_slot][target_slot]
        except (KeyError, TypeError) as error:
            raise RuntimeError(
                f"Missing {direction} offset for {source_slot} -> "
                f"{target_slot} in {path}."
            ) from error
        return _normalize_offset(raw_offset, path), path

    if ctx.is_simulating():
        return dict(ZERO_OFFSET), "simulation fallback: zero offset"
    raise RuntimeError(
        f"Stacker offset config was not found. Expected {ROBOT_CONFIG_PATH}."
    )


def _manual_offset(ctx: ProtocolContext) -> Dict[str, float]:
    return {
        axis: float(getattr(ctx.params, f"offset_{axis}")) for axis in ("x", "y", "z")
    }


def _active_offset(
    ctx: ProtocolContext,
    direction: str,
    stacker_slot: str,
    deck_slot: str,
) -> Tuple[Dict[str, float], str]:
    if ctx.params.offset_mode == "manual":  # type: ignore[attr-defined]
        return _manual_offset(ctx), "runtime manual XYZ"
    return _config_offset(ctx, direction, stacker_slot, deck_slot)


def _load_empty_adapter(ctx: ProtocolContext, deck_slot: str) -> Labware:
    return ctx.load_adapter(TIPRACK_ADAPTER, deck_slot)


def _load_rack_on_adapter(
    ctx: ProtocolContext, deck_slot: str, load_name: str
) -> Labware:
    adapter = _load_empty_adapter(ctx, deck_slot)
    return adapter.load_labware(load_name)


def _pause_before_move(
    ctx: ProtocolContext,
    direction: str,
    stacker_slot: str,
    deck_slot: str,
    tip_size: int,
    drop_offset: Dict[str, float],
    offset_source: str,
) -> None:
    if not ctx.params.pause_before_move:  # type: ignore[attr-defined]
        return
    if direction == "stacker_to_deck":
        setup = (
            f"Confirm one T{tip_size} rack is inside the {stacker_slot} hopper "
            f"with the shuttle empty, and the adapter at {deck_slot} is empty."
        )
    else:
        setup = (
            f"Confirm one T{tip_size} rack is on the adapter at {deck_slot}, "
            f"and the {stacker_slot} shuttle and hopper are empty."
        )
    ctx.pause(f"{setup} Applied drop offset={drop_offset}; source={offset_source}.")


def _stacker_to_deck(
    ctx: ProtocolContext,
    stacker: FlexStackerContext,
    deck_slot: str,
    load_name: str,
    drop_offset: Dict[str, float],
) -> None:
    adapter = _load_empty_adapter(ctx, deck_slot)
    stacker.set_stored_labware(load_name=load_name, count=1)
    rack = stacker.retrieve()
    ctx.move_labware(
        rack,
        adapter,
        use_gripper=True,
        drop_offset=drop_offset,
    )


def _deck_to_stacker(
    ctx: ProtocolContext,
    stacker: FlexStackerContext,
    deck_slot: str,
    load_name: str,
    drop_offset: Dict[str, float],
) -> None:
    rack = _load_rack_on_adapter(ctx, deck_slot, load_name)
    stacker.set_stored_labware(load_name=load_name, count=0)
    ctx.move_labware(
        rack,
        stacker,
        use_gripper=True,
        drop_offset=drop_offset,
    )
    ctx.pause("Inspect the rack position on the stacker shuttle.")
    if ctx.params.store_after_observation:  # type: ignore[attr-defined]
        stacker.store()


def run(ctx: ProtocolContext) -> None:
    """Execute one offset-observation movement."""
    direction = str(ctx.params.direction)  # type: ignore[attr-defined]
    stacker_slot = str(ctx.params.stacker_slot)  # type: ignore[attr-defined]
    deck_slot = str(ctx.params.deck_slot)  # type: ignore[attr-defined]
    tip_size = int(ctx.params.tip_size)  # type: ignore[attr-defined]
    load_name = _tiprack_load_name(tip_size)
    drop_offset, offset_source = _active_offset(
        ctx,
        direction,
        stacker_slot,
        deck_slot,
    )

    source_slot, target_slot = (
        (stacker_slot, deck_slot)
        if direction == "stacker_to_deck"
        else (deck_slot, stacker_slot)
    )
    ctx.comment(
        f"OFFSET OBSERVATION: {direction} {source_slot} -> {target_slot}; "
        f"drop_offset={drop_offset}; source={offset_source}"
    )

    stacker = cast(
        FlexStackerContext,
        ctx.load_module(STACKER_MODEL, stacker_slot),
    )
    _pause_before_move(
        ctx,
        direction,
        stacker_slot,
        deck_slot,
        tip_size,
        drop_offset,
        offset_source,
    )

    if direction == "stacker_to_deck":
        _stacker_to_deck(
            ctx,
            stacker,
            deck_slot,
            load_name,
            drop_offset,
        )
        ctx.pause("Inspect the rack position on the deck adapter.")
    else:
        _deck_to_stacker(
            ctx,
            stacker,
            deck_slot,
            load_name,
            drop_offset,
        )
