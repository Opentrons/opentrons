"""E2E tests for 8-channel partial/single tip pickup and multi-transfer workflows."""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Union

import pytest
from playwright.sync_api import Page

from automation.pd_pages import (
    MixStepForm,
    ProtocolEditorPage,
    Timeline,
    TransferPage,
    TransferStepConfig,
    add_transfer_step,
)
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/single_eight_partial_tip_setup.py"

PLATE_384 = "Corning 384 Well Plate 112 µL Flat"
TEMP_24 = "Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap"
TC_96 = "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt"
PIPETTE_8CH = "Flex 8-Channel 1000 µL"
PIPETTE_1CH = "Flex 1-Channel 50 µL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_20 = "Opentrons Flex 96 Filter Tip Rack 20 µL"

TEMP_24_WELLS: List[str] = [f"{row}{col}" for col in range(1, 7) for row in "ABCD"]

PARTIAL_COUNTS: List[int] = [2, 3, 4, 5, 6, 7]
# Pipette partial config uses bottom-aligned primary nozzles (H-leading, H1→A1).
PRIMARY_NOZZLE_BY_COUNT = {2: "G1", 3: "F1", 4: "E1", 5: "D1", 6: "C1", 7: "B1"}
# Manual tip wizard: click one *top-row* primary (row A). PD groups A.. for the
# configured partial count (e.g. 3/8 → one click on A4 selects A4–C4).
MANUAL_TIP_COL_BY_COUNT = {2: 2, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8}
ROW_LABELS = "ABCDEFGH"
# 384-well plate in slot A3 (back edge): bottom-aligned 96-well row math picks wells
# too close to the window (e.g. 3/8 → F4/H4/J4). Use front-of-plate rows instead.
PARTIAL_384_PRIMARY_ROW_BY_COUNT = {3: "P", 4: "P", 5: "H", 6: "M", 7: "N"}

# Fixture ships with thermocycler + heater-shaker before wizard-authored steps.
SETUP_STEP_COUNT = 2
PARTIAL_8CH_SAMPLE_STEP_INDICES = [2, 8, 14, 19]
SINGLE_NOZZLE_SAMPLE_STEP_INDICES = [2, 5, 7]


@dataclass(frozen=True)
class Partial8chScenario:
    """One 8-channel partial-nozzle transfer step to exercise."""

    label: str
    partial_count: int
    path: str
    change_tip: str
    tip_tracking: TransferPage.TipTrackingMode = "Automatic tip tracking (recommended)"
    drop_location: str = "Tip rack"
    manual_tips: Optional[List[str]] = None
    manual_tip_col: int = 1
    source_labware: str = TC_96
    dest_labware: str = TC_96
    source_col: int = 1
    dest_col: int = 2


def _partial_primary_well(col: int, partial_count: int) -> str:
    """Bottom-aligned primary well for a partial-nozzle group in one column."""
    return f"{ROW_LABELS[len(ROW_LABELS) - partial_count]}{col}"


def _partial_primary_wells_across_columns(
    start_col: int,
    partial_count: int,
    count: int = 3,
) -> List[str]:
    """Primary wells in distinct columns (one partial group each)."""
    row = ROW_LABELS[len(ROW_LABELS) - partial_count]
    return [f"{row}{start_col + i}" for i in range(count)]


def _manual_tips_for_partial(partial_count: int, tip_col: Optional[int] = None) -> List[str]:
    """One top-row primary for partial manual pickup (PD groups A.. for the nozzle count)."""
    col = tip_col if tip_col is not None else MANUAL_TIP_COL_BY_COUNT[partial_count]
    return [f"A{col}"]


def _partial_primary_well_384(col: int, partial_count: int) -> str:
    """Primary well on 384-well plate, clear of back-edge partial-tip collision."""
    row = PARTIAL_384_PRIMARY_ROW_BY_COUNT[partial_count]
    return f"{row}{col}"


def _partial_primary_wells_384_across_columns(
    start_col: int,
    partial_count: int,
    count: int = 3,
) -> List[str]:
    """Primary wells in distinct columns on a 384-well plate."""
    row = PARTIAL_384_PRIMARY_ROW_BY_COUNT[partial_count]
    return [f"{row}{start_col + i}" for i in range(count)]


