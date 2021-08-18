"""Highlight an element."""
import functools
import os
import time
from typing import Callable, Any, Optional
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement


def apply_border(
    element: WebElement, effect_time_sec: int, color: str, border_size_px: int
) -> None:
    """Highlights (blinks) a Selenium Webdriver element."""
    driver: WebDriver = element._parent  # pylint: disable=W0212

    def apply_style(argument: str) -> None:
        """Execute the javascript to apply the style."""
        driver.execute_script(
            "arguments[0].setAttribute('style', arguments[1]);", element, argument
        )

    original_style = element.get_attribute("style")
    apply_style(f"border: {border_size_px}px solid {color};")
    time.sleep(effect_time_sec)
    apply_style(original_style)


Func = Callable[..., Any]


def highlight(func: Func) -> Optional[WebElement]:
    """Highlight the Webelement returned by the function."""

    @functools.wraps(func)
    def wrapper_highlight(*args: Any, **kwargs: Any) -> WebElement:
        element = func(*args, **kwargs)
        if not os.getenv("SLOWMO"):
            return element
        if os.getenv("SLOWMO").lower() == "true" and element:
            apply_border(
                element, int(os.getenv("HIGHLIGHT_SECONDS", "2")), "magenta", 3
            )
        return element

    return wrapper_highlight


def highlight_element(element: WebElement) -> None:
    """Highlight an element."""
    if not os.getenv("SLOWMO"):
        return
    if os.getenv("SLOWMO").lower() == "true":
        apply_border(element, int(os.getenv("HIGHLIGHT_SECONDS", "2")), "magenta", 3)
