"""E2E: consolidated 96-channel tip strategies in a single protocol session."""

from pathlib import Path
from typing import List, Union

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage
from automation.pd_pages.flex_stacker import FlexStackerPage
from automation.pd_pages.transfer_form import TransferStepConfig, add_transfer_step
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/96_channel_setup.py"
PLATE_384 = "Applied Biosystems MicroAmp 384 Well Plate 40 µL"
PLATE_96 = "NEST 96 Deep Well Plate 2 mL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_200 = "Opentrons Flex 96 Filter Tip Rack 200 µL"

_TIPRACK_1000_B3 = "B3 Opentrons Flex 96 Filter Tip Rack 1000 µL"
_TIPRACK_1000_SAFE_SLOT = "B2"
_FLEX_STACKER_A4 = "A4 Flex Stacker"
_TIPRACK_200_DEPLETED = "D2 Opentrons Flex 96 Filter Tip Rack 200 µL"
_TIPRACK_200_FRESH = "A4 Opentrons Flex 96 Filter Tip Rack 200 µL (1)"
_WASTE_CHUTE_D3 = "D3 Waste Chute in D3"

_SINGLE: TransferPage.NozzleConfig = "Single nozzle"
_COLUMN: TransferPage.NozzleConfig = "Single column of nozzles"
_ALL: TransferPage.NozzleConfig = "All nozzles (recommended)"
_MANUAL: TransferPage.TipTrackingMode = "Manual tip tracking"

# (nozzle_config, primary_nozzle, path) -> (source_wells, dest_wells) on a 384 plate.
_WELLS_384: dict[tuple[str, str, str], tuple[Union[str, List[str]], Union[str, List[str]]]] = {
    ("Single nozzle", "A1", "Single transfer"): ("A1", "C1"),
    ("Single nozzle", "A12", "Single transfer"): ("A1", "C1"),
    ("Single nozzle", "H1", "Single transfer"): ("P1", "P3"),
    ("Single nozzle", "H12", "Single transfer"): ("P24", "P22"),
    ("Single nozzle", "H1", "Distribute"): ("P1", ["P3", "N1"]),
    ("Single column of nozzles", "A1", "Single transfer"): ("A1", "C1"),
}


def _wells_for_partial_384(
    nozzle_config: TransferPage.NozzleConfig,
    primary_nozzle: str,
    path: str = "Single transfer",
) -> tuple[Union[str, List[str]], Union[str, List[str]]]:
    key = (nozzle_config, primary_nozzle, path)
    try:
        return _WELLS_384[key]
    except KeyError as err:
        raise KeyError(
            f"No 384 well map for nozzle={nozzle_config!r} primary={primary_nozzle!r} path={path!r}"
        ) from err


def _move_1000ul_tiprack_away_from_stacker(editor: ProtocolEditorPage) -> None:
    print("96ch partial - move 1000uL tiprack from B3 to B2")
    editor.add_step("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")
    editor.move_labware(_TIPRACK_1000_B3, _TIPRACK_1000_SAFE_SLOT)