def _wells_for_partial_384_8ch(
    path: str,
    partial_count: int,
    source_col: int,
    dest_col: int,
) -> tuple[Union[str, List[str]], Union[str, List[str]]]:
    """Source/dest wells reachable for 8ch partial layout on a 384-well plate."""
    source_primary = _partial_primary_well_384(source_col, partial_count)
    dest_primary = _partial_primary_well_384(dest_col, partial_count)
    if path == "Single transfer":
        return source_primary, dest_primary
    if path == "Distribute":
        return source_primary, _partial_primary_wells_384_across_columns(dest_col, partial_count)
    if path == "Consolidate":
        return _partial_primary_wells_384_across_columns(source_col, partial_count), dest_primary
    raise ValueError(f"Unsupported path: {path}")


def _wells_for_partial_path(
    path: str,
    partial_count: int,
    source_col: int,
    dest_col: int,
) -> tuple[Union[str, List[str]], Union[str, List[str]]]:
    """Source/dest primary wells aligned with partial nozzle geometry.

    PD stores one primary well per partial group. Distribute needs 1 source
    primary and multiple dest primaries in *different columns*; consolidate
    needs the inverse. Selecting F/G/H (or A–C) in the same column collapses
    to one group and disables distribute/consolidate.
    """
    source_primary = _partial_primary_well(source_col, partial_count)
    dest_primary = _partial_primary_well(dest_col, partial_count)
    if path == "Single transfer":
        return source_primary, dest_primary
    if path == "Distribute":
        return source_primary, _partial_primary_wells_across_columns(dest_col, partial_count)
    if path == "Consolidate":
        return _partial_primary_wells_across_columns(source_col, partial_count), dest_primary
    raise ValueError(f"Unsupported path: {path}")


def _partial_8ch_config(scenario: Partial8chScenario) -> TransferStepConfig:
    """Build an 8ch partial-nozzle transfer step."""
    uses_384 = scenario.source_labware == PLATE_384 or scenario.dest_labware == PLATE_384
    wells_for_path = _wells_for_partial_384_8ch if uses_384 else _wells_for_partial_path
    source_wells, dest_wells = wells_for_path(
        scenario.path,
        scenario.partial_count,
        scenario.source_col,
        scenario.dest_col,
    )
    manual_tips = scenario.manual_tips
    if scenario.tip_tracking == "Manual tip tracking" and manual_tips is None:
        manual_tips = _manual_tips_for_partial(scenario.partial_count, scenario.manual_tip_col)
    return TransferStepConfig(
        pipette=PIPETTE_8CH,
        tip_rack=TIPRACK_1000,
        source_labware=scenario.source_labware,
        dest_labware=scenario.dest_labware,
        source_wells=source_wells,
        dest_wells=dest_wells,
        path=scenario.path,
        volume="20",
        change_tip=scenario.change_tip,
        drop_location=scenario.drop_location,
        tip_tracking=scenario.tip_tracking,
        manual_tips=manual_tips,
        nozzle_config="Partial nozzles",
        partial_count=scenario.partial_count,
        primary_nozzle=PRIMARY_NOZZLE_BY_COUNT[scenario.partial_count],
    )


