"""E2E: 8-channel partial/single tip pickup and 1ch multi-transfer workflows."""

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.pd_pages import (
    MixStepForm,
    ProtocolEditorPage,
    Timeline,
    TransferPage,
    TransferStepConfig,
    add_mix_step,
    add_transfer_steps,
)
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/single_eight_partial_tip_full.py"

PLATE_384 = "Corning 384 Well Plate 112 µL Flat"
TEMP_24 = "Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap"
TC_96 = "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt"
PIPETTE_8CH = "Flex 8-Channel 1000 µL"
PIPETTE_1CH = "Flex 1-Channel 50 µL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_20 = "Opentrons Flex 96 Filter Tip Rack 20 µL"

_PARTIAL: TransferPage.NozzleConfig = "Partial nozzles"
_SINGLE: TransferPage.NozzleConfig = "Single nozzle"
_MANUAL: TransferPage.TipTrackingMode = "Manual tip tracking"
_AUTO: TransferPage.TipTrackingMode = "Automatic tip tracking (recommended)"

TEMP_24_WELLS = [f"{row}{col}" for col in range(1, 7) for row in "ABCD"]

# Fixture ships with thermocycler + heater-shaker before wizard-authored steps.
SETUP_STEP_COUNT = 2
PARTIAL_8CH_SAMPLE_STEP_INDICES = [2, 8, 14, 19]
SINGLE_NOZZLE_SAMPLE_STEP_INDICES = [2, 5, 7]


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_8ch_partial_all_counts_paths_and_tip_strategies(page: Page, pd_exports_dir: Path) -> None:
    """Exercise 8ch partial 2–7 nozzle pickups across transfer/distribute/consolidate.

    Ordering constraints:
    - Prefer Once (incl. manual) before Always so automatic tip use does not block
      later manual tip selection.
    - First transfer uses deck 384 (thermocycler lid is open); later steps use TC 96.
    """
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    print("=== 8ch partial strategy suite ===")
    print("1) Single-transfer phase (Once before Always)")
    transfer_steps = [
        (
            "3/8 transfer Once manual 384 P23→P24",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=PLATE_384,
                dest_labware=PLATE_384,
                source_wells="P23",
                dest_wells="P24",
                path="Single transfer",
                volume="20",
                change_tip="Once",
                tip_tracking=_MANUAL,
                manual_tips=["A4"],
                partial_count=3,
                primary_nozzle="F1",
            ),
        ),
        (
            "4/8 transfer Once manual TC E1→E2 (tips A1)",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="E1",
                dest_wells="E2",
                path="Single transfer",
                volume="20",
                change_tip="Once",
                tip_tracking=_MANUAL,
                manual_tips=["A1"],
                partial_count=4,
                primary_nozzle="E1",
            ),
        ),
        (
            "6/8 transfer Once manual TC C7→C8 (tips A7)",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="C7",
                dest_wells="C8",
                path="Single transfer",
                volume="20",
                change_tip="Once",
                tip_tracking=_MANUAL,
                manual_tips=["A7"],
                partial_count=6,
                primary_nozzle="C1",
            ),
        ),
        (
            "7/8 transfer Once auto waste TC B8→B9",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="B8",
                dest_wells="B9",
                path="Single transfer",
                volume="20",
                change_tip="Once",
                drop_location="Waste Chute",
                tip_tracking=_AUTO,
                partial_count=7,
                primary_nozzle="B1",
            ),
        ),
        (
            "5/8 transfer Always auto return TC D6→D7",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="D6",
                dest_wells="D7",
                path="Single transfer",
                volume="20",
                change_tip="Always",
                tip_tracking=_AUTO,
                partial_count=5,
                primary_nozzle="D1",
            ),
        ),
    ]
    add_transfer_steps(editor, transfer, transfer_steps)

    print("2) Distribute phase (Once before Always)")
    distribute_steps = [
        (
            "2/8 distribute Once manual G2→G3/G4/G5 (tips A2)",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="G2",
                dest_wells=["G3", "G4", "G5"],
                path="Distribute",
                volume="20",
                change_tip="Once",
                tip_tracking=_MANUAL,
                manual_tips=["A2"],
                partial_count=2,
                primary_nozzle="G1",
            ),
        ),
        (
            "4/8 distribute Once auto return E5→E6/E7/E8",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="E5",
                dest_wells=["E6", "E7", "E8"],
                path="Distribute",
                volume="20",
                change_tip="Once",
                tip_tracking=_AUTO,
                partial_count=4,
                primary_nozzle="E1",
            ),
        ),
        (
            "6/8 distribute Once manual C7→C8/C9/C10 (tips A7)",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="C7",
                dest_wells=["C8", "C9", "C10"],
                path="Distribute",
                volume="20",
                change_tip="Once",
                tip_tracking=_MANUAL,
                manual_tips=["A7"],
                partial_count=6,
                primary_nozzle="C1",
            ),
        ),
        (
            "3/8 distribute Always auto return F4→F5/F6/F7",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="F4",
                dest_wells=["F5", "F6", "F7"],
                path="Distribute",
                volume="20",
                change_tip="Always",
                tip_tracking=_AUTO,
                partial_count=3,
                primary_nozzle="F1",
            ),
        ),
        (
            "5/8 distribute Always auto waste D6→D7/D8/D9",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="D6",
                dest_wells=["D7", "D8", "D9"],
                path="Distribute",
                volume="20",
                change_tip="Always",
                drop_location="Waste Chute",
                tip_tracking=_AUTO,
                partial_count=5,
                primary_nozzle="D1",
            ),
        ),
        (
            "7/8 distribute Always auto return B8→B9/B10/B11",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells="B8",
                dest_wells=["B9", "B10", "B11"],
                path="Distribute",
                volume="20",
                change_tip="Always",
                tip_tracking=_AUTO,
                partial_count=7,
                primary_nozzle="B1",
            ),
        ),
    ]
    add_transfer_steps(editor, transfer, distribute_steps)

    print("3) Consolidate phase (Once before Always)")
    consolidate_steps = [
        (
            "2/8 consolidate Once auto return G2/G3/G4→G3",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells=["G2", "G3", "G4"],
                dest_wells="G3",
                path="Consolidate",
                volume="20",
                change_tip="Once",
                tip_tracking=_AUTO,
                partial_count=2,
                primary_nozzle="G1",
            ),
        ),
        (
            "3/8 consolidate Once manual F4/F5/F6→F5 (tips A4)",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells=["F4", "F5", "F6"],
                dest_wells="F5",
                path="Consolidate",
                volume="20",
                change_tip="Once",
                tip_tracking=_MANUAL,
                manual_tips=["A4"],
                partial_count=3,
                primary_nozzle="F1",
            ),
        ),
        (
            "5/8 consolidate Once manual D6/D7/D8→D7 (tips A6)",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells=["D6", "D7", "D8"],
                dest_wells="D7",
                path="Consolidate",
                volume="20",
                change_tip="Once",
                tip_tracking=_MANUAL,
                manual_tips=["A6"],
                partial_count=5,
                primary_nozzle="D1",
            ),
        ),
        (
            "7/8 consolidate Once auto return B8/B9/B10→B9",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells=["B8", "B9", "B10"],
                dest_wells="B9",
                path="Consolidate",
                volume="20",
                change_tip="Once",
                tip_tracking=_AUTO,
                partial_count=7,
                primary_nozzle="B1",
            ),
        ),
        (
            "4/8 consolidate Always auto waste E5/E6/E7→E6",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells=["E5", "E6", "E7"],
                dest_wells="E6",
                path="Consolidate",
                volume="20",
                change_tip="Always",
                drop_location="Waste Chute",
                tip_tracking=_AUTO,
                partial_count=4,
                primary_nozzle="E1",
            ),
        ),
        (
            "6/8 consolidate Always auto return C7/C8/C9→C8",
            TransferStepConfig.partial_nozzles(
                pipette=PIPETTE_8CH,
                tip_rack=TIPRACK_1000,
                source_labware=TC_96,
                dest_labware=TC_96,
                source_wells=["C7", "C8", "C9"],
                dest_wells="C8",
                path="Consolidate",
                volume="20",
                change_tip="Always",
                tip_tracking=_AUTO,
                partial_count=6,
                primary_nozzle="C1",
            ),
        ),
    ]
    add_transfer_steps(editor, transfer, consolidate_steps)

    print("4) Cross-labware 384→TC partial transfer")
    cross_steps = [
        (
            "5/8 transfer 384→TC Always manual waste (tips A12)",
            TransferStepConfig.partial_nozzles(
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
                tip_tracking=_MANUAL,
                manual_tips=["A12"],
                partial_count=5,
                primary_nozzle="D1",
            ),
        ),
    ]
    add_transfer_steps(editor, transfer, cross_steps)

    authored = len(transfer_steps) + len(distribute_steps) + len(consolidate_steps) + len(cross_steps)
    print("5) Timeline + export validation")
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=SETUP_STEP_COUNT + authored)
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

    print("=== 8ch partial mix suite ===")
    print("1) Add Mix step with 4/8 partial nozzles on TC 96")
    add_mix_step(
        editor,
        mix_form,
        pipette=PIPETTE_8CH,
        tip_rack=TIPRACK_1000,
        labware=TC_96,
        wells=["D1", "E1"],
        volume="30",
        repetitions="3",
        nozzle_config=_PARTIAL,
        partial_count=4,
        primary_nozzle="E1",
    )

    print("2) Timeline + export validation")
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
    """Exercise 8ch single-nozzle distribute and 1ch distribute/consolidate/transfer."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    print("=== 8ch single-nozzle + 1ch suite ===")
    print("1) 8ch single-nozzle transfers")
    eight_ch_steps = [
        (
            "8ch single distribute 384→temp Always auto",
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
                nozzle_config=_SINGLE,
            ),
        ),
        (
            "8ch single transfer 384→TC Once manual (tips H12)",
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
                tip_tracking=_MANUAL,
                manual_tips=["H12"],
                nozzle_config=_SINGLE,
            ),
        ),
    ]
    add_transfer_steps(editor, transfer, eight_ch_steps)

    print("2) 1ch distribute / consolidate / transfer")
    one_ch_steps = [
        (
            "1ch distribute TC→temp Always",
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
        ),
        (
            "1ch consolidate temp→TC Once waste",
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
        ),
        # Never follows adjacent 1ch Once (same single-tip nozzle count).
        (
            "1ch transfer TC→temp Once manual (tips A1)",
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
                tip_tracking=_MANUAL,
                manual_tips=["A1"],
            ),
        ),
        (
            "1ch transfer temp→TC Never (reuse manual tip)",
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
        ),
    ]
    add_transfer_steps(editor, transfer, one_ch_steps)

    print("3) Timeline + export validation")
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=SETUP_STEP_COUNT + len(eight_ch_steps) + len(one_ch_steps))
    timeline.expect_no_known_regression_errors()
    timeline.select_transfer_steps_sample(SINGLE_NOZZLE_SAMPLE_STEP_INDICES, expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="8ch_single_nozzle_and_1ch.py",
    )
