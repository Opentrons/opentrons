"""Base tools to find and interact with elements.

Expose clear information upon failure.
"""
import os
import time
from pathlib import Path
from typing import Callable, Optional, Tuple

from rich.console import Console
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
        element: WebElement,
        effect_time_sec: float,
        color: str,
        border_size_px: int,
    ) -> None:
        """Highlights (blinks) a Selenium Webdriver element."""
        driver: WebDriver = element._parent

        def apply_style(argument: str) -> None:
            """Execute the javascript to apply the style."""
            driver.execute_script(
                "arguments[0].setAttribute('style', arguments[1]);", element, argument
            )  # type: ignore

        original_style = element.get_attribute("style")
        apply_style(f"border: {border_size_px}px solid {color};")
        time.sleep(effect_time_sec)
        apply_style(original_style)

    def highlight_element(self, element: WebElement) -> None:
        """Highlight an element."""
        slow_mo: Optional[str] = os.getenv("SLOWMO")
        if slow_mo:
            if slow_mo.lower() == "true":
                self.apply_border(
                    element, float(os.getenv("HIGHLIGHT_SECONDS", "2")), "magenta", 3
                )

    def take_screenshot(self) -> None:
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
        file_name = (
            f"{self.execution_id}_{time.time_ns()}".replace("/", "_")
            .replace("::", "__")
            .replace(".py", "")
            + ".png"
        )
        screenshot_full_path: str = str(Path(directory_for_results, file_name))
        self.console.print(f"screenshot full path: {screenshot_full_path}")
        self.driver.save_screenshot(screenshot_full_path)

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
        else:
            raise (current_exception)

    def clickable_wrapper(
        self, element: Element, timeout_sec: int = 12, do_raise: bool = True
    ) -> Optional[WebElement]:
        """Gracefully use the expected condition element_to_be_clickable."""
        try:
            result: WebElement = WebDriverWait(
                self.driver, timeout_sec
            ).until(  # type: ignore
                EC.element_to_be_clickable(element.locator)  # type: ignore
            )
            self.highlight_element(result)
            return result
        except Exception as e:
            self.handle_exception(element, e, do_raise)
            return None

    def find_wrapper(
        self, element: Element, do_raise: bool = True
    ) -> Optional[WebElement]:
        """Gracefully use find_element."""
        try:
            result: WebElement = self.driver.find_element(*element.locator)
            self.highlight_element(result)
            return result
        except Exception as e:
            self.handle_exception(element, e, do_raise)
            return None