def _partial_8ch_scenarios() -> List[Partial8chScenario]:
    """Cover partial counts 2–7 across transfer/distribute/consolidate and tip settings."""
    # Manual tip tracking is only used with Once (single pickup); Always uses automatic.
    # Transfer skips 2/8 (inaccessible after prior tip use) and uses A1 for 4/8 manual pickup.
    transfer_partial_counts = [3, 4, 5, 6, 7]
    transfer_strategies = [
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Always", "Automatic tip tracking (recommended)", "Tip rack", None),
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Once", "Automatic tip tracking (recommended)", "Waste Chute", None),
    ]
    transfer_overrides: dict[int, dict[str, object]] = {
        # First transfer runs while thermocycler lid is open — use deck 384, not TC plate.
        # Back-edge slot A3: use front-of-plate columns (see PARTIAL_384_PRIMARY_ROW_BY_COUNT).
        3: {
            "source_labware": PLATE_384,
            "dest_labware": PLATE_384,
            "source_col": 23,
            "dest_col": 24,
        },
        4: {
            "manual_tips": ["A1"],
            "manual_tip_col": 1,
            "source_col": 1,
            "dest_col": 2,
        },
    }
    distribute_strategies = [
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Always", "Automatic tip tracking (recommended)", "Tip rack", None),
        ("Once", "Automatic tip tracking (recommended)", "Tip rack", None),
        ("Always", "Automatic tip tracking (recommended)", "Waste Chute", None),
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Always", "Automatic tip tracking (recommended)", "Tip rack", None),
    ]
    consolidate_strategies = [
        ("Once", "Automatic tip tracking (recommended)", "Tip rack", None),
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Always", "Automatic tip tracking (recommended)", "Waste Chute", None),
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Always", "Automatic tip tracking (recommended)", "Tip rack", None),
        ("Once", "Automatic tip tracking (recommended)", "Tip rack", None),
    ]

    def _append_scenarios(
        path: str,
        strategies: list[tuple[str, str, str, Optional[str]]],
        partial_counts: Optional[List[int]] = None,
        overrides: Optional[dict[int, dict[str, object]]] = None,
    ) -> None:
        # Run Once (incl. manual) before Always so automatic tip use does not block manual selection.
        counts = partial_counts or PARTIAL_COUNTS
        ordered = sorted(enumerate(strategies), key=lambda item: 0 if item[1][0] == "Once" else 1)
        for idx, strat in ordered:
            count = counts[idx]
            change_tip, tracking, drop, tip_mode = strat
            override = (overrides or {}).get(count, {})
            manual_tip_col_value = override.get("manual_tip_col", MANUAL_TIP_COL_BY_COUNT[count])
            source_col_value = override.get("source_col", MANUAL_TIP_COL_BY_COUNT[count])
            dest_col_value = override.get("dest_col", MANUAL_TIP_COL_BY_COUNT[count] + 1)
            manual_tip_col = (
                manual_tip_col_value if isinstance(manual_tip_col_value, int) else MANUAL_TIP_COL_BY_COUNT[count]
            )
            source_col = source_col_value if isinstance(source_col_value, int) else MANUAL_TIP_COL_BY_COUNT[count]
            dest_col = dest_col_value if isinstance(dest_col_value, int) else MANUAL_TIP_COL_BY_COUNT[count] + 1
            manual_tips: Optional[List[str]] = None
            if tip_mode == "manual":
                override_manual_tips = override.get("manual_tips")
                manual_tips = (
                    override_manual_tips
                    if isinstance(override_manual_tips, list)
                    else _manual_tips_for_partial(count, manual_tip_col)
                )
            source_labware_value = override.get("source_labware")
            dest_labware_value = override.get("dest_labware")
            source_labware = source_labware_value if isinstance(source_labware_value, str) else TC_96
            dest_labware = dest_labware_value if isinstance(dest_labware_value, str) else TC_96
            scenarios.append(
                Partial8chScenario(
                    label=f"8ch partial {count}/8 {path.lower()}",
                    partial_count=count,
                    path=path,
                    change_tip=change_tip,
                    tip_tracking=tracking,  # type: ignore[arg-type]
                    drop_location=drop,
                    manual_tip_col=manual_tip_col,
                    manual_tips=manual_tips,
                    source_labware=source_labware,
                    dest_labware=dest_labware,
                    source_col=source_col,
                    dest_col=dest_col,
                )
            )

    scenarios: List[Partial8chScenario] = []
    _append_scenarios(
        "Single transfer",
        transfer_strategies,
        partial_counts=transfer_partial_counts,
        overrides=transfer_overrides,
    )
    for path, strategies in (
        ("Distribute", distribute_strategies),
        ("Consolidate", consolidate_strategies),
    ):
        _append_scenarios(path, strategies)
    return scenarios


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_8ch_partial_all_counts_paths_and_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Exercise 8ch partial 2–7 nozzle pickups across transfer/distribute/consolidate with varied tip settings."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    for scenario in _partial_8ch_scenarios():
        print(scenario.label)
        add_transfer_step(editor, transfer, _partial_8ch_config(scenario))

    print("8ch partial 5/8 384→TC transfer — manual tips, waste chute drop")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_8CH,
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=TC_96,
            source_wells="H23",
            dest_wells="H1",
            path="Single transfer",
            volume="30",
            change_tip="Always",
            drop_location="Waste Chute",
            tip_tracking="Manual tip tracking",
            manual_tips=["A12"],
            nozzle_config="Partial nozzles",
            partial_count=5,
            primary_nozzle="D1",
        ),
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=len(_partial_8ch_scenarios()) + SETUP_STEP_COUNT + 1)
    timeline.expect_no_known_regression_errors()

    timeline.select_transfer_steps_sample(PARTIAL_8CH_SAMPLE_STEP_INDICES, expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="8ch_partial_all_counts.py",
    )


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(300)
def test_pd_8ch_partial_mix_on_96_well(page: Page, pd_exports_dir: Path) -> None:
    """Exercise 8ch partial-nozzle pickup on a mix step targeting a 96-well plate."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    mix_form = MixStepForm(page)

    editor.add_step("Mix")
    mix_form.select_pipette(PIPETTE_8CH)
    mix_form.select_tiprack(TIPRACK_1000)
    mix_form.select_labware(TC_96)
    mix_form.open_nozzle_and_well_selector()
    mix_form.select_nozzle_configuration("Partial nozzles", partial_count=4, primary_nozzle="E1")
    mix_form.expect_mix_well_modal(TC_96)
    mix_form.select_wells(["D1", "E1"])
    mix_form.enter_volume("30")
    mix_form.enter_mix_repetitions("3")
    mix_form.click_continue()
    mix_form.click_continue()
    mix_form.click_continue()
    mix_form.save_step()

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=SETUP_STEP_COUNT + 1)
    timeline.expect_no_known_regression_errors()

    timeline.select_transfer_steps_sample([SETUP_STEP_COUNT], expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="8ch_partial_mix_96well.py",
    )


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_8ch_single_nozzle_and_1ch_workflows(page: Page, pd_exports_dir: Path) -> None:
    """Exercise 8ch single-nozzle distribute and 1ch distribute/consolidate/transfer with manual tip tracking."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    print("8ch single-nozzle distribute 384→temp — automatic tip tracking, Always")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_8CH,
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=TEMP_24,
            source_wells="A1",
            dest_wells=TEMP_24_WELLS,
            path="Distribute",
            volume="30",
            change_tip="Always",
            nozzle_config="Single nozzle",
        ),
    )

    print("8ch single-nozzle transfer 384→TC — manual tip tracking, Once")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_8CH,
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=TC_96,
            source_wells="A2",
            dest_wells="A1",
            path="Single transfer",
            volume="30",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
            manual_tips=["H12"],
            nozzle_config="Single nozzle",
        ),
    )

    print("1ch distribute TC→temp — Always")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TC_96,
            dest_labware=TEMP_24,
            source_wells="A1",
            dest_wells=["A1", "A2", "A3"],
            path="Distribute",
            volume="20",
            change_tip="Always",
        ),
    )

    print("1ch consolidate temp→TC — Once, waste chute drop")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TEMP_24,
            dest_labware=TC_96,
            source_wells=["B1", "B2"],
            dest_wells="B1",
            path="Consolidate",
            volume="10",
            change_tip="Once",
            drop_location="Waste Chute",
        ),
    )

    # Never follows adjacent 1ch Once (same single-tip nozzle count).
    print("1ch single transfer TC→temp — manual tip tracking")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TC_96,
            dest_labware=TEMP_24,
            source_wells="C1",
            dest_wells="C1",
            path="Single transfer",
            volume="20",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
            manual_tips=["A1"],
        ),
    )

    print("1ch single transfer temp→TC — Never (reuse manual tip)")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TEMP_24,
            dest_labware=TC_96,
            source_wells="D1",
            dest_wells="D1",
            path="Single transfer",
            volume="20",
            change_tip="Never",
        ),
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=SETUP_STEP_COUNT + 6)
    timeline.expect_no_known_regression_errors()

    timeline.select_transfer_steps_sample(SINGLE_NOZZLE_SAMPLE_STEP_INDICES, expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="8ch_single_nozzle_and_1ch.py",
    )
