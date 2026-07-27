"""E2E: 96-channel full-rack transfers with manual tip tracking and stacker swap."""

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage, TransferStepConfig, add_transfer_step
from automation.pd_pages.flex_stacker import FlexStackerPage
from automation.pd_pages.partial_96ch import (
    FULL_RACK_MANUAL_TIPS,
    FULL_RACK_SAMPLE_STEP_INDICES,
    PLATE_96,
    PROTOCOL_PATH,
    TIPRACK_200,
    print_suite_plan,
    replace_depleted_200ul_tiprack,
)
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96_channel_full_rack_and_manual_tip_selection(page: Page, pd_exports_dir: Path) -> None:
    """Exercise full-rack 96ch transfers with automatic and manual tip tracking."""
    print_suite_plan(
        "96ch full-rack + stacker swap + Never",
        [
            "Full-rack transfer — 200µL, automatic, Once, return tip",
            "Full-rack transfer — Always, manual tip A1, waste chute",
            "Stacker retrieve fresh 200µL + move depleted to waste + place fresh on D2",
            "Full-rack Once, manual tip A1, waste chute (Never setup)",
            "Full-rack Never (reuse tip)",
            f"Assert timeline sample {FULL_RACK_SAMPLE_STEP_INDICES} + export 96ch_full_rack_manual_tips.py",
        ],
    )

    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)
    stacker = FlexStackerPage(page)

    print("96ch full-rack transfer — 200µL tip rack, automatic, Once")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=PLATE_96,
            dest_labware=PLATE_96,
            source_wells="A1",
            dest_wells="B1",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Tip rack",
            nozzle_config="All nozzles (recommended)",
        ),
    )

    print("96ch full-rack transfer — Always, manual tip selection, waste chute")
    add_transfer_step(
        editor,
        transfer,
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
            tip_tracking="Manual tip tracking",
            manual_tips=FULL_RACK_MANUAL_TIPS,
            nozzle_config="All nozzles (recommended)",
        ),
    )

    replace_depleted_200ul_tiprack(editor, stacker)

    print("96ch full-rack transfer — Once, manual tip selection (setup for Never reuse)")
    add_transfer_step(
        editor,
        transfer,
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
            tip_tracking="Manual tip tracking",
            manual_tips=FULL_RACK_MANUAL_TIPS,
            nozzle_config="All nozzles (recommended)",
        ),
    )

    print("96ch full-rack transfer — Never (reuse manually selected full-rack tip)")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=PLATE_96,
            dest_labware=PLATE_96,
            source_wells="A4",
            dest_wells="B4",
            path="Single transfer",
            volume="50",
            change_tip="Never",
            nozzle_config="All nozzles (recommended)",
        ),
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=7)
    timeline.expect_no_known_regression_errors()

    timeline.select_transfer_steps_sample(FULL_RACK_SAMPLE_STEP_INDICES, expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="96ch_full_rack_manual_tips.py",
    )
