"""E2E regression tests for Protocol Designer 9.0.0 customer-reported protocols."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import ProtocolEditorPage, Timeline
from utility import import_protocol_and_open_editor

MAOR_PROTOCOL_PATH = "fixtures/protocol/9/maor_magnet_sax_predigestion_rqa5529.py"
POST_TAGMENTATION_PROTOCOL_PATH = "fixtures/protocol/9/post_tagmentation_rqa5354.py"

# Maor protocol (RQA-5529): large Flex deck with 12-channel reservoirs and 96ch transfers.
MAOR_MIN_TIMELINE_STEPS = 90
MAOR_IMPORT_TIMEOUT = 120000
MAOR_RESERVOIR_TRANSFER_STEP_INDICES = [3, 9, 12, 16, 18, 23, 25, 37, 38, 46, 47, 52]

# Post-tagmentation protocol (RQA-5354): full deck with automatic tip tracking.
POST_TAGMENTATION_MIN_TIMELINE_STEPS = 35
POST_TAGMENTATION_RESERVOIR_STEP_LABELS = [
    "TWB to -LP1 - Wash 1",
    "TWB to -LP1 - Wash 2",
    "TWB to -LP1 - Wash 3",
]


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
