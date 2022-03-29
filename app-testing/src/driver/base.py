"""Base tools to find and interact with elements.

Expose clear information upon failure.
"""
from email import message
import os
import time
from pathlib import Path
from typing import Callable, Optional, Tuple
from black import remove_trailing_semicolon

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from selenium.common.exceptions import (
    StaleElementReferenceException,
    NoSuchElementException,
)


class Element:
    """Describe an element with words and a locator."""

    def __init__(self, locator: Tuple[str, str], description: str) -> None:
        """Instantiate the Element with locator and description."""
        self.locator: Tuple[str, str] = locator
        self.description: str = description


Func = Callable[..., WebElement]


class Base:
    """Object to hold commom functionality for WebDriver actions and error handling."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Instantiate the Base.

        With driver, console and a unique identifier for output.
        """
        self.driver: WebDriver = driver
        self.console: Console = console
        self.execution_id = execution_id

    def apply_border(
        self,
        finder: Callable[..., WebElement],
        effect_time_sec: float = float(os.getenv("HIGHLIGHT_SECONDS", "2")),
        color: str = "magenta",
        border_size_px: int = 3,
        screenshot: bool = False,
        screenshot_message: str = "",
    ) -> None:
        """Highlights (blinks) a Selenium Webdriver element."""

        def apply_style(argument: str) -> None:
            """Execute the javascript to apply the style."""
            self.driver.execute_script(
                "arguments[0].setAttribute('style', arguments[1]);", finder(), argument
            )  # type: ignore

        original_style = finder().get_attribute("style")
        apply_style(f"border: {border_size_px}px solid {color};")
        if screenshot:
            self.take_screenshot(message=screenshot_message)
        time.sleep(effect_time_sec)
        apply_style(original_style)

    def highlight_element(self, finder: Callable[..., WebElement]) -> None:
        """Highlight an element."""
        slow_mo: Optional[str] = os.getenv("SLOWMO")
        if slow_mo:
            if slow_mo.lower() == "true":
                self.apply_border(finder)

    def take_screenshot(self, message: str = "") -> None:
        """Take a screenshot and place in the results directory."""
        directory_for_results: Path = Path(
            Path(__file__).resolve().parents[2], "results"
        )
        workspace = os.getenv("GITHUB_WORKSPACE", None)
        if workspace is not None:
            # We are in a GitHub action.
            directory_for_results = Path(workspace, "test", "results")
        if not os.path.exists(directory_for_results):
            os.makedirs(directory_for_results)
        note = "" if (message == "") else f"_{message}".replace(" ", "_")
        file_name = (
            f"{self.execution_id}_{time.time_ns()}".replace("/", "_")
            .replace("::", "__")
            .replace(".py", "")
            + note
            + ".png"
        )
        screenshot_full_path: str = str(Path(directory_for_results, file_name))
        self.console.print(f"screenshot saved: {file_name}")
        self.driver.save_screenshot(screenshot_full_path)

    def click(self, element: Element) -> None:
        """Highlight the element to click.

        screenshot when highlighted
        un-highlight
        click
        screenshot after clicking"""
        finder = self.create_finder(element, EC.element_to_be_clickable)
        self.apply_border(finder, screenshot=True, screenshot_message="item to click")
        finder().click()
        self.take_screenshot(message="after click")

    def handle_exception(
        self, element: Element, current_exception: Exception, do_raise: bool
    ) -> None:
        """Handle exceptions for locators."""
        self.console.log(f"Issue finding {element.description}")
        self.take_screenshot()
        if not do_raise:
            self.console.print(
                "We are NOT raising an Exception.", style="bold red underline"
            )
            self.console.print(current_exception)
        else:
            raise (current_exception)

    def create_finder(
        self,
        element: Element,
        expected_condition=EC.presence_of_element_located,
        timeout_sec: int = 12,
    ) -> Callable[..., WebElement]:
        """Create finder function."""
        ignored_exceptions = (
            NoSuchElementException,
            StaleElementReferenceException,
        )

        def finder() -> WebElement:
            return WebDriverWait(
                self.driver, timeout_sec, ignored_exceptions=ignored_exceptions
            ).until(  # type: ignore
                expected_condition(element.locator)  # type: ignore
            )

        return finder

    def clickable_wrapper(
        self,
        element: Element,
        timeout_sec: int = 12,
        do_raise: bool = True,
    ) -> Optional[WebElement]:
        """Gracefully use the expected condition element_to_be_clickable."""
        try:
            finder = self.create_finder(
                element, EC.element_to_be_clickable, timeout_sec
            )
            finder()
            self.highlight_element(finder)
            return finder()
        except Exception as e:
            self.handle_exception(element, e, do_raise)
            return None

    def present_wrapper(
        self, element: Element, timeout_sec: int = 12, do_raise: bool = True
    ) -> Optional[WebElement]:
        """Gracefully use the expected condition presence_of_element_located."""
        try:
            finder = self.create_finder(element, timeout_sec=timeout_sec)
            finder()
            self.highlight_element(finder)
            return finder()
        except Exception as e:
            self.handle_exception(element, e, do_raise)
            return None

    def find_wrapper(
        self, element: Element, do_raise: bool = True
    ) -> Optional[WebElement]:
        """Gracefully use find_element."""
        try:

            def finder() -> WebElement:
                return self.driver.find_element(*element.locator)

            self.highlight_element(finder)
            return finder()
        except Exception as e:
            self.handle_exception(element, e, do_raise)
            return None
