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
_AUTO: TransferPage.TipTrackingMode = "Automatic tip tracking (recommended)"

# (nozzle_config, primary_nozzle, path) -> (source_wells, dest_wells) on a 384 plate.
_WELLS_384: dict[tuple[str, str, str], tuple[Union[str, List[str]], Union[str, List[str]]]] = {
    ("Single nozzle", "A1", "Single transfer"): ("A1", "C1"),
    ("Single nozzle", "A12", "Single transfer"): ("A1", "C1"),
    ("Single nozzle", "H1", "Single transfer"): ("P1", "P3"),
    ("Single nozzle", "H12", "Single transfer"): ("P24", "P22"),
    ("Single nozzle", "H1", "Distribute"): ("P1", ["P3", "N1"]),
    ("Single column of nozzles", "A1", "Single transfer"): ("A1", "C1"),
}


def _wells(
    nozzle_config: TransferPage.NozzleConfig,
    primary: str,
    path: str = "Single transfer",
) -> tuple[Union[str, List[str]], Union[str, List[str]]]:
    return _WELLS_384[(nozzle_config, primary, path)]


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


def _run_transfers(
    editor: ProtocolEditorPage,
    transfer: TransferPage,
    steps: list[tuple[str, TransferStepConfig]],
) -> None:
    for label, config in steps:
        print(f"  - {label}")
        add_transfer_step(editor, transfer, config)


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

    # label, primary, path, change_tip, drop_location, tip_tracking, manual_tips
    print("2) Single-nozzle strategy phase")
    single_specs = [
        ("single A12 Once auto return", "A12", "Single transfer", "Once", "Tip rack", _AUTO, None),
        ("single H12 Once manual A1", "H12", "Single transfer", "Once", "Tip rack", _MANUAL, ["A1"]),
        ("single H1 Once auto return", "H1", "Single transfer", "Once", "Tip rack", _AUTO, None),
        ("single H1 Distribute Once manual A12", "H1", "Distribute", "Once", "Tip rack", _MANUAL, ["A12"]),
        ("single A1 Always auto", "A1", "Single transfer", "Always", "Tip rack", _AUTO, None),
        (
            "single H1 Once manual A12 waste (Never setup)",
            "H1",
            "Single transfer",
            "Once",
            "Waste Chute",
            _MANUAL,
            ["A12"],
        ),
        ("single H1 Never waste", "H1", "Single transfer", "Never", "Waste Chute", _AUTO, None),
    ]
    single_steps = []
    for label, primary, path, change_tip, drop, tip_tracking, manual_tips in single_specs:
        src, dst = _wells(_SINGLE, primary, path)
        single_steps.append(
            (
                label,
                TransferStepConfig(
                    tip_rack=TIPRACK_1000,
                    source_labware=PLATE_384,
                    dest_labware=PLATE_384,
                    source_wells=src,
                    dest_wells=dst,
                    path=path,
                    volume="30",
                    change_tip=change_tip,
                    drop_location=drop,
                    tip_tracking=tip_tracking,
                    manual_tips=manual_tips,
                    nozzle_config=_SINGLE,
                    primary_nozzle=primary,
                ),
            )
        )
    _run_transfers(editor, transfer, single_steps)

    # label, change_tip, drop_location, tip_tracking, manual_tips
    print("3) Column-nozzle strategy phase")
    src_column, dst_column = _wells(_COLUMN, "A1")
    column_specs = [
        ("column A1 Once auto return", "Once", "Tip rack", _AUTO, None),
        ("column A1 Once manual A12 return", "Once", "Tip rack", _MANUAL, ["A12"]),
        ("column A1 Always manual A12 waste", "Always", "Waste Chute", _MANUAL, ["A12"]),
    ]
    column_steps = [
        (
            label,
            TransferStepConfig(
                tip_rack=TIPRACK_1000,
                source_labware=PLATE_384,
                dest_labware=PLATE_384,
                source_wells=src_column,
                dest_wells=dst_column,
                path="Single transfer",
                volume="30",
                change_tip=change_tip,
                drop_location=drop,
                tip_tracking=tip_tracking,
                manual_tips=manual_tips,
                nozzle_config=_COLUMN,
                primary_nozzle="A1",
            ),
        )
        for label, change_tip, drop, tip_tracking, manual_tips in column_specs
    ]
    _run_transfers(editor, transfer, column_steps)

    # label, source, dest, change_tip, drop_location, tip_tracking, manual_tips
    print("4) Full-rack strategy phase")
    full_rack_specs = [
        ("full A1->B1 Once auto return", "A1", "B1", "Once", "Tip rack", _AUTO, None),
        ("full A2->B2 Always manual A1 waste", "A2", "B2", "Always", "Waste Chute", _MANUAL, ["A1"]),
        ("full A3->B3 Once manual A1 waste (Never setup)", "A3", "B3", "Once", "Waste Chute", _MANUAL, ["A1"]),
        ("full A4->B4 Never", "A4", "B4", "Never", "Tip rack", _AUTO, None),
    ]

    def _full_rack_steps(specs: list) -> list[tuple[str, TransferStepConfig]]:
        return [
            (
                label,
                TransferStepConfig(
                    tip_rack=TIPRACK_200,
                    source_labware=PLATE_96,
                    dest_labware=PLATE_96,
                    source_wells=src,
                    dest_wells=dst,
                    path="Single transfer",
                    volume="50",
                    change_tip=change_tip,
                    drop_location=drop,
                    tip_tracking=tip_tracking,
                    manual_tips=manual_tips,
                    nozzle_config=_ALL,
                ),
            )
            for label, src, dst, change_tip, drop, tip_tracking, manual_tips in specs
        ]

    _run_transfers(editor, transfer, _full_rack_steps(full_rack_specs[:2]))
    _replace_depleted_200ul_tiprack(editor, stacker)
    _run_transfers(editor, transfer, _full_rack_steps(full_rack_specs[2:]))
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
