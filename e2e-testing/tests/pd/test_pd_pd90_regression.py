"""E2E regression tests for Protocol Designer 9.0.0 customer-reported protocols.

Post-import wizard coverage is split so tip-inventory / cascade failures stay isolated
(same pattern as ``test_pd_96_channel_partial_tip.py``).
"""

from typing import Tuple

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage, TransferStepConfig, add_transfer_step
from utility import import_protocol_and_open_editor

MAOR_PROTOCOL_PATH = "fixtures/protocol/9/maor_magnet_sax_predigestion_rqa5529.py"
POST_TAGMENTATION_PROTOCOL_PATH = "fixtures/protocol/9/post_tagmentation_rqa5354.py"

# Maor protocol (RQA-5529): large Flex deck with 12-channel reservoirs and 96ch transfers.
MAOR_MIN_TIMELINE_STEPS = 96
MAOR_IMPORT_TIMEOUT = 120000
MAOR_RESERVOIR_TRANSFER_STEP_INDICES = [3, 13, 20, 28, 43, 52, 58, 65, 70, 81, 84, 87, 92]

# Live Greiner on C2 only — the unnumbered displayName also belongs to the cutoutD3 trash plate.
MAOR_GREINER_1 = "Maor_Greiner 96 Well Plate 323 µL (1)"
# reservoir_3 ends on B2; same displayName as reservoir_1 on the temp module.
MAOR_12_RESERVOIR_B2 = "B2 Maor_Opentrons Tough 22mL 12 Well Reservoir"
# Post-import: all 1000 µL racks are depleted; only the 50 µL tiprack (ends on D4) has CLEAN tips.
MAOR_TIPRACK_50 = "Opentrons Flex 96 Filter Tip Rack 50 µL"
# Clear D4 neighbors so 96ch tip AABB can reach the 50 µL tiprack.
MAOR_ADAPTER_C4 = "C4 Opentrons Flex 96 Tip Rack Adapter (1)"
MAOR_ADAPTER_D2 = "D2 Opentrons Flex 96 Tip Rack Adapter (2)"
MAOR_TIPRACK_1000_B4 = "B4 Opentrons Flex 96 Filter Tip Rack 1000 µL (1)"
MAOR_TIPRACK_1000_C3 = "C3 Opentrons Flex 96 Filter Tip Rack 1000 µL"
MAOR_NEIGHBOR_CLEAR_STEPS = 4

# Post-tagmentation protocol (RQA-5354): full deck with automatic tip tracking.
POST_TAGMENTATION_MIN_TIMELINE_STEPS = 35
POST_TAGMENTATION_RESERVOIR_STEP_LABELS = [
    "TWB to -LP1 - Wash 1",
    "TWB to -LP1 - Wash 2",
    "TWB to -LP1 - Wash 3",
]

POST_TAG_TWB_RESERVOIR = "TWB Reservoir 90mL"
POST_TAG_LP1_BROWN = "-LP1 plate in a brown base"
POST_TAG_REAGENT = "Reagent plate"
POST_TAG_TIPRACK_200 = "Opentrons Flex 96 Filter Tip Rack 200 µL"
# Post-import: tiprack (4) on B3 never went on-adapter (still CLEAN). Clear A1 neighbors
# (empty tiprack on A2 + Indexes on B1) before moving it there for 96ch SINGLE AABB.
POST_TAG_TIPRACK_200_B3 = "B3 Opentrons Flex 96 Filter Tip Rack 200 µL (4)"
POST_TAG_TIPRACK_200_A2 = "A2 Opentrons Flex 96 Filter Tip Rack 200 µL (2)"
POST_TAG_TIPRACK_200_A3 = "A3 Opentrons Flex 96 Filter Tip Rack 200 µL (3)"
POST_TAG_INDEXES_B1 = "B1 Illumina Indexes"
POST_TAG_WASTE_PLATE_B2 = "B2 Waste Plate - NUNC"
POST_TAG_TIPRACK_SAFE_SLOT = "A1"
# Clear A2 + A3 + B1 + B2, move tiprack B3→A1 for 96ch SINGLE AABB.
POST_TAG_DECK_PREP_STEPS = 5


def _import_maor(
    page: Page,
) -> Tuple[ProtocolEditorPage, TransferPage, Timeline]:
    """Import Maor, wait for timeline, return editor helpers."""
    import_protocol_and_open_editor(
        page,
        MAOR_PROTOCOL_PATH,
        migration=True,
        migration_timeout=MAOR_IMPORT_TIMEOUT,
    )
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=MAOR_MIN_TIMELINE_STEPS)
    timeline.expect_no_known_regression_errors()
    return editor, transfer, timeline


