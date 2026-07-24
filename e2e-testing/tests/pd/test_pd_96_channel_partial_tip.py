"""E2E tests for 96-channel partial/single tip pickup and full-rack transfer workflows.

Partial-tip coverage is split into three ~7-step suites so tip-inventory / cascade
failures stay isolated and singles+Never can land independently of row/column work.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Union

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage, TransferStepConfig, add_transfer_step
from automation.pd_pages.flex_stacker import FlexStackerPage
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/96_channel_setup.py"
PLATE_384 = "Applied Biosystems MicroAmp 384 Well Plate 40 µL"
PLATE_96 = "NEST 96 Deep Well Plate 2 mL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_200 = "Opentrons Flex 96 Filter Tip Rack 200 µL"

# 96ch all-nozzles manual tracking uses a single primary (A1) for the full-rack pickup.
FULL_RACK_MANUAL_TIPS: List[str] = ["A1"]
# 96ch SINGLE on a populated rack: cascade leaves only the corner opposite the primary
# nozzle selectable (unused nozzles must not sweep remaining tips).
#   H12 → A1, A12 → H1, H1 → A12, A1 → H12
PARTIAL_96CH_SINGLE_TIP_BY_PRIMARY: dict[str, str] = {
    "A1": "H12",
    "A12": "H1",
    "H1": "A12",
    "H12": "A1",
}
FLEX_STACKER_A4 = "A4 Flex Stacker"
TIPRACK_1000_B3 = "B3 Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_1000_SAFE_SLOT = "B2"
TIPRACK_200_DEPLETED = "D2 Opentrons Flex 96 Filter Tip Rack 200 µL"
TIPRACK_200_FRESH = "A4 Opentrons Flex 96 Filter Tip Rack 200 µL (1)"
WASTE_CHUTE_D3 = "D3 Waste Chute in D3"

# Sample indices are 0-based among draggable timeline steps (Move is index 0).
SINGLE_NOZZLE_SAMPLE_STEP_INDICES = [1, 3, 5]
ROW_NOZZLE_SAMPLE_STEP_INDICES = [1, 2, 3]
COLUMN_NOZZLE_SAMPLE_STEP_INDICES = [1, 2, 3]
FULL_RACK_SAMPLE_STEP_INDICES = [0, 5, 6]

# Row/column pickups need most of the rack empty before any primary is cascade-safe.
_ROW_COLUMN_CASCADE_REASON = (
    "96ch row/column pickup needs cascade-empty path "
    "(row H1 ⇒ A–G empty; row A1 ⇒ B–H empty; column A1 ⇒ cols 2–12 empty); "
    "fresh populated rack from 96_channel_setup is not sufficient — depletion setup TBD"
)


@dataclass(frozen=True)
class Partial96chScenario:
    """One 96-channel partial-nozzle transfer step to exercise."""

    label: str
    nozzle_config: TransferPage.NozzleConfig
    primary_nozzle: str
    path: str
    change_tip: str
    tip_tracking: TransferPage.TipTrackingMode = "Automatic tip tracking (recommended)"
    drop_location: str = "Tip rack"
    manual_tips: Optional[List[str]] = None
    source_labware: str = PLATE_384
    dest_labware: str = PLATE_384
    tip_rack: str = TIPRACK_1000
    volume: str = "30"


def _manual_tips_for_nozzle(
    nozzle_config: TransferPage.NozzleConfig,
    primary_nozzle: str,
) -> List[str]:
    """Return one tip-rack primary per pickup group for the manual tip wizard.

    For 96ch SINGLE on a populated rack, cascade leaves only the corner opposite
    ``primary_nozzle`` (e.g. H1 primary → tip A12). Auto tip search uses the same
    corner, so a following Once that reuses a returned tip must click that well —
    not the primary-nozzle name. ``primary_nozzle`` still sets plate geometry.

    Row/column pickups need most of the rack empty before any primary is safe;
    until then prefer the same opposite-corner / A1 defaults used in headed runs.
    """
    if nozzle_config == "Single nozzle":
        tip = PARTIAL_96CH_SINGLE_TIP_BY_PRIMARY.get(primary_nozzle, "A1")
        return [tip]
    if nozzle_config in {"Single row of nozzles", "Single column of nozzles"}:
        if primary_nozzle == "H1":
            return ["H1"]
        return ["A1"]
    raise ValueError(f"Manual tips not defined for nozzle config: {nozzle_config}")


def _wells_for_partial_384(
    nozzle_config: TransferPage.NozzleConfig,
    primary_nozzle: str,
    path: str = "Single transfer",
) -> tuple[Union[str, List[str]], Union[str, List[str]]]:
    """Return source/dest wells reachable for a 96ch partial layout on a 384-well plate."""
    if path == "Single transfer":
        if nozzle_config == "Single column of nozzles":
            if primary_nozzle == "A12":
                return "A24", "C24"
            # 384 wells are half-pitch; column nozzles hit every other row.
            return "A1", "C1"
        if nozzle_config == "Single row of nozzles":
            if primary_nozzle == "H1":
                return "P1", "P3"
            return "A1", "A3"
        single_quadrant_wells = {
            "A1": ("A1", "C1"),
            "A12": ("A1", "C1"),
            "H1": ("P1", "P3"),
            "H12": ("P24", "P22"),
        }
        return single_quadrant_wells.get(primary_nozzle, ("A1", "C1"))

    if path == "Distribute":
        if nozzle_config == "Single row of nozzles":
            if primary_nozzle == "H1":
                return "P1", ["P3", "P5", "P7"]
            return "A1", ["A3", "A5", "A7"]
        if nozzle_config == "Single column of nozzles":
            if primary_nozzle == "A12":
                return "A24", ["C24", "E24", "G24"]
            return "A1", ["C1", "E1", "G1"]
        if nozzle_config == "Single nozzle":
            if primary_nozzle == "H1":
                return "P1", ["P3", "N1"]
            if primary_nozzle == "H12":
                return "P24", ["P22", "N24"]
            return "A1", ["A3", "C1"]
        raise ValueError(f"Distribute not supported for {nozzle_config}")

    if path == "Consolidate":
        if nozzle_config == "Single row of nozzles":
            if primary_nozzle == "H1":
                return ["P3", "P5", "P7"], "P1"
            return ["A3", "A5", "A7"], "A1"
        if nozzle_config == "Single column of nozzles":
            if primary_nozzle == "A12":
                return ["C24", "E24", "G24"], "A24"
            return ["C1", "E1", "G1"], "A1"
        if nozzle_config == "Single nozzle":
            if primary_nozzle == "H1":
                return ["P3", "N1"], "P1"
            return ["A3", "C1"], "A1"
        raise ValueError(f"Consolidate not supported for {nozzle_config}")

    raise ValueError(f"Unsupported path: {path}")


def _partial_96ch_config(scenario: Partial96chScenario) -> TransferStepConfig:
    """Build a 96ch partial-nozzle transfer step."""
    source_wells, dest_wells = _wells_for_partial_384(
        scenario.nozzle_config,
        scenario.primary_nozzle,
        scenario.path,
    )
    manual_tips = scenario.manual_tips
    if scenario.tip_tracking == "Manual tip tracking" and manual_tips is None:
        manual_tips = _manual_tips_for_nozzle(scenario.nozzle_config, scenario.primary_nozzle)
    return TransferStepConfig(
        tip_rack=scenario.tip_rack,
        source_labware=scenario.source_labware,
        dest_labware=scenario.dest_labware,
        source_wells=source_wells,
        dest_wells=dest_wells,
        path=scenario.path,
        volume=scenario.volume,
        change_tip=scenario.change_tip,
        drop_location=scenario.drop_location,
        tip_tracking=scenario.tip_tracking,
        manual_tips=manual_tips,
        nozzle_config=scenario.nozzle_config,
        primary_nozzle=scenario.primary_nozzle,
    )


def _single_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-quadrant pickups across tip strategies and transfer paths."""
    # Once manual (H12→tip A1) before waste/Always. A1-primary Always is automatic:
    # on a populated rack cascade blocks A1 for A1 primary (would sweep B1–H12 tips).
    return [
        Partial96chScenario(
            label="96ch single A12 — Once, return tip",
            nozzle_config="Single nozzle",
            primary_nozzle="A12",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
        Partial96chScenario(
            label="96ch single H12 — Once, manual tip tracking",
            nozzle_config="Single nozzle",
            primary_nozzle="H12",
            path="Single transfer",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            # H1-primary auto on a populated rack picks cascade-safe A12 (not H1), then returns it.
            label="96ch single H1 — Once, return tip (auto picks A12)",
            nozzle_config="Single nozzle",
            primary_nozzle="H1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
        Partial96chScenario(
            # Reuse the A12 tip returned above — auto skips used tips; H1 itself is cascade-blocked.
            label="96ch single H1 — distribute, reuse returned A12 (manual), return tip",
            nozzle_config="Single nozzle",
            primary_nozzle="H1",
            path="Distribute",
            change_tip="Once",
            drop_location="Tip rack",
            tip_tracking="Manual tip tracking",
            manual_tips=["A12"],
        ),
        Partial96chScenario(
            label="96ch single A1 — Always, automatic",
            nozzle_config="Single nozzle",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
        ),
    ]


def _row_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-row partial pickups across tip strategies and transfer paths."""
    # Waste H-row first so a following row-A1 pickup can be cascade-safe (B–H empty).
    # Do not schedule a second row-H1 after that waste — H would be incomplete.
    # These steps only succeed after A–G (for H1) / B–H (for A1) are already empty.
    return [
        Partial96chScenario(
            label="96ch row H1 — Once, manual tip tracking, waste chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch row A1 — Once, manual tip tracking, waste chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch row A1 — Always, automatic",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
        ),
        Partial96chScenario(
            label="96ch row A1 — distribute, Once, automatic",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Distribute",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch row H1 — consolidate, Once, manual, waste chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            path="Consolidate",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch row A1 — Once, return tip",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
    ]


def _column_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-column partial pickups across tip strategies and transfer paths."""
    # Column A12 on the A2 384-plate hits the A4 stacker (A24 wells); use A1 column only.
    # Single-nozzle A12 still covers right-primary geometry after the tiprack move.
    # Column A1 is only cascade-safe when columns 2–12 are empty.
    return [
        Partial96chScenario(
            label="96ch column A1 — Once, return tip",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
        Partial96chScenario(
            # Prior column Once returned tips; automatic will not reuse them — select A1 manually.
            label="96ch column A1 — Once, manual tip tracking, return tip",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch column A1 — Always, automatic",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
        ),
        Partial96chScenario(
            label="96ch column A1 — distribute, Once, waste chute",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Distribute",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch column A1 — consolidate, Once, manual, waste chute",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Consolidate",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch column A1 — Once, waste chute",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
    ]


def _move_1000ul_tiprack_away_from_stacker(editor: ProtocolEditorPage) -> None:
    """Gripper-move the 1000 µL tiprack off B3 so A12/H12 pickups clear the A4 stacker."""
    print("96ch partial — move 1000µL tiprack from B3 to B2 (clear stacker collision)")
    editor.add_step("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")
    editor.move_labware(TIPRACK_1000_B3, TIPRACK_1000_SAFE_SLOT)


def _replace_depleted_200ul_tiprack(editor: ProtocolEditorPage, stacker: FlexStackerPage) -> None:
    """Retrieve a fresh 200 µL rack from the A4 stacker and swap it onto the adapter."""
    print("96ch full-rack — retrieve fresh 200µL tip rack from stacker")
    editor.add_step("Stacker")
    stacker.retrieve_stacker(FLEX_STACKER_A4)
    stacker.save_stacker_step()
    stacker.wait_for_save_banner_gone()

    print("96ch full-rack — move depleted 200µL tip rack to waste chute")
    editor.add_step("Move")
    editor.move_labware(TIPRACK_200_DEPLETED, WASTE_CHUTE_D3)

    print("96ch full-rack — move fresh 200µL tip rack onto adapter")
    editor.add_step("Move")
    editor.move_labware(TIPRACK_200_FRESH, "D2")


def _add_never_pair_after_manual_a12(editor: ProtocolEditorPage, transfer: TransferPage) -> None:
    """Last pickup: manual A12 (H1 primary), waste chute, then matching Never.

    Skill rules (e2e-testing/SKILL.md — tip tracking & reuse):
    - Returned tip ⇒ manual: prior H1 Once/distribute returned tip at cascade corner A12;
      auto will not reuse it — ``manual_tips=["A12"]``.
    - Partial cascade: H1 primary ↔ tip A12 (opposite corner on a populated 96ch rack).
    - Never setup: Waste Chute so the tip stays on the pipette (``keep_last_tip``);
      Never must match the same nozzle layout (H1 single).
    """
    print("96ch single H1 — Once, manual A12 (Never setup), waste chute")
    add_transfer_step(
        editor,
        transfer,
        _partial_96ch_config(
            Partial96chScenario(
                label="96ch single H1 — Once, manual A12 setup for Never",
                nozzle_config="Single nozzle",
                primary_nozzle="H1",
                path="Single transfer",
                change_tip="Once",
                drop_location="Waste Chute",
                tip_tracking="Manual tip tracking",
                manual_tips=["A12"],
            )
        ),
    )

    print("96ch single H1 — Never (reuse tip from prior manual A12 pickup)")
    add_transfer_step(
        editor,
        transfer,
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
            nozzle_config="Single nozzle",
            primary_nozzle="H1",
        ),
    )


def _run_partial_suite(
    page: Page,
    editor: ProtocolEditorPage,
    transfer: TransferPage,
    scenarios: List[Partial96chScenario],
    *,
    exports_dir: Path,
    export_filename: str,
    sample_indices: List[int],
    min_steps: int,
    include_never_pair: bool = False,
) -> None:
    """Add scenarios, optionally Never pair, assert clean timeline, sample steps, export."""
    try:
        for scenario in scenarios:
            print(scenario.label)
            add_transfer_step(editor, transfer, _partial_96ch_config(scenario))

        if include_never_pair:
            _add_never_pair_after_manual_a12(editor, transfer)

        timeline = Timeline(page)
        timeline.wait_for_timeline_steps(min_steps=min_steps)
        timeline.expect_no_known_regression_errors()
        timeline.select_transfer_steps_sample(sample_indices, expect_no_errors=True)
        assert_export_downloads_clean_protocol(
            page,
            editor,
            exports_dir,
            filename=export_filename,
        )
    except Exception:
        try:
            err = Timeline(page).get_timeline_error_text()
            print(f"Timeline error banner at failure: {err}")
        except Exception as timeline_error:  # noqa: BLE001
            print(f"Could not read timeline errors: {timeline_error}")
        _export_protocol_for_debug(page, editor, exports_dir, f"{Path(export_filename).stem}_ON_FAILURE.py")
        raise


def _export_protocol_for_debug(
    page: Page,
    editor: ProtocolEditorPage,
    exports_dir: Path,
    filename: str,
) -> Path | None:
    """Best-effort export (including warning-modal confirm) for failure debugging."""
    destination = exports_dir / filename
    try:
        exports_dir.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(exports_dir / "failure_screenshot.png"), full_page=True)
        # Tip wizard / step form blocks Export — dismiss if present.
        for name in ("Exit", "Cancel", "Go back"):
            btn = page.get_by_role("button", name=name)
            if btn.count() > 0 and btn.first.is_visible():
                btn.first.click()
                break
        page.keyboard.press("Escape")
        with page.expect_download(timeout=60000) as download_info:
            editor.click_button("Export")
            continue_export = page.get_by_role("button", name="Continue with export")
            if continue_export.count() > 0 and continue_export.is_visible():
                continue_export.click()
        download_info.value.save_as(str(destination))
        print(f"Debug export saved: {destination}")
        return destination
    except Exception as export_error:  # noqa: BLE001 — debug aid must not mask the test failure
        print(f"Debug export failed: {export_error}")
        return None


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96ch_partial_single_nozzle_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Suite 1 (~7+ steps): Move + five single-nozzle transfers + manual A12 → Never.

    Timeline (1-based):
      1. Gripper Move tiprack B3→B2
      2–6. Singles (A12 Once return, H12 manual A1, H1 Once auto→A12 return,
         H1 distribute manual A12 return, A1 Always)
      7. H1 Once, **manual tip A12**, waste chute (returned tip ⇒ manual; tip stays on pipette)
      8. H1 Never (same nozzle layout)
    """
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    _move_1000ul_tiprack_away_from_stacker(editor)
    # Move + 5 singles + manual A12 Never setup + Never
    min_steps = 1 + len(_single_nozzle_scenarios()) + 2
    _run_partial_suite(
        page,
        editor,
        transfer,
        _single_nozzle_scenarios(),
        exports_dir=pd_exports_dir,
        export_filename="96ch_partial_single_nozzle.py",
        sample_indices=SINGLE_NOZZLE_SAMPLE_STEP_INDICES,
        min_steps=min_steps,
        include_never_pair=True,
    )


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
@pytest.mark.xfail(reason=_ROW_COLUMN_CASCADE_REASON, strict=False)
def test_pd_96ch_partial_row_nozzle_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Suite 2 (~7 steps): Move + six row-nozzle transfers.

    Fresh fixture rack is fully populated — row H1/A1 primaries are cascade-blocked
    until A–G / B–H are empty. xfail until a depletion setup (or tip-state fixture) exists.
    """
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    _move_1000ul_tiprack_away_from_stacker(editor)
    scenarios = _row_nozzle_scenarios()
    _run_partial_suite(
        page,
        editor,
        transfer,
        scenarios,
        exports_dir=pd_exports_dir,
        export_filename="96ch_partial_row_nozzle.py",
        sample_indices=ROW_NOZZLE_SAMPLE_STEP_INDICES,
        min_steps=1 + len(scenarios),
    )


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
@pytest.mark.xfail(reason=_ROW_COLUMN_CASCADE_REASON, strict=False)
def test_pd_96ch_partial_column_nozzle_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Suite 3 (~7 steps): Move + six column-nozzle transfers.

    Column A1 is cascade-blocked on a populated rack (cols 2–12 must be empty).
    xfail until a depletion setup (or tip-state fixture) exists.
    """
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    _move_1000ul_tiprack_away_from_stacker(editor)
    scenarios = _column_nozzle_scenarios()
    _run_partial_suite(
        page,
        editor,
        transfer,
        scenarios,
        exports_dir=pd_exports_dir,
        export_filename="96ch_partial_column_nozzle.py",
        sample_indices=COLUMN_NOZZLE_SAMPLE_STEP_INDICES,
        min_steps=1 + len(scenarios),
    )


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96_channel_full_rack_and_manual_tip_selection(page: Page, pd_exports_dir: Path) -> None:
    """Exercise full-rack 96ch transfers with automatic and manual tip tracking."""
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

    # After return-tip, automatic pickup grabs used tips — must manually select.
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

    _replace_depleted_200ul_tiprack(editor, stacker)

    # Never follows adjacent Once: drop to waste chute (not tip rack) so the tip stays on the pipette.
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

    # Never requires an adjacent Once/Always with the same nozzle layout (full rack).
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
