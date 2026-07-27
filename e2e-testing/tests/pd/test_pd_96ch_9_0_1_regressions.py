"""Thin 96ch regression for PD 9.0.1 NEST 8 reservoir x-axis centering (AUTH-3066).

96ch ALL/COLUMN cannot use NEST 8 row-trough reservoirs; only ROW is valid
(see shared-data wellSets canPipetteUseLabware). AUTH-3066 centers the 12-tip
row on each trough in X.
"""

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.pd_pages import (
    ProtocolEditorPage,
    Timeline,
    TransferPage,
    TransferStepConfig,
    add_transfer_step,
)
from automation.pd_pages.partial_96ch import (
    PLATE_96,
    PROTOCOL_PATH,
    RESERVOIR_8,
    TIPRACK_1000,
    move_1000ul_tiprack_away_from_stacker,
    print_suite_plan,
)
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96ch_nest_8_reservoir_row_transfer(page: Page, pd_exports_dir: Path) -> None:
    """AUTH-3066: 96ch row transfer on NEST 8 Well Reservoir 22 mL (x-axis centering)."""
    print_suite_plan(
        "96ch NEST 8 reservoir row transfer (AUTH-3066)",
        [
            "Import 96_channel_setup",
            "Add NEST 8 Well Reservoir 22 mL to C2",
            "Move 1000µL tiprack B3→B2 (partial tip needs rack without adapter; clear stacker)",
            "Row A1 transfer reservoir A1 → 96 deep-well A1 (12 tips centered on trough)",
            "Assert no timeline errors + export",
        ],
    )

    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    editor.add_labware_to_slot("C2")
    editor.select_labware_category_by_name("Reservoirs")
    editor.select_labware_by_name(RESERVOIR_8)

    move_1000ul_tiprack_away_from_stacker(editor)

    print("96ch row A1 — NEST 8 A1 → 96 plate A1")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=RESERVOIR_8,
            dest_labware=PLATE_96,
            source_wells="A1",
            dest_wells="A1",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Waste Chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
        ),
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=2)
    timeline.expect_no_known_regression_errors()
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="96ch_nest_8_reservoir_row.py",
    )
