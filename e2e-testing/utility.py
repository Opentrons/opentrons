import functools

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, TimeoutError, expect

from automation.pd_pages import LandingPage, ProtocolEditorPage


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


def _import_protocol_and_open_editor(page: Page, PROTOCOL_PATH: str) -> ProtocolEditorPage:
    """This test takes two inputs:
    1. page: The Playwright Page object.
    2. PROTOCOL_PATH: The file path of the protocol to import
    Located in fixtures/protocol/
    """

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(PROTOCOL_PATH)

    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)

    page.get_by_role("button", name="Edit protocol").click()
    expect(page.get_by_role("button", name="Add Step")).to_be_visible(timeout=5000)
    return ProtocolEditorPage(page)
