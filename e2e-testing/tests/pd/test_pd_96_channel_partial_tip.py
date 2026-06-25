"""E2E tests for 96-channel partial/single tip pickup and full-rack transfer workflows."""

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

ROW_NOZZLE_TIPS: List[str] = [f"A{col}" for col in range(1, 13)]
COLUMN_NOZZLE_TIPS: List[str] = [f"{row}1" for row in "ABCDEFGH"]
# 96ch all-nozzles manual tracking uses a single primary (A1) for the full-rack pickup.
FULL_RACK_MANUAL_TIPS: List[str] = ["A1"]
# Right-quadrant single-nozzle configs anchor manual pickup at A1 (overlap-safe on rack).
SINGLE_NOZZLE_MANUAL_TIP_BY_PRIMARY: dict[str, str] = {
    "A12": "A1",
    "H12": "A1",
}
FLEX_STACKER_A4 = "A4 Flex Stacker"
TIPRACK_200_DEPLETED = "D2 Opentrons Flex 96 Filter Tip Rack 200 µL"
TIPRACK_200_FRESH = "A4 Opentrons Flex 96 Filter Tip Rack 200 µL (1)"
WASTE_CHUTE_D3 = "D3 Waste Chute in D3"

PARTIAL_96CH_SAMPLE_STEP_INDICES = [0, 7, 14, 20]
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


def _manual_tips_for_nozzle(
    nozzle_config: TransferPage.NozzleConfig,
    primary_nozzle: str,
) -> List[str]:
    """Return tip-rack positions to click in the manual tip tracking wizard."""
    if nozzle_config == "Single nozzle":
        return [SINGLE_NOZZLE_MANUAL_TIP_BY_PRIMARY.get(primary_nozzle, primary_nozzle)]
    if nozzle_config == "Single row of nozzles":
        return ROW_NOZZLE_TIPS
    if nozzle_config == "Single column of nozzles":
        return COLUMN_NOZZLE_TIPS
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
                return "A24", "B24"
            return "A1", "B1"
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
            return "A1", ["A3", "A5", "A7"]
        if nozzle_config == "Single column of nozzles":
            return "A1", ["C1", "E1", "G1"]
        if nozzle_config == "Single nozzle":
            return "A1", ["A3", "C1"]
        raise ValueError(f"Distribute not supported for {nozzle_config}")

    if path == "Consolidate":
        if nozzle_config == "Single row of nozzles":
            return ["A3", "A5", "A7"], "A1"
        if nozzle_config == "Single column of nozzles":
            return ["C1", "E1", "G1"], "A1"
        if nozzle_config == "Single nozzle":
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
    # Run Once (incl. manual) before Always so automatic tip use does not block manual selection.
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
            label="96ch single H1 — Once, waste chute",
            nozzle_config="Single nozzle",
            primary_nozzle="H1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch single H1 — distribute, manual tips, waste chute",
            nozzle_config="Single nozzle",
            primary_nozzle="H1",
            path="Distribute",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch single A1 — Always, automatic",
            nozzle_config="Single nozzle",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
        ),
        Partial96chScenario(
            label="96ch single A1 — Always, manual tip tracking",
            nozzle_config="Single nozzle",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
            tip_tracking="Manual tip tracking",
        ),
    ]


def _row_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-row partial pickups across tip strategies and transfer paths."""
    return [
        Partial96chScenario(
            label="96ch row H1 — Once, return tip",
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
        Partial96chScenario(
            label="96ch row H1 — Once, manual tip tracking",
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            path="Single transfer",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch row A1 — Once, automatic, waste chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch row H1 — consolidate, manual tips, waste chute",
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            path="Consolidate",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch row A1 — distribute, automatic",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Distribute",
            change_tip="Once",
        ),
        Partial96chScenario(
            label="96ch row A1 — Always, automatic",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
        ),
        Partial96chScenario(
            label="96ch row A1 — Always, manual tip tracking",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
            tip_tracking="Manual tip tracking",
        ),
    ]


def _column_nozzle_scenarios() -> List[Partial96chScenario]:
    """Cover single-column partial pickups across tip strategies and transfer paths."""
    return [
        Partial96chScenario(
            label="96ch column A12 — Once, return tip",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A12",
            path="Single transfer",
            change_tip="Once",
            drop_location="Tip rack",
        ),
        Partial96chScenario(
            label="96ch column A12 — Once, manual tip tracking",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A12",
            path="Single transfer",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch column A12 — distribute, manual tips, waste chute",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A12",
            path="Distribute",
            change_tip="Once",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
        ),
        Partial96chScenario(
            label="96ch column A1 — Once, automatic, waste chute",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
        Partial96chScenario(
            label="96ch column A1 — Always, automatic",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
        ),
        Partial96chScenario(
            label="96ch column A1 — Always, manual tip tracking",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            path="Single transfer",
            change_tip="Always",
            tip_tracking="Manual tip tracking",
        ),
    ]


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


def _all_partial_scenarios() -> List[Partial96chScenario]:
    """All 384-well partial-nozzle scenarios used by the main workflow test."""
    return _single_nozzle_scenarios() + _row_nozzle_scenarios() + _column_nozzle_scenarios()


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_96_channel_partial_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Exercise 96ch single/row/column partial pickups with varied tip strategies and paths."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    for scenario in _all_partial_scenarios():
        print(scenario.label)
        add_transfer_step(editor, transfer, _partial_96ch_config(scenario))

    # Never requires an adjacent Once/Always with the same nozzle layout (single A12).
    print("96ch single A12 — Once (setup for Never reuse)")
    add_transfer_step(
        editor,
        transfer,
        _partial_96ch_config(
            Partial96chScenario(
                label="96ch single A12 — Once setup for Never",
                nozzle_config="Single nozzle",
                primary_nozzle="A12",
                path="Single transfer",
                change_tip="Once",
            )
        ),
    )

    print("96ch single A12 — Never (reuse tip from prior Once step)")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=PLATE_384,
            source_wells="A1",
            dest_wells="C1",
            path="Single transfer",
            volume="30",
            change_tip="Never",
            nozzle_config="Single nozzle",
            primary_nozzle="A12",
        ),
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=len(_all_partial_scenarios()) + 2)
    timeline.expect_no_known_regression_errors()

    timeline.select_transfer_steps_sample(PARTIAL_96CH_SAMPLE_STEP_INDICES, expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="96ch_partial_tip_strategies.py",
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
