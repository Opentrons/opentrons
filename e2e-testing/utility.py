import functools
import re

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, TimeoutError, expect

from automation.pd_pages import LandingPage, ProtocolEditorPage

# Todo add from eyes import eyes_check


def _page_from_value(value: object) -> Page | None:
    """Return a Playwright Page from a test arg or a page object that exposes ``.page``."""
    if isinstance(value, Page):
        return value
    page = getattr(value, "page", None)
    if isinstance(page, Page):
        return page
    return None


def _find_page(*args: object, item: object | None = None, **kwargs: object) -> Page | None:
    """Find a Playwright Page from test/fixture args or a pytest item."""
    for arg in args:
        if (found := _page_from_value(arg)) is not None:
            return found
    for val in kwargs.values():
        if (found := _page_from_value(val)) is not None:
            return found

    if item is not None:
        funcargs = getattr(item, "funcargs", None)
        if isinstance(funcargs, dict):
            for key in ("run_local_app", "page"):
                val = funcargs.get(key)
                if isinstance(val, Page):
                    return val
            for val in funcargs.values():
                if (found := _page_from_value(val)) is not None:
                    return found
        session = getattr(item, "session", None)
        stashed = getattr(session, "playwright_debug_page", None)
        if isinstance(stashed, Page):
            return stashed

    return None


def _pause_for_debugging(
    where: str,
    error: BaseException | None,
    *args: object,
    item: object | None = None,
    **kwargs: object,
) -> None:
    """Print failure context and open Playwright Inspector (shared by decorator + setup hook)."""
    if error is not None:
        print(f"\n🛑 '{where}' failed due to: {type(error).__name__} - {error}")
    else:
        print(f"\n🛑 '{where}' failed")
    print("Pausing execution for debugging...")

    page = _find_page(*args, item=item, **kwargs)
    if page is not None:
        page.pause()
        return

    print("⚠️  Could not find a Playwright page to pause.")
    print("    You can still debug the console state.")


def troubleshoot_and_pause(func):
    """
    Wrap a test (or any callable) so failures call ``page.pause()`` in headed runs.

    Pytest fixture setup is not wrapped automatically — root ``conftest.py`` calls
    ``_pause_for_debugging`` from ``pytest_runtest_makereport`` on setup failures.
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (AssertionError, TimeoutError, PlaywrightError, Exception) as e:
            _pause_for_debugging(func.__name__, e, *args, **kwargs)
            raise

    return wrapper


def import_protocol_and_open_editor(page: Page, PROTOCOL_PATH: str, migration: bool) -> None:
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
        _dismiss_migration_modal(page)
    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)
    page.get_by_role("button", name="Edit protocol").click()
    expect(page.get_by_role("button", name="Add Step")).to_be_visible(timeout=5000)
    return ProtocolEditorPage(page)


def edit_step_form_for_snapshot(page, test_name: str, checkpoint_name: str) -> None:
    """Edit the step form for a specific snapshot."""
    # Todo add eyes_check(page, test_name, checkpoint_name)


def _dismiss_migration_modal(page: Page) -> None:
    overlay = page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
    overlay.wait_for(state="visible", timeout=5000)
    if overlay.is_visible():
        page.get_by_role("button", name="Import", exact=True).click()
        expect(overlay).not_to_be_visible()
    else:
        print("Migration modal did not appear, proceeding with test.")
        pass


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
    if tc:
        page.get_by_test_id("BasicsButtons_thermocycler_yes").get_by_text("Yes").click()
    else:
        page.get_by_test_id("BasicsButtons_thermocycler_no").get_by_text("No").click()
    if waste_chute:
        page.get_by_test_id("BasicsButtons_wasteChute_yes").get_by_text("Yes").click()
    else:
        page.get_by_test_id("BasicsButtons_wasteChute_no").get_by_text("No").click()
    confirm_button = page.get_by_role("button", name="Confirm")
    confirm_button.click()


def start_new_create_protocol(page: Page) -> None:
    """
    Create a a new protocol from banner bar.
    This will open a browser dialog box to verify you'll lose your current progress.
    """
    page.on("dialog", lambda dialog: dialog.accept())
    page.get_by_test_id("basic_button_Create new").click()
