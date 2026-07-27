"""E2E: 96-channel row partial tip strategy (isolated xfail coverage)."""

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage
from automation.pd_pages.transfer_form import TransferStepConfig, add_transfer_step
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

_ROW: TransferPage.NozzleConfig = "Single row of nozzles"
_MANUAL: TransferPage.TipTrackingMode = "Manual tip tracking"
_AUTO: TransferPage.TipTrackingMode = "Automatic tip tracking (recommended)"

PROTOCOL_PATH = "fixtures/protocol/9/96_channel_setup.py"
PLATE_384 = "Applied Biosystems MicroAmp 384 Well Plate 40 µL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
ROW_NOZZLE_SAMPLE_STEP_INDICES = [1, 2, 3]
_TIPRACK_1000_B3 = "B3 Opentrons Flex 96 Filter Tip Rack 1000 µL"
_TIPRACK_1000_SAFE_SLOT = "B2"

# primary_nozzle -> (source_wells, dest_wells) on a 384 plate.
_WELLS_384 = {
    "A1": ("A1", "A3"),
    "H1": ("P1", "P3"),
}

_ROW_LIQUID_CLASS_CONTINUE_REASON = (
    "96ch single-row transfers hang on liquid-class Continue in this fixture "
    "(column/single/full-rack suites pass). Cascade tip map is in place; "
    "re-enable when row + liquid-class Continue is stable in headed runs."
)


def _move_1000ul_tiprack_away_from_stacker(editor: ProtocolEditorPage) -> None:
    print("96ch partial - move 1000uL tiprack from B3 to B2")
    editor.add_step("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")
    editor.move_labware(_TIPRACK_1000_B3, _TIPRACK_1000_SAFE_SLOT)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
@pytest.mark.xfail(reason=_ROW_LIQUID_CLASS_CONTINUE_REASON, strict=False)
def test_pd_96ch_partial_row_nozzle_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Suite 2: Move + row-nozzle transfers on cascade-safe opposite tip rows."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    _move_1000ul_tiprack_away_from_stacker(editor)

    # label, primary, change_tip, drop_location, tip_tracking, manual_tips
    print("Row-nozzle strategy phase")
    row_specs = [
        ("row A1 Once auto waste", "A1", "Once", "Waste Chute", _AUTO, None),
        ("row H1 Once auto waste", "H1", "Once", "Waste Chute", _AUTO, None),
        ("row A1 Always auto waste", "A1", "Always", "Waste Chute", _AUTO, None),
        ("row A1 Once manual H1 return", "A1", "Once", "Tip rack", _MANUAL, ["H1"]),
    ]
    for label, primary, change_tip, drop, tip_tracking, manual_tips in row_specs:
        src, dst = _WELLS_384[primary]
        print(f"  - {label}")
        add_transfer_step(
            editor,
            transfer,
            TransferStepConfig(
                tip_rack=TIPRACK_1000,
                source_labware=PLATE_384,
                dest_labware=PLATE_384,
                source_wells=src,
                dest_wells=dst,
                path="Single transfer",
                volume="30",
                change_tip=change_tip,
                drop_location=drop,
                tip_tracking=tip_tracking,
                manual_tips=manual_tips,
                nozzle_config=_ROW,
                primary_nozzle=primary,
            ),
        )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=1 + len(row_specs))
    timeline.expect_no_known_regression_errors()
    timeline.select_transfer_steps_sample(ROW_NOZZLE_SAMPLE_STEP_INDICES, expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="96ch_partial_row_nozzle.py",
    )
