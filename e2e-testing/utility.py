import functools
import re
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, TimeoutError, expect

from automation.pd_pages import DeckConfigPage, LandingPage, ProtocolEditorPage

# Todo add from eyes import eyes_check


def _find_page_in_args(*args, **kwargs) -> Page | None:
    """Helper function to find the Playwright Page object in function arguments."""
    # Check positional arguments
    for arg in args:
        if isinstance(arg, Page):
            return arg
    # Check keyword arguments
    for val in kwargs.values():
        if isinstance(val, Page):
            return val
    return None


def troubleshoot_and_pause(func):
    """
    A decorator that wraps a function in a try...except block.

    On failure, it prints the error, attempts to find the Playwright
    'page' object to call 'page.pause()' for debugging, and then re-raises
    the exception.
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # Execute the decorated function
            return func(*args, **kwargs)
        except (AssertionError, TimeoutError, PlaywrightError, Exception) as e:
            print(f"\n🛑 Test '{func.__name__}' failed due to: {type(e).__name__} - {e}")
            print("Pausing execution for debugging...")

            # Try to find the page object to pause
            page = _find_page_in_args(*args, **kwargs)

            if page:
                page.pause()
            else:
                print("⚠️  Could not find 'page' object in arguments to pause.")
                print("    You can still debug the console state.")
                # As a fallback, you could use pdb to pause the script itself
                # import pdb; pdb.set_trace()

            raise  # Re-raise the exception after pausing

    return wrapper


def assert_export_downloads_clean_protocol(
    page: Page,
    editor: ProtocolEditorPage,
    exports_dir: Path,
    *,
    filename: str,
    export_timeout: int = 60000,
) -> Path:
    """Export the open protocol and assert the timeline stays error-free."""
    expect(page.get_by_text("Protocol has timeline errors", exact=False)).to_have_count(0, timeout=5000)
    destination = exports_dir / filename
    editor.export_protocol(destination, timeout=export_timeout)
    assert destination.exists(), f"Export did not create {destination}"
    assert destination.stat().st_size > 0, f"Export file is empty: {destination}"
    return destination


def import_protocol_and_open_editor(
    page: Page,
    PROTOCOL_PATH: str,
    migration: bool,
    *,
    migration_timeout: int = 15000,
) -> None:
    """This test takes two inputs:
    1. page: The Playwright Page object.
    2. PROTOCOL_PATH: The file path of the protocol to import
    3. migration: Boolean indicating if a migration modal is expected
    when we update PD
    Located in fixtures/protocol/
    """

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(PROTOCOL_PATH)

    if migration:
        _dismiss_migration_modal(page, timeout=migration_timeout)
    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=migration_timeout)
    page.get_by_role("button", name="Edit protocol").click()
    expect(page.get_by_role("button", name="Add Step")).to_be_visible(timeout=5000)
    return ProtocolEditorPage(page)


def edit_step_form_for_snapshot(page, test_name: str, checkpoint_name: str) -> None:
    """Edit the step form for a specific snapshot."""
    # Todo add eyes_check(page, test_name, checkpoint_name)


def _dismiss_migration_modal(page: Page, *, timeout: int = 15000) -> None:
    """Dismiss the migration modal if it appears; otherwise continue to metadata."""
    migration_prompt = page.get_by_text("Your protocol was made in an older version of Protocol Designer")
    metadata_heading = page.get_by_text("Protocol Metadata")
    expect(migration_prompt.or_(metadata_heading).first).to_be_visible(timeout=timeout)

    if migration_prompt.is_visible():
        page.get_by_role("button", name="Import", exact=True).click()
        expect(metadata_heading).to_be_visible(timeout=timeout)
    else:
        print("Migration modal did not appear, proceeding with test.")


def create_new_protocol_from_landing_page(pipette: str, gripper: bool, tc: bool, waste_chute: bool, page: Page) -> None:
    """Create a new protocol from the landing page."""
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()

    landing.click_create_protocol()
    create_new_protocol_flow(pipette, gripper, tc, waste_chute, page)


def create_new_protocol_flow(pipette: str, gripper: bool, tc: bool, waste_chute: bool, page: Page) -> None:
    page.get_by_text("Add a pipette").click()
    page.get_by_text(pipette).click()
    page.get_by_text("50 µL").click()
    page.locator("label").filter(has=page.get_by_text(re.compile(r"^Tip Rack 50 µL$"))).first.click()
    page.get_by_role("button", name="Save").click()
    page.get_by_text("Yes", exact=True).click()
    if gripper:
        page.get_by_test_id("BasicsButtons_gripper_yes").get_by_text("Yes").click()
    else:
        page.get_by_test_id("BasicsButtons_gripper_no").get_by_text("No").click()
    confirm_button = page.get_by_role("button", name="Confirm")
    confirm_button.click()

    deck_config = DeckConfigPage(page)
    deck_config.configure_initial_deck_hardware(tc=tc, waste_chute=waste_chute)


def start_new_create_protocol(page: Page) -> None:
    """
    Create a a new protocol from banner bar.
    This will open a browser dialog box to verify you'll lose your current progress.
    """
    page.on("dialog", lambda dialog: dialog.accept())
    page.get_by_test_id("basic_button_Create new").click()
