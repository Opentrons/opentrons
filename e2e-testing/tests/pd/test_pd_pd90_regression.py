"""E2E regression tests for Protocol Designer 9.0.0 customer-reported protocols."""

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
MAOR_POST_IMPORT_STEPS = 3

# well_plate_1 is discarded in-trash by the end of the protocol; well_plate_2 ends on B1.
MAOR_GREINER_B1 = "B1 Maor_Greiner 96 Well Plate 323 µL"
MAOR_GREINER_1 = "Maor_Greiner 96 Well Plate 323 µL (1)"
MAOR_12_RESERVOIR = "Maor_Opentrons Tough 22mL 12 Well Reservoir"
# reservoir_3 ends on B2; same displayName as reservoir_1 on the temp module.
MAOR_12_RESERVOIR_B2 = "B2 Maor_Opentrons Tough 22mL 12 Well Reservoir"
# TiprackField options use labware displayName (deduped by def URI), not deck nicknames.
MAOR_TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"

# Post-tagmentation protocol (RQA-5354): full deck with automatic tip tracking.
POST_TAGMENTATION_MIN_TIMELINE_STEPS = 35
POST_TAGMENTATION_POST_IMPORT_STEPS = 3
POST_TAGMENTATION_RESERVOIR_STEP_LABELS = [
    "TWB to -LP1 - Wash 1",
    "TWB to -LP1 - Wash 2",
    "TWB to -LP1 - Wash 3",
]

POST_TAG_TWB_RESERVOIR = "TWB Reservoir 90mL"
POST_TAG_LP1_BROWN = "-LP1 plate in a brown base"
POST_TAG_REAGENT = "Reagent plate"
POST_TAG_INDEXES = "Illumina Indexes"
POST_TAG_TIPRACK_200 = "Opentrons Flex 96 Filter Tip Rack 200 µL"


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
def test_pd_maor_protocol_accepts_new_96ch_transfer_steps(page: Page) -> None:
    """RQA-5529: after import, wizard-authored 96ch steps on Greiner plates and 12-reservoir stay error-free."""
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

    print("Maor post-import — single-column Greiner → Greiner, Once")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=MAOR_TIPRACK_1000,
            source_labware=MAOR_GREINER_B1,
            dest_labware=MAOR_GREINER_1,
            source_wells="A1",
            dest_wells="B1",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Tip rack",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
        ),
    )

    print("Maor post-import — single column partial, automatic tip tracking")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=MAOR_TIPRACK_1000,
            source_labware=MAOR_GREINER_1,
            dest_labware=MAOR_GREINER_B1,
            source_wells="A1",
            dest_wells="B1",
            path="Single transfer",
            volume="40",
            change_tip="Once",
            drop_location="Tip rack",
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
        ),
    )

    print("Maor post-import — 12-reservoir → Greiner (reservoir well-selection regression)")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=MAOR_TIPRACK_1000,
            source_labware=MAOR_12_RESERVOIR_B2,
            dest_labware=MAOR_GREINER_1,
            source_wells="A4",
            dest_wells="A1",
            path="Single transfer",
            volume="100",
            change_tip="Once",
            drop_location="Tip rack",
            nozzle_config="All nozzles (recommended)",
        ),
    )

    timeline.wait_for_timeline_steps(min_steps=MAOR_MIN_TIMELINE_STEPS + MAOR_POST_IMPORT_STEPS)
    timeline.expect_no_known_regression_errors()

    editor.click_button("Export")
    expect(page.get_by_text("Protocol has timeline errors", exact=False)).to_have_count(0, timeout=5000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(900)
def test_pd_post_tagmentation_accepts_new_96ch_transfer_steps(page: Page) -> None:
    """RQA-5354: after import, wizard-authored reservoir and partial-nozzle steps stay error-free."""
    import_protocol_and_open_editor(page, POST_TAGMENTATION_PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=POST_TAGMENTATION_MIN_TIMELINE_STEPS)
    timeline.expect_no_known_regression_errors()

    print("Post-tagmentation post-import — TWB reservoir → LP1 brown base (wash-like)")
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
            drop_location="Tip rack",
            nozzle_config="All nozzles (recommended)",
        ),
    )

    print("Post-tagmentation post-import — single nozzle partial, manual tips")
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
            tip_tracking="Manual tip tracking",
            manual_tips=["H12"],
            nozzle_config="Single nozzle",
            primary_nozzle="A12",
        ),
    )

    print("Post-tagmentation post-import — reagent → indexes distribute, automatic")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=POST_TAG_TIPRACK_200,
            source_labware=POST_TAG_REAGENT,
            dest_labware=POST_TAG_INDEXES,
            source_wells="A1",
            dest_wells=["A1", "A2", "A3"],
            path="Distribute",
            volume="20",
            change_tip="Always",
            drop_location="Tip rack",
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
        ),
    )

    timeline.wait_for_timeline_steps(
        min_steps=POST_TAGMENTATION_MIN_TIMELINE_STEPS + POST_TAGMENTATION_POST_IMPORT_STEPS
    )
    timeline.expect_no_known_regression_errors()

    editor.click_button("Export")
    expect(page.get_by_text("Protocol has timeline errors", exact=False)).to_have_count(0, timeout=5000)
