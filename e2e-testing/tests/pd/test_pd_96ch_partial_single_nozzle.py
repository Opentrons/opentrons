"""E2E: 96-channel single-nozzle partial tip strategies + Never reuse."""

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage, TransferPage
from automation.pd_pages.partial_96ch import (
    PROTOCOL_PATH,
    SINGLE_NOZZLE_SAMPLE_STEP_INDICES,
    move_1000ul_tiprack_away_from_stacker,
    print_suite_plan,
    run_partial_suite,
    single_nozzle_scenarios,
)
from utility import import_protocol_and_open_editor


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96ch_partial_single_nozzle_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Suite 1: Move + five single-nozzle transfers + manual A12 → Never."""
    scenarios = single_nozzle_scenarios()
    print_suite_plan(
        "96ch single-nozzle tip strategies (cascade opposite-corner + Never)",
        [
            "Gripper Move tiprack B3→B2 (clear A4 stacker collision)",
            *[s.label for s in scenarios],
            "H1 Once, manual tip A12, waste chute (Never setup; tip stays on pipette)",
            "H1 Never (same nozzle layout)",
            f"Assert timeline sample {SINGLE_NOZZLE_SAMPLE_STEP_INDICES} + export 96ch_partial_single_nozzle.py",
        ],
    )

    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    move_1000ul_tiprack_away_from_stacker(editor)
    min_steps = 1 + len(scenarios) + 2
    run_partial_suite(
        page,
        editor,
        transfer,
        scenarios,
        exports_dir=pd_exports_dir,
        export_filename="96ch_partial_single_nozzle.py",
        sample_indices=SINGLE_NOZZLE_SAMPLE_STEP_INDICES,
        min_steps=min_steps,
        include_never_pair=True,
    )
