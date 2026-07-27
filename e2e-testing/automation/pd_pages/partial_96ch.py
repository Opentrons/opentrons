"""96-channel partial-tip scenario data and shared E2E runners.

Cascade rules on a populated Flex 96 tiprack (see safePipetteMovements
``getIsSafePickupWithinTiprack``): unused nozzles must not sweep remaining tips.

- SINGLE: only the corner opposite the primary is selectable
  (A1↔H12, A12↔H1).
- ROW: A1 primary → tip row H; H1 primary → tip row A.
- COLUMN: A1 primary → tip col 12; A12 primary → tip col 1.

Auto tip tracking already picks those edges; manual tips must match.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Union

from playwright.sync_api import Page

from automation.pd_pages.flex_stacker import FlexStackerPage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage
from automation.pd_pages.timeline import Timeline
from automation.pd_pages.transfer_form import TransferPage, TransferStepConfig, add_transfer_step

PROTOCOL_PATH = "fixtures/protocol/9/96_channel_setup.py"
PLATE_384 = "Applied Biosystems MicroAmp 384 Well Plate 40 µL"
PLATE_96 = "NEST 96 Deep Well Plate 2 mL"
RESERVOIR_8 = "NEST 8 Well Reservoir 22 mL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_200 = "Opentrons Flex 96 Filter Tip Rack 200 µL"
TIPRACK_20 = "Opentrons Flex 96 Filter Tip Rack 20 µL"

# 96ch all-nozzles manual tracking uses a single primary (A1) for the full-rack pickup.
FULL_RACK_MANUAL_TIPS: List[str] = ["A1"]
# 96ch SINGLE on a populated rack: cascade leaves only the corner opposite the primary.
PARTIAL_96CH_SINGLE_TIP_BY_PRIMARY: dict[str, str] = {
    "A1": "H12",
    "A12": "H1",
    "H1": "A12",
    "H12": "A1",
}
# ROW / COLUMN: cascade-safe tip group is the opposite edge (not the primary well name).
PARTIAL_96CH_ROW_TIP_BY_PRIMARY: dict[str, str] = {
    "A1": "H1",
    "H1": "A1",
}
PARTIAL_96CH_COLUMN_TIP_BY_PRIMARY: dict[str, str] = {
    "A1": "A12",
    "A12": "A1",
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


def print_suite_plan(title: str, steps: List[str]) -> None:
    """Print a numbered suite plan for headed/CI log readability."""
    print(f"\n=== {title} ===")
    for i, step in enumerate(steps, start=1):
        print(f"  {i}. {step}")
    print("=== end plan ===\n")


def manual_tips_for_nozzle(
    nozzle_config: TransferPage.NozzleConfig,
    primary_nozzle: str,
) -> List[str]:
    """Return one tip-rack primary per pickup group for the manual tip wizard."""
    if nozzle_config == "Single nozzle":
        tip = PARTIAL_96CH_SINGLE_TIP_BY_PRIMARY.get(primary_nozzle, "A1")
        return [tip]
    if nozzle_config == "Single row of nozzles":
        tip = PARTIAL_96CH_ROW_TIP_BY_PRIMARY.get(primary_nozzle, "A1")
        return [tip]
    if nozzle_config == "Single column of nozzles":
        tip = PARTIAL_96CH_COLUMN_TIP_BY_PRIMARY.get(primary_nozzle, "A12")
        return [tip]
    raise ValueError(f"Manual tips not defined for nozzle config: {nozzle_config}")


def wells_for_partial_384(
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


def to_transfer_config(scenario: Partial96chScenario) -> TransferStepConfig:
    """Build a TransferStepConfig from a Partial96chScenario."""
    source_wells, dest_wells = wells_for_partial_384(
        scenario.nozzle_config,
        scenario.primary_nozzle,
        scenario.path,
    )
    manual_tips = scenario.manual_tips
    if scenario.tip_tracking == "Manual tip tracking" and manual_tips is None:
        manual_tips = manual_tips_for_nozzle(scenario.nozzle_config, scenario.primary_nozzle)
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


def single_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-quadrant pickups across tip strategies and transfer paths."""
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
            label="96ch single H1 — Once, return tip (auto picks A12)",
            nozzle_config="Single nozzle",
            primary_nozzle="H1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
        Partial96chScenario(
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


def row_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-row partial pickups using cascade-safe opposite tip rows."""
    return [
        Partial96chScenario(
            label="96ch row A1 — Once, automatic (cascade tip H), waste chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch row H1 — Once, automatic (cascade tip A), waste chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch row A1 — Always, automatic",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch row A1 — Once, manual tip H1, return tip",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
            tip_tracking="Manual tip tracking",
            manual_tips=["H1"],
        ),
    ]


def column_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-column partial pickups using cascade-safe opposite tip columns.

    Column A1 auto picks tip col 12 on a populated rack. After return-tip, col 12
    is dirty (not empty), so cascade blocks automatic pickup of cols 1–11 —
    later steps must use **manual** tip tracking on A12 (returned tip ⇒ manual).
    """
    return [
        Partial96chScenario(
            label="96ch column A1 — Once, return tip (auto picks col 12)",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
        Partial96chScenario(
            label="96ch column A1 — Once, manual tip A12, return tip",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
            tip_tracking="Manual tip tracking",
            manual_tips=["A12"],
        ),
        Partial96chScenario(
            label="96ch column A1 — Always, manual tip A12, waste chute",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
            manual_tips=["A12"],
        ),
    ]


def move_1000ul_tiprack_away_from_stacker(editor: ProtocolEditorPage) -> None:
    """Gripper-move the 1000 µL tiprack off B3 so A12/H12 pickups clear the A4 stacker."""
    print("96ch partial — move 1000µL tiprack from B3 to B2 (clear stacker collision)")
    editor.add_step("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")
    editor.move_labware(TIPRACK_1000_B3, TIPRACK_1000_SAFE_SLOT)


def replace_depleted_200ul_tiprack(editor: ProtocolEditorPage, stacker: FlexStackerPage) -> None:
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


def add_never_pair_after_manual_a12(editor: ProtocolEditorPage, transfer: TransferPage) -> None:
    """Last pickup: manual A12 (H1 primary), waste chute, then matching Never."""
    print("96ch single H1 — Once, manual A12 (Never setup), waste chute")
    add_transfer_step(
        editor,
        transfer,
        to_transfer_config(
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


def export_protocol_for_debug(
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


def run_partial_suite(
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
    from utility import assert_export_downloads_clean_protocol

    try:
        for scenario in scenarios:
            print(scenario.label)
            add_transfer_step(editor, transfer, to_transfer_config(scenario))

        if include_never_pair:
            add_never_pair_after_manual_a12(editor, transfer)

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
        export_protocol_for_debug(page, editor, exports_dir, f"{Path(export_filename).stem}_ON_FAILURE.py")
        raise
