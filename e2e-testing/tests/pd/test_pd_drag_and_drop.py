"""Test ability to drag and drop steps on the protocol editor."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage, ProtocolEditorPage

PROTOCOL_PATH = "fixtures/protocol/8/doItAllV8.json"


@pytest.mark.pdE2E
@pytest.mark.slow
def test_drag_drop_steps(page: Page, base_url: str) -> None:
    
    _import_protocol_and_open_editor(page)

    editor = ProtocolEditorPage(page)

    ## Drag Transfer Step down the Step Form, from step 3 (index 2) to step 7 (becomes index 6)
    editor.drag_and_drop(2, 7)

    ## Drag Transfer Step down the Step Form, from step 7 (index 6) to step 10 (becomes index 9 )
    editor.drag_and_drop(6, 10)

    ## Drag Transfer Step up the Step Form, from step 10 (index 9) to index 2 (becomes step 3)
    editor.drag_and_drop(9, 2)

    ## Drag Move Labware Step up the Step Form, from step 11 (index 10) to index 6 (becomes step 7)
    editor.drag_and_drop(10, 6)

    ## Drag Move Labware Step down the Step Form, from step 7 (index 6) to step 11 (becomes step 10)
    editor.drag_and_drop(6, 11)


###########################################################################

def _import_protocol_and_open_editor(page: Page) -> ProtocolEditorPage:
    """Shared setup helper used by both tests."""

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(PROTOCOL_PATH)

    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)
    _dismiss_migration_modal(page)

    page.get_by_role("button", name="Edit protocol").click()
    expect(page.get_by_role("button", name="Add Step")).to_be_visible(timeout=5000)
    return ProtocolEditorPage(page)


def _dismiss_migration_modal(page: Page) -> None:
    """Dismiss the migration modal if it appears during import."""

    overlay = page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
    if overlay.is_visible():
        page.get_by_role("button", name="Import", exact=True).click()
        expect(overlay).not_to_be_visible()