def _clear_maor_d4_neighbors(editor: ProtocolEditorPage) -> None:
    """Gripper-move D4 neighbors off-deck so the 50 µL tiprack tip AABB is clearer."""
    for label, labware in (
        ("C4 tiprack adapter", MAOR_ADAPTER_C4),
        ("D2 tiprack adapter", MAOR_ADAPTER_D2),
        ("B4 depleted 1000µL tiprack", MAOR_TIPRACK_1000_B4),
        ("C3 depleted 1000µL tiprack", MAOR_TIPRACK_1000_C3),
    ):
        print(f"Maor post-import — move {label} → Off-deck (clear D4 tip AABB)")
        editor.add_step("Move")
        editor.expect_move_labware_form()
        editor.toggle_checkbox("Use gripper")
        editor.move_labware(labware, "Off-deck")


def _assert_maor_export_clean(
    page: Page,
    editor: ProtocolEditorPage,
    timeline: Timeline,
    extra_steps: int,
) -> None:
    """Assert Maor timeline stays clean after post-import wizard steps and export is allowed."""
    timeline.wait_for_timeline_steps(min_steps=MAOR_MIN_TIMELINE_STEPS + extra_steps)
    timeline.expect_no_known_regression_errors()
    editor.click_button("Export")
    expect(page.get_by_text("Protocol has timeline errors", exact=False)).to_have_count(0, timeout=5000)


def _import_post_tagmentation(
    page: Page,
) -> Tuple[ProtocolEditorPage, TransferPage, Timeline]:
    """Import post-tagmentation, wait for timeline, return editor helpers."""
    import_protocol_and_open_editor(page, POST_TAGMENTATION_PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=POST_TAGMENTATION_MIN_TIMELINE_STEPS)
    timeline.expect_no_known_regression_errors()
    return editor, transfer, timeline


def _prepare_post_tag_clean_tiprack(editor: ProtocolEditorPage) -> None:
    """Clear A1 neighbors and move unused 200 µL tiprack (4) from B3 → A1 for 96ch AABB."""
    for label, labware in (
        ("empty tiprack A2", POST_TAG_TIPRACK_200_A2),
        ("tiprack A3", POST_TAG_TIPRACK_200_A3),
        ("Indexes B1", POST_TAG_INDEXES_B1),
        ("Waste Plate B2", POST_TAG_WASTE_PLATE_B2),
    ):
        print(f"Post-tagmentation post-import — move {label} → Off-deck")
        editor.add_step("Move")
        editor.expect_move_labware_form()
        editor.toggle_checkbox("Use gripper")
        editor.move_labware(labware, "Off-deck")

    print("Post-tagmentation post-import — move 200µL tiprack (4) B3 → A1")
    editor.add_step("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")
    editor.move_labware(POST_TAG_TIPRACK_200_B3, POST_TAG_TIPRACK_SAFE_SLOT)


