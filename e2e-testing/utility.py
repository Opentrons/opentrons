import functools

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, TimeoutError


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
