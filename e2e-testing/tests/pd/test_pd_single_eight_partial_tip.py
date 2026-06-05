"""E2E tests for 8-channel partial/single tip pickup and multi-transfer workflows."""

from dataclasses import dataclass
from typing import List, Optional, Union

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage, TransferStepConfig, add_transfer_step
from utility import import_protocol_and_open_editor

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


def _active_wells_96(col: int, partial_count: int) -> List[str]:
    """Return the bottom *partial_count* wells in a 96-well column."""
    start = len(ROW_LABELS) - partial_count
    return [f"{ROW_LABELS[start + i]}{col}" for i in range(partial_count)]


def _manual_tips_for_partial(partial_count: int, tip_col: Optional[int] = None) -> List[str]:
    """One top-row primary for partial manual pickup (PD groups A.. for the nozzle count)."""
    col = tip_col if tip_col is not None else MANUAL_TIP_COL_BY_COUNT[partial_count]
    return [f"A{col}"]


def _wells_for_partial_path(
    path: str,
    partial_count: int,
    source_col: int,
    dest_col: int,
) -> tuple[Union[str, List[str]], Union[str, List[str]]]:
    """Source/dest wells aligned with partial nozzle geometry."""
    source_wells = _active_wells_96(source_col, partial_count)
    dest_wells = _active_wells_96(dest_col, partial_count)
    if path == "Single transfer":
        return source_wells[0], dest_wells[0]
    if path == "Distribute":
        return source_wells[0], dest_wells
    if path == "Consolidate":
        return source_wells, dest_wells[-1]
    raise ValueError(f"Unsupported path: {path}")


def _partial_8ch_config(scenario: Partial8chScenario) -> TransferStepConfig:
    """Build an 8ch partial-nozzle transfer step."""
    source_wells, dest_wells = _wells_for_partial_path(
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
    transfer_strategies = [
        ("Always", "Automatic tip tracking (recommended)", "Tip rack", None),
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Once", "Automatic tip tracking (recommended)", "Waste Chute", None),
        ("Always", "Automatic tip tracking (recommended)", "Tip rack", None),
        ("Once", "Manual tip tracking", "Tip rack", "manual"),
        ("Once", "Automatic tip tracking (recommended)", "Waste Chute", None),
    ]
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
    ) -> None:
        # Run Once (incl. manual) before Always so automatic tip use does not block manual selection.
        ordered = sorted(enumerate(strategies), key=lambda item: 0 if item[1][0] == "Once" else 1)
        for idx, strat in ordered:
            count = PARTIAL_COUNTS[idx]
            change_tip, tracking, drop, tip_mode = strat
            scenarios.append(
                Partial8chScenario(
                    label=f"8ch partial {count}/8 {path.lower()}",
                    partial_count=count,
                    path=path,
                    change_tip=change_tip,
                    tip_tracking=tracking,  # type: ignore[arg-type]
                    drop_location=drop,
                    manual_tip_col=MANUAL_TIP_COL_BY_COUNT[count],
                    manual_tips=_manual_tips_for_partial(count) if tip_mode == "manual" else None,
                    source_col=MANUAL_TIP_COL_BY_COUNT[count],
                    dest_col=MANUAL_TIP_COL_BY_COUNT[count] + 1,
                )
            )

    scenarios: List[Partial8chScenario] = []
    for path, strategies in (
        ("Single transfer", transfer_strategies),
        ("Distribute", distribute_strategies),
        ("Consolidate", consolidate_strategies),
    ):
        _append_scenarios(path, strategies)
    return scenarios


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_8ch_partial_all_counts_paths_and_tip_strategies(page: Page) -> None:
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

    print("8ch partial 4/8 TC→TC transfer — Once (setup for Never reuse)")
    add_transfer_step(
        editor,
        transfer,
        _partial_8ch_config(
            Partial8chScenario(
                label="8ch partial 4/8 transfer setup for Never",
                partial_count=4,
                path="Single transfer",
                change_tip="Once",
                source_col=3,
                dest_col=4,
            )
        ),
    )

    print("8ch partial 3/8 TC→TC transfer — Never (reuse tip from prior Once step)")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_8CH,
            tip_rack=TIPRACK_1000,
            source_labware=TC_96,
            dest_labware=TC_96,
            source_wells="F5",
            dest_wells="F6",
            path="Single transfer",
            volume="20",
            change_tip="Never",
            nozzle_config="Partial nozzles",
            partial_count=3,
            primary_nozzle="F1",
        ),
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=len(_partial_8ch_scenarios()) + 5)
    timeline.expect_no_known_regression_errors()

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_8ch_single_nozzle_and_1ch_workflows(page: Page) -> None:
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
    timeline.wait_for_timeline_steps(min_steps=8)
    timeline.expect_no_known_regression_errors()

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)
