"""Protocol editor page object."""

import re
from typing import Literal

from playwright.sync_api import Page

from automation.base_page import BasePage


class PlateReaderPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def configure_module(self, slot: Literal["A3", "B3", "C3", "D3"], module: str) -> None:
        """Configure the Plate Reader module.

        Args:
            slot: Either column 3 slot locations compatible with Plate Reader module
            module: Module name as appears in the module selection list
        """
        self.page.get_by_test_id(slot).click()
        self.page.get_by_test_id("Modules").click()
        self.page.get_by_test_id(module).click()

    def dimiss_deck_hardware_modal(self) -> None:
        """Dismiss the deck hardware modal if it appears."""
        self.page.get_by_test_id("Toast_info").get_by_role("button").click()

    def define_initialization(
        self,
        init_setting: Literal["Single", "Multi"],
        wavelength: int | None = None,
    ) -> None:
        """Define initialization settings for the Plate Reader.

        Args:
            init_setting: Either "Single" or "Multi"
            wavelength: Wavelength value for defining own wavelength ("Other") selection, or None if not
        """
        define_init = self.page.locator("div").filter(has_text=re.compile(r"^Define initialization settings$")).nth(1)
        change_lid = self.page.locator("div").filter(has_text=re.compile(r"^Change initialization settings$")).nth(1)

        if define_init.is_visible() or change_lid.is_visible():
            if define_init.is_visible():
                define_init.click()
            elif change_lid.is_visible():
                change_lid.click()

        self.button_selection("Continue")

        if init_setting == "Single":
            self._single_initialization("nm (green)", True, "Other", wavelength)
            self.save_pr_step()
        elif init_setting == "Multi":
            self._multi_initialization(4, wavelength)
            self.save_pr_step()

    def change_lid_position(self, position: Literal["Open", "Closed"]) -> None:
        self.page.get_by_text("Change lid position").click()
        self.page.locator("div").filter(has_text=re.compile(r"^Change lid position$")).nth(1).click()
        self.button_selection("Continue")
        if position == "Open":
            self.page.get_by_test_id("ToggleButton_Closed").click()

    def read_labware(self, file_name: str) -> None:
        self.page.locator("div").filter(has_text=re.compile(r"^Read labware$")).nth(1).click()
        self.button_selection("Continue")
        self.page.get_by_role("textbox").fill(file_name)

    def save_pr_step(self) -> None:
        """Click save transfer step button in transfer step."""
        self.page.get_by_text("Save", exact=True).click()

    def wait_for_save_banner_gone(self) -> None:
        """Wait for the save banner to disappear."""
        banner_message = "Absorbance Plate Reader has been saved"
        banner = self.page.get_by_test_id("Snackbar").get_by_text(banner_message, exact=True).first
        banner.wait_for(state="visible")
        banner.wait_for(state="detached")

    def button_selection(self, button_name: str) -> None:
        self.page.get_by_role("button", name=button_name).click()

    def _single_initialization(
        self,
        nm_value: Literal["nm (blue)", "nm (green)", "nm (orange)", "nm (red)", "Other"],
        ref_wavelength_bool: bool,
        ref_nm: Literal["nm (blue)", "nm (green)", "nm (orange)", "nm (red)", "Other"] | None = None,
        wavelength: int | None = None,
    ) -> None:
        """Define single-wavelength initialization.

        Args:
            nm_value: predefined wavelength selections from dropdown
            ref_wavelength_bool: Boolean to indicate whether to add a reference wavelength  or not
            ref_nm: predefined wavelength selections from dropdown, only used if ref_wavelength_bool is True
            wavelength: custom wavelength value for "Other" selection, only used if nm_value or ref_nm is "Other"
        """

        self.page.locator("div").filter(has_text=re.compile(r"^Single$")).nth(1).click()
        self.page.get_by_test_id("dropdownMenu").locator("svg").click()
        if nm_value == "Other":
            assert wavelength is not None, "wavelength must be provided when nm_value is 'Other'"
            self.button_selection(nm_value)
            self._define_custom_wavelength(wavelength)
        else:
            self.button_selection(nm_value)

        if ref_wavelength_bool:
            self.page.get_by_test_id("ListButton_noActive").locator("div").filter(
                has_text="Add reference wavelength?"
            ).locator("div").click()
            self.page.get_by_test_id("dropdownMenu").locator("svg").last.click()
            if ref_nm == "Other":
                assert wavelength is not None, "wavelength must be provided when reference wavelength is 'Other'"
                self.button_selection(ref_nm)
                self._define_custom_wavelength(wavelength)
            else:
                assert ref_nm is not None, "reference wavelength must be provided when ref_wavelength_bool is True"
                self.button_selection(ref_nm)

    def _multi_initialization(
        self,
        num_wavelengths: int,
        wavelength: int | None = None,
    ) -> None:
        """Define multi-wavelength initialization.

        Args:
            num_wavelengths: Number of wavelengths to select (1-6), selecting 4 simply for testing each wavelength
            wavelength: Wavelength value for "Other" selection, e.g. "500"
        """
        nm = ["nm (green)", "nm (orange)", "nm (red)", "Other"]
        self.page.locator("div").filter(has_text=re.compile(r"^Multi$")).nth(1).click()
        if num_wavelengths > 6:
            raise ValueError("num_wavelengths cannot exceed 6")
        elif num_wavelengths == 1:
            self.page.get_by_test_id("EmptySelectorButton_click").click()
            self.page.get_by_text("nm (blue)").nth(1).click()
        else:
            for i in range(num_wavelengths):
                label = nm[i]
                self.page.get_by_test_id("EmptySelectorButton_click").click()
                self.page.get_by_test_id("dropdownMenu").nth(i + 1).click()
                self.button_selection(label)
                if label == "Other" and wavelength is not None:
                    self._define_custom_wavelength(wavelength)

    def _define_custom_wavelength(self, wavelength: int) -> None:
        """Define a custom wavelength.

        Args:
            wavelength: Wavelength value, e.g. "500"
        """
        textbox = self.page.get_by_role("textbox")
        textbox.click()
        self.page.get_by_role("textbox").fill(str(wavelength))