def _replace_depleted_200ul_tiprack(editor: ProtocolEditorPage, stacker: FlexStackerPage) -> None:
    print("96ch full-rack - retrieve fresh 200uL tip rack from stacker")
    editor.add_step("Stacker")
    stacker.retrieve_stacker(_FLEX_STACKER_A4)
    stacker.save_stacker_step()
    stacker.wait_for_save_banner_gone()

    print("96ch full-rack - move depleted 200uL tip rack to waste chute")
    editor.add_step("Move")
    editor.move_labware(_TIPRACK_200_DEPLETED, _WASTE_CHUTE_D3)

    print("96ch full-rack - move fresh 200uL tip rack onto adapter")
    editor.add_step("Move")
    editor.move_labware(_TIPRACK_200_FRESH, "D2")


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96ch_tip_strategies_sequential(page: Page, pd_exports_dir: Path) -> None:
    """Run single/column/full-rack 96ch strategies sequentially in one session."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)
    stacker = FlexStackerPage(page)

    print("=== 96ch strategy suite ===")
    print("1) Move B3 tiprack to B2 once")
    _move_1000ul_tiprack_away_from_stacker(editor)

    print("2) Single-nozzle strategy phase")
    src_a12, dst_a12 = _wells_for_partial_384(_SINGLE, "A12")
    src_h12, dst_h12 = _wells_for_partial_384(_SINGLE, "H12")
    src_h1, dst_h1 = _wells_for_partial_384(_SINGLE, "H1")
    src_h1_dist, dst_h1_dist = _wells_for_partial_384(_SINGLE, "H1", "Distribute")
    src_a1, dst_a1 = _wells_for_partial_384(_SINGLE, "A1")

    single_steps = [
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_a12,
            dest_wells=dst_a12,
            path="Single transfer",
            volume="30",
            change_tip="Once",
            nozzle_config=_SINGLE,
            primary_nozzle="A12",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_h12,
            dest_wells=dst_h12,
            path="Single transfer",
            volume="30",
            change_tip="Once",
            tip_tracking=_MANUAL,
            manual_tips=["A1"],
            nozzle_config=_SINGLE,
            primary_nozzle="H12",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_h1,
            dest_wells=dst_h1,
            path="Single transfer",
            volume="30",
            change_tip="Once",
            nozzle_config=_SINGLE,
            primary_nozzle="H1",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_h1_dist,
            dest_wells=dst_h1_dist,
            path="Distribute",
            volume="30",
            change_tip="Once",
            tip_tracking=_MANUAL,
            manual_tips=["A12"],
            nozzle_config=_SINGLE,
            primary_nozzle="H1",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_a1,
            dest_wells=dst_a1,
            path="Single transfer",
            volume="30",
            change_tip="Always",
            nozzle_config=_SINGLE,
            primary_nozzle="A1",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_h1,
            dest_wells=dst_h1,
            path="Single transfer",
            volume="30",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking=_MANUAL,
            manual_tips=["A12"],
            nozzle_config=_SINGLE,
            primary_nozzle="H1",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells="P1",
            dest_wells="P3",
            path="Single transfer",
            volume="30",
            change_tip="Never",
            drop_location="Waste Chute",
            nozzle_config=_SINGLE,
            primary_nozzle="H1",
        ),
    ]
    for config in single_steps:
        add_transfer_step(editor, transfer, config)

    print("3) Column-nozzle strategy phase")
    src_column, dst_column = _wells_for_partial_384(_COLUMN, "A1")
    column_steps = [
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_column,
            dest_wells=dst_column,
            path="Single transfer",
            volume="30",
            change_tip="Once",
            nozzle_config=_COLUMN,
            primary_nozzle="A1",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_column,
            dest_wells=dst_column,
            path="Single transfer",
            volume="30",
            change_tip="Once",
            tip_tracking=_MANUAL,
            manual_tips=["A12"],
            nozzle_config=_COLUMN,
            primary_nozzle="A1",
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells=src_column,
            dest_wells=dst_column,
            path="Single transfer",
            volume="30",
            change_tip="Always",
            drop_location="Waste Chute",
            tip_tracking=_MANUAL,
            manual_tips=["A12"],
            nozzle_config=_COLUMN,
            primary_nozzle="A1",
        ),
    ]
    for config in column_steps:
        add_transfer_step(editor, transfer, config)

    print("4) Full-rack strategy phase")
    full_rack_before_swap = [
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=PLATE_96,
            dest_labware=PLATE_96,
            source_wells="A1",
            dest_wells="B1",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            nozzle_config=_ALL,
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=PLATE_96,
            dest_labware=PLATE_96,
            source_wells="A2",
            dest_wells="B2",
            path="Single transfer",
            volume="50",
            change_tip="Always",
            drop_location="Waste Chute",
            tip_tracking=_MANUAL,
            manual_tips=["A1"],
            nozzle_config=_ALL,
        ),
    ]
    full_rack_after_swap = [
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=PLATE_96,
            dest_labware=PLATE_96,
            source_wells="A3",
            dest_wells="B3",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking=_MANUAL,
            manual_tips=["A1"],
            nozzle_config=_ALL,
        ),
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=PLATE_96,
            dest_labware=PLATE_96,
            source_wells="A4",
            dest_wells="B4",
            path="Single transfer",
            volume="50",
            change_tip="Never",
            nozzle_config=_ALL,
        ),
    ]
    for config in full_rack_before_swap:
        add_transfer_step(editor, transfer, config)
    _replace_depleted_200ul_tiprack(editor, stacker)
    for config in full_rack_after_swap:
        add_transfer_step(editor, transfer, config)

    print("5) Timeline + export validation")
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=18)
    timeline.expect_no_known_regression_errors()
    timeline.select_transfer_steps_sample([1, 4, 8, 10, 12, 17], expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="96ch_tip_strategies_sequential.py",
    )
