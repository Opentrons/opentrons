"""Statically Clung Tips on 8ch Pipette Trash Bin Removal Method tested on 8.3.1."""
from opentrons import types
from opentrons.hardware_control.types import OT3Mount
from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.hardware_control import SyncHardwareAPI
from typing import List

# NOTE: Analyzing Protocol will raise a TipNotAttachedError. Ignore it and run on robot.


metadata = {
    "protocolName": "Trash Bin Tip Removal",
    "author": "Jon Klar",
    "description": "Trash Bin Swipe Method for Statically Clung Tips on 8ch Pipette",
}

requirements = {"robotType": "OT-3", "apiLevel": "2.21"}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_float(
        variable_name="z_travel",
        display_name="z distance to trash",
        default=-44.0,
        unit="mm",
        minimum=-48.0,
        maximum=0.0,
        description="distance the pipette travels to reach the trash bin",
    )

    parameters.add_float(
        variable_name="x_travel",
        display_name="x distance to edge of trash",
        default=-110.4,
        unit="mm",
        minimum=-115.0,
        maximum=115.0,
        description="distance the pipette travels to reach the edge of the trash bin",
    )

    parameters.add_float(
        variable_name="clip_offset",
        display_name="clip distance",
        default=-1.25,
        minimum=-5.0,
        maximum=5.0,
        unit="mm",
        description="distance the pipette travels to clip the edge of the trash bin",
    )

    parameters.add_int(
        variable_name="tip_cols",
        display_name="columns of tips",
        default=12,
        minimum=1,
        maximum=60,
        description="12 correlates to 1 full tip rack.",
    )
    parameters.add_str(
        variable_name="pipette_type",
        display_name="8ch Pipette Type",
        choices=[
            {"display_name": "50 ul", "value": "flex_8channel_50"},
            {"display_name": "1000 ul", "value": "flex_8channel_1000"},
        ],
        default="flex_8channel_50",
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol to removing statically clung tips with trash bin."""
    x_travel = protocol.params.x_travel  # type: ignore[attr-defined]
    z_travel = protocol.params.z_travel  # type: ignore[attr-defined]
    clip_offset = protocol.params.clip_offset  # type: ignore[attr-defined]
    cols_of_tips = protocol.params.tip_cols  # type: ignore[attr-defined]
    pipette_type = protocol.params.pipette_type  # type: ignore[attr-defined]

    trash = protocol.load_trash_bin("A3")

    DECK_SLOTS: List[str] = ["D1", "B1", "D2", "B2", "B3"]
    tip_racks = [
        protocol.load_labware("opentrons_flex_96_filtertiprack_50ul", slot)
        for slot in DECK_SLOTS
    ]
    pipette = protocol.load_instrument(pipette_type, "left", tip_racks=tip_racks)

    all_tips_by_col = []
    loaded_cols = 0
    for rack in tip_racks:
        for col in rack.columns():
            all_tips_by_col.append(col)
            loaded_cols += 1
            if loaded_cols == cols_of_tips:
                break

    hwapi = protocol._core.get_hardware()
    hwapi._cache_instruments()
    hwapi._cache_current_position()

    mount = OT3Mount.LEFT
    checked_mount = OT3Mount.from_mount(pipette._core.get_mount())
    pipette_hw = hwapi._pipette_handler.get_pipette(checked_mount)
    bottom_pos = pipette_hw.plunger_positions.bottom
    drop_tip_pos = pipette_hw.plunger_positions.drop_tip

    def drop_tip_with_ejector_extended(api: SyncHardwareAPI, mount: OT3Mount) -> None:
        """Drop tip with pipette ejector extended."""
        move_pipette_plunger(api, mount, drop_tip_pos)
        api.remove_tip(mount)
        pipette._last_tip_picked_up_from = None  # type: ignore[misc]
    def clip_trash_edge() -> None:
        """Knock tips off with trash bin edge."""
        hwapi.move_rel(mount, types.Point(x=clip_offset + x_travel))

    def pipette_to_neutral_position(api: SyncHardwareAPI, mount: OT3Mount) -> None:
        """Move pipette back to neutral state."""
        move_pipette_plunger(api, mount, bottom_pos)

    def move_pipette_plunger(api: SyncHardwareAPI, mount: OT3Mount, pos: float) -> None:
        """Move pipette plunger."""
        current_pos = hwapi._current_position
        realmount = OT3Mount.from_mount(mount)
        target_pos = target_position_from_plunger(realmount, pos, current_pos)
        api._move(target_pos)

    for col in all_tips_by_col:
        pipette.pick_up_tip(col[0])
        pipette.move_to(trash.top(x=x_travel, z=z_travel))
        drop_tip_with_ejector_extended(hwapi, mount)
        clip_trash_edge()
        pipette_to_neutral_position(hwapi, mount)
        pipette.home()
