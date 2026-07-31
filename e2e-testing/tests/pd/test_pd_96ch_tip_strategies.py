"""E2E: consolidated 96-channel tip strategies in a single protocol session."""

from pathlib import Path
from typing import List, Union

import pytest
from playwright.sync_api import Page

from automation.pd_pages import (
    ProtocolEditorPage,
    Timeline,
    TransferPage,
    TransferStepConfig,
    add_transfer_steps,
)
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/96_channel_setup.py"
PLATE_384 = "Applied Biosystems MicroAmp 384 Well Plate 40 µL"
PLATE_96 = "NEST 96 Deep Well Plate 2 mL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_200 = "Opentrons Flex 96 Filter Tip Rack 200 µL"

_TIPRACK_1000_B3 = "B3 Opentrons Flex 96 Filter Tip Rack 1000 µL"
_TIPRACK_1000_SAFE_SLOT = "B2"

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


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96ch_tip_strategies_sequential(page: Page, pd_exports_dir: Path) -> None:
    """Run column/single/full-rack 96ch tip strategies in one session.

    Ordering constraints (96ch tip cascade):
    - COLUMN + primary A1 must run on a pristine tiprack and start at A12
      (tips to the right must be EMPTY for the next column).
    - Prefer waste over return for single/column: returned tips become DIRTY and
      block later cascade paths (EMPTY does not).
    - ALL-nozzle full-rack pickups use the adapter tiprack; keep those as return
      so the suite does not end in "Not enough accessible tips".
    """
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    print("=== 96ch strategy suite ===")
    print("1) Move B3 tiprack to B2 once")
    editor.move_labware_with_gripper(_TIPRACK_1000_B3, _TIPRACK_1000_SAFE_SLOT)

    # Column first while the 1000 µL tiprack is still pristine.
    print("2) Column-nozzle strategy phase")
    src_column, dst_column = _wells(_COLUMN, "A1")
    column_specs = [
        ("column A1 Once auto waste", "Once", "Waste Chute", _AUTO, None),
        ("column A1 Once manual A11 waste", "Once", "Waste Chute", _MANUAL, ["A11"]),
        ("column A1 Always manual A10 waste", "Always", "Waste Chute", _MANUAL, ["A10"]),
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
    add_transfer_steps(editor, transfer, column_steps)

    print("3) Single-nozzle strategy phase")
    single_specs = [
        ("single A12 Once auto waste", "A12", "Single transfer", "Once", "Waste Chute", _AUTO, None),
        ("single H12 Once manual A1 waste", "H12", "Single transfer", "Once", "Waste Chute", _MANUAL, ["A1"]),
        ("single H1 Once auto waste", "H1", "Single transfer", "Once", "Waste Chute", _AUTO, None),
        ("single H1 Distribute Once auto waste", "H1", "Distribute", "Once", "Waste Chute", _AUTO, None),
        ("single A1 Always auto waste", "A1", "Single transfer", "Always", "Waste Chute", _AUTO, None),
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
    add_transfer_steps(editor, transfer, single_steps)

    print("4) Full-rack strategy phase")
    full_rack_specs = [
        ("full A1->B1 Once auto return", "A1", "B1", "Once", "Tip rack", _AUTO, None),
        ("full A2->B2 Always manual A1 return", "A2", "B2", "Always", "Tip rack", _MANUAL, ["A1"]),
        ("full A3->B3 Once manual A1 return", "A3", "B3", "Once", "Tip rack", _MANUAL, ["A1"]),
    ]
    full_rack_steps = [
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
        for label, src, dst, change_tip, drop, tip_tracking, manual_tips in full_rack_specs
    ]
    add_transfer_steps(editor, transfer, full_rack_steps)

    print("5) Timeline + export validation")
    # 1 move + 3 column + 5 single + 3 full-rack
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=12)
    timeline.expect_no_known_regression_errors()
    timeline.select_transfer_steps_sample([1, 3, 6, 9, 11], expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="96ch_tip_strategies_sequential.py",
    )