def _assert_post_tag_export_clean(
    page: Page,
    editor: ProtocolEditorPage,
    timeline: Timeline,
    extra_steps: int,
) -> None:
    """Assert post-tag timeline stays clean after post-import wizard steps and export is allowed."""
    timeline.wait_for_timeline_steps(min_steps=POST_TAGMENTATION_MIN_TIMELINE_STEPS + extra_steps)
    timeline.expect_no_known_regression_errors()
    editor.click_button("Export")
    expect(page.get_by_text("Protocol has timeline errors", exact=False)).to_have_count(0, timeout=5000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_import_maor_protocol_no_reservoir_timeline_errors(page: Page) -> None:
    """RQA-5529: importing the Maor protocol should not produce reservoir well-selection errors."""
    import_protocol_and_open_editor(
        page,
        MAOR_PROTOCOL_PATH,
        migration=True,
        migration_timeout=MAOR_IMPORT_TIMEOUT,
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=MAOR_MIN_TIMELINE_STEPS)
    timeline.expect_no_known_regression_errors()

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_maor_protocol_reservoir_transfer_steps_have_no_errors(page: Page) -> None:
    """RQA-5529: reservoir transfer steps remain error-free when opened in the step editor."""
    import_protocol_and_open_editor(
        page,
        MAOR_PROTOCOL_PATH,
        migration=True,
        migration_timeout=MAOR_IMPORT_TIMEOUT,
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=MAOR_MIN_TIMELINE_STEPS)
    timeline.expect_no_known_regression_errors()

    timeline.select_transfer_steps_sample(
        MAOR_RESERVOIR_TRANSFER_STEP_INDICES,
        expect_no_errors=True,
    )

    editor = ProtocolEditorPage(page)
    editor.click_button("Export")
    expect(page.get_by_text("Protocol has timeline errors", exact=False)).to_have_count(0, timeout=5000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_import_post_tagmentation_no_timeline_errors(page: Page) -> None:
    """RQA-5354: importing the post-tagmentation protocol should not produce timeline errors."""
    import_protocol_and_open_editor(page, POST_TAGMENTATION_PROTOCOL_PATH, migration=True)

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=POST_TAGMENTATION_MIN_TIMELINE_STEPS)
    timeline.expect_no_known_regression_errors()

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_post_tagmentation_reservoir_wash_steps_have_no_errors(page: Page) -> None:
    """RQA-5354: reservoir wash steps with automatic tip tracking remain error-free."""
    import_protocol_and_open_editor(page, POST_TAGMENTATION_PROTOCOL_PATH, migration=True)

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=POST_TAGMENTATION_MIN_TIMELINE_STEPS)
    timeline.expect_no_known_regression_errors()

    for step_label in POST_TAGMENTATION_RESERVOIR_STEP_LABELS:
        timeline.select_step_matching_label(step_label)
        timeline.expect_no_timeline_errors(timeout=30000)

    editor = ProtocolEditorPage(page)
    editor.click_button("Export")
    expect(page.get_by_text("Protocol has timeline errors", exact=False)).to_have_count(0, timeout=5000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_maor_96ch_reservoir_column_transfer(page: Page) -> None:
    """RQA-5529: Post-import 12-reservoir → Greiner with column A12 + Waste Chute stays error-free.

    Matches in-protocol waste disposal; avoids ALL pickup on depleted 1000 µL racks.
    Single-A1 tip AABB stays blocked on this dense deck — column A12 is tip-accessible.
    """
    editor, transfer, timeline = _import_maor(page)
    _clear_maor_d4_neighbors(editor)

    print("Maor — 12-reservoir → Greiner, column A12, Once, Waste Chute")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=MAOR_TIPRACK_50,
            source_labware=MAOR_12_RESERVOIR_B2,
            dest_labware=MAOR_GREINER_1,
            source_wells="A4",
            dest_wells="A12",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Waste Chute",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A12",
        ),
    )

    _assert_maor_export_clean(page, editor, timeline, MAOR_NEIGHBOR_CLEAR_STEPS + 1)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_post_tagmentation_96ch_wash_like_single_transfer(page: Page) -> None:
    """RQA-5354: Post-import TWB → LP1 wash-like transfer uses single nozzle + Waste Chute.

    ALL pickup needs a full CLEAN rack (unavailable post-import). Waste matches protocol washes.
    """
    editor, transfer, timeline = _import_post_tagmentation(page)
    _prepare_post_tag_clean_tiprack(editor)

    print("Post-tag — TWB → LP1, single A1, Once, Waste Chute")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=POST_TAG_TIPRACK_200,
            source_labware=POST_TAG_TWB_RESERVOIR,
            dest_labware=POST_TAG_LP1_BROWN,
            source_wells="A1",
            dest_wells="A1",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Waste Chute",
            nozzle_config="Single nozzle",
            primary_nozzle="A1",
        ),
    )

    _assert_post_tag_export_clean(page, editor, timeline, POST_TAG_DECK_PREP_STEPS + 1)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_post_tagmentation_96ch_lp1_single_once(page: Page) -> None:
    """RQA-5354: Post-import LP1 → LP1 single A1 Once + Waste Chute stays error-free."""
    editor, transfer, timeline = _import_post_tagmentation(page)
    _prepare_post_tag_clean_tiprack(editor)

    print("Post-tag — LP1 → LP1, single A1 Once, Waste Chute")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=POST_TAG_TIPRACK_200,
            source_labware=POST_TAG_LP1_BROWN,
            dest_labware=POST_TAG_LP1_BROWN,
            source_wells="A1",
            dest_wells="A3",
            path="Single transfer",
            volume="30",
            change_tip="Once",
            drop_location="Waste Chute",
            nozzle_config="Single nozzle",
            primary_nozzle="A1",
        ),
    )

    _assert_post_tag_export_clean(page, editor, timeline, POST_TAG_DECK_PREP_STEPS + 1)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_post_tagmentation_96ch_single_always_distribute(page: Page) -> None:
    """RQA-5354: Post-import distribute uses single A1 Always + Waste (row A1 needs B–H empty)."""
    editor, transfer, timeline = _import_post_tagmentation(page)
    _prepare_post_tag_clean_tiprack(editor)

    print("Post-tag — reagent → LP1, distribute, single A1 Always, Waste Chute")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=POST_TAG_TIPRACK_200,
            source_labware=POST_TAG_REAGENT,
            dest_labware=POST_TAG_LP1_BROWN,
            source_wells="A1",
            dest_wells=["A1", "A3", "A5"],
            path="Distribute",
            volume="20",
            change_tip="Always",
            drop_location="Waste Chute",
            nozzle_config="Single nozzle",
            primary_nozzle="A1",
        ),
    )

    _assert_post_tag_export_clean(page, editor, timeline, POST_TAG_DECK_PREP_STEPS + 1)
