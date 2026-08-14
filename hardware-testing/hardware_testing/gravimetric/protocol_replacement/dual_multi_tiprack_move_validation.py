"""Validate the four extension-deck tip-rack moves used by dual multi runs."""

from typing import List, Tuple

from opentrons.protocol_api import Labware, ParameterContext, ProtocolContext


metadata = {"protocolName": "Dual Multi Tip Rack Move Validation"}
requirements = {"robotType": "Flex", "apiLevel": "2.29"}


TIPRACK_LOAD_NAMES = {
    "50": "opentrons_flex_96_tiprack_50ul",
    "200": "opentrons_flex_96_tiprack_200ul",
    "1000": "opentrons_flex_96_tiprack_1000ul",
}

TIPRACK_MOVES: List[Tuple[str, str]] = [
    ("A4", "B2"),
    ("B4", "B3"),
    ("C4", "D2"),
    ("D4", "D3"),
]


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters for the physical placement check."""
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
    parameters.add_bool(
        variable_name="pause_before_first_move",
        display_name="Pause Before Moving",
        default=True,
        description="Pause so the four source racks can be checked before moving.",
    )
    parameters.add_bool(
        variable_name="pause_after_each_move",
        display_name="Inspect Every Placement",
        default=True,
        description="Pause after every move for a physical placement check.",
    )


def run(ctx: ProtocolContext) -> None:
    """Move four tip racks with the same paths used by the gravimetric protocol."""
    tip_size = str(ctx.params.tip_size)  # type: ignore[attr-defined]
    load_name = TIPRACK_LOAD_NAMES[tip_size]
    pause_before_first_move = bool(  # type: ignore[attr-defined]
        ctx.params.pause_before_first_move
    )
    pause_after_each_move = bool(  # type: ignore[attr-defined]
        ctx.params.pause_after_each_move
    )

    racks = {
        source_slot: ctx.load_labware(load_name, source_slot)
        for source_slot, _ in TIPRACK_MOVES
    }

    if pause_before_first_move:
        ctx.pause(
            f"Confirm one T{tip_size} rack is installed in each of "
            "A4, B4, C4, and D4. Confirm D2, D3, B2, and B3 are empty."
        )

    for move_index, (source_slot, target_slot) in enumerate(TIPRACK_MOVES, start=1):
        rack: Labware = racks[source_slot]
        ctx.comment(
            f"Move {move_index}/{len(TIPRACK_MOVES)}: "
            f"T{tip_size} rack {source_slot} -> {target_slot}"
        )
        ctx.move_labware(rack, target_slot, use_gripper=True)

        if pause_after_each_move:
            ctx.pause(
                f"Inspect the T{tip_size} rack in {target_slot}. "
                "Resume only after confirming it is centered and fully seated."
            )

    ctx.comment(
        "Four-rack placement check complete: "
        "A4->B2, B4->B3, C4->D2, D4->D3."
    )
