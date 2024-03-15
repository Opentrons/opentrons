"""Base tools to find and interact with elements.

Expose clear information upon failure.
"""
from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any, Callable, List, Optional, Tuple

from rich.console import Console
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
)
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait


class Element:
    """Describe an element with words and a locator."""

    def __init__(self, locator: Tuple[str, str], description: str) -> None:
        """Instantiate the Element with locator and description."""
        self.locator: Tuple[str, str] = locator
        self.description: str = description


Func = Callable[..., WebElement]


class Base:
    """Object to hold common functionality for WebDriver actions and error handling."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Instantiate the Base.

        With driver, console and a unique identifier for output.
        """
        self.driver: WebDriver = driver
        self.console: Console = console
        self.execution_id = execution_id

    def apply_border_to_locator(
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
            self.driver.execute_script("arguments[0].setAttribute('style', arguments[1]);", finder(), argument)  # type: ignore

        original_style = finder().get_attribute("style")
        apply_style(f"border: {border_size_px}px solid {color};")
        if screenshot:
            self.take_screenshot(message=screenshot_message)
        time.sleep(effect_time_sec)
        if original_style is None:
            apply_style("")
        else:
            apply_style(original_style)

    def apply_border_to_element(
        self,
        element: WebElement,
        effect_time_sec: float = float(os.getenv("HIGHLIGHT_SECONDS", "2")),
        color: str = "magenta",
        border_size_px: int = 3,
        screenshot: bool = False,
        screenshot_message: str = "",
    ) -> None:
        """Highlights (blinks) a Selenium Webdriver element."""

        def apply_style(argument: str) -> None:
            """Execute the javascript to apply the style."""
            self.driver.execute_script("arguments[0].setAttribute('style', arguments[1]);", element, argument)  # type: ignore

        original_style = element.get_attribute("style")
        apply_style(f"border: {border_size_px}px solid {color};")
        if screenshot:
            self.take_screenshot(message=screenshot_message)
        time.sleep(effect_time_sec)
        if original_style is None:
            apply_style("")
        else:
            apply_style(original_style)

    def highlight_element(self, finder: Callable[..., WebElement]) -> None:
        """Highlight an element."""
        slow_mo: Optional[str] = os.getenv("SLOWMO")
        if slow_mo:
            if slow_mo.lower() == "true":
                self.apply_border_to_locator(finder)

    def highlight_elements(self, finder: List[WebElement]) -> None:
        """Highlight an element."""
        slow_mo: Optional[str] = os.getenv("SLOWMO")
        if slow_mo:
            if slow_mo.lower() == "true":
                for ele in finder:
                    self.apply_border_to_element(ele)

    def take_screenshot(self, message: str = "") -> None:
        """Take a screenshot and place in the results directory."""
        directory_for_results: Path = Path(Path(__file__).resolve().parents[2], "results")
        workspace = os.getenv("GITHUB_WORKSPACE", None)
        if workspace is not None:
            # We are in a GitHub action.
            directory_for_results = Path(workspace, "test", "results")
        if not os.path.exists(directory_for_results):
            os.makedirs(directory_for_results)
        note = "" if (message == "") else f"_{message}".replace(" ", "_")
        file_name = (
            f"{str(time.time_ns())[:-3]}_{self.execution_id}".replace("/", "_").replace("::", "__").replace(".py", "") + note + ".png"
        )
        screenshot_full_path: str = str(Path(directory_for_results, file_name))
        self.console.print(f"screenshot saved: {file_name}", style="white on blue")
        self.driver.save_screenshot(screenshot_full_path)

    def click(self, element: Element) -> None:
        r"""Highlight the element to click.

        1. highlight the element \n
        2. screenshot \n
        2. un-highlight \n
        3. click \n
        4. screenshot
        """
        finder = self.create_finder(element, EC.element_to_be_clickable)
        self.apply_border_to_locator(
            finder,
            effect_time_sec=0,
            screenshot=True,
            screenshot_message="item to click",
        )
        finder().click()
        self.take_screenshot(
            message="after click",
        )

    def click_webelement(self, element: WebElement) -> None:
        r"""Highlight the element to click.

        1. highlight the element \n
        2. screenshot \n
        2. un-highlight \n
        3. click \n
        4. screenshot
        """
        self.apply_border_to_element(
            element=element,
            effect_time_sec=0,
            screenshot=True,
            screenshot_message="item to click",
        )
        element.click()
        self.take_screenshot(message="after click")

    def output_exception(
        self,
        element: Element,
    ) -> None:
        """Handle exceptions for locators."""
        self.console.print(f"Issue finding {element.description}", style="white on blue")
        self.console.print(f"Locator {element.locator}", style="white on blue")
        self.take_screenshot(message="on exception")
        self.console.print_exception()

    def create_finder(
        self,
        element: Element,
        expected_condition: Any = EC.presence_of_element_located,
        timeout_sec: int = 12,
    ) -> Callable[..., WebElement]:
        """Create finder function."""
        ignored_exceptions = (
            NoSuchElementException,
            StaleElementReferenceException,
        )

        def finder() -> Any:
            return WebDriverWait(self.driver, timeout_sec, ignored_exceptions=ignored_exceptions).until(expected_condition(element.locator))

        return finder

    def clickable_wrapper(
        self,
        element: Element,
        timeout_sec: int = 12,
    ) -> WebElement:
        """Use the expected condition element_to_be_clickable. Raise on issue."""
        try:
            finder = self.create_finder(element, EC.element_to_be_clickable, timeout_sec)
            finder()
            self.highlight_element(finder)
            return finder()
        except Exception as e:
            self.output_exception(element)
            raise e

    def present_wrapper(self, element: Element, timeout_sec: int = 12) -> WebElement:
        """Gracefully use the expected condition presence_of_element_located. Raise on issue."""
        try:
            finder = self.create_finder(element, timeout_sec=timeout_sec)
            finder()
            self.highlight_element(finder)
            return finder()
        except Exception as e:
            self.output_exception(element)
            raise e

    def find_wrapper(self, element: Element) -> WebElement:
        """Gracefully use find_element. Raise on issue."""
        try:

            def finder() -> WebElement:
                return self.driver.find_element(*element.locator)

            self.highlight_element(finder)
            return finder()
        except Exception as e:
            self.output_exception(element)
            raise e

    def finds_wrapper(self, element: Element) -> List[WebElement]:
        """Gracefully use find_elements. Raise on issue."""
        try:

            def finder() -> List[WebElement]:
                return self.driver.find_elements(*element.locator)

            self.highlight_elements(finder())
            return finder()
        except Exception as e:
            self.output_exception(element)
            raise e

    def clickable_wrapper_safe(
        self,
        element: Element,
        timeout_sec: int = 12,
    ) -> Optional[WebElement]:
        """Gracefully use the expected condition element_to_be_clickable."""
        try:
            finder = self.create_finder(element, EC.element_to_be_clickable, timeout_sec)
            finder()
            self.highlight_element(finder)
            return finder()
        except Exception:
            self.output_exception(element)
            return None

    def invisible_wrapper_safe(
        self,
        element: Element,
        timeout_sec: int = 12,
    ) -> Optional[WebElement]:
        """Gracefully use the expected condition element_to_be_clickable."""
        try:
            finder = self.create_finder(element, EC.invisibility_of_element_located, timeout_sec)
            finder()
            self.highlight_element(finder)
            return finder()
        except Exception:
            self.output_exception(element)
            return None

    def present_wrapper_safe(
        self,
        element: Element,
        timeout_sec: int = 12,
    ) -> Optional[WebElement]:
        """Gracefully use the expected condition presence_of_element_located."""
        try:
            finder = self.create_finder(element, timeout_sec=timeout_sec)
            finder()
            self.highlight_element(finder)
            return finder()
        except Exception:
            self.output_exception(element)
            return None

    def find_wrapper_safe(
        self,
        element: Element,
    ) -> Optional[WebElement]:
        """Gracefully use find_element."""
        try:

            def finder() -> WebElement:
                return self.driver.find_element(*element.locator)

            self.highlight_element(finder)
            return finder()
        except Exception:
            self.output_exception(element)
            return None
