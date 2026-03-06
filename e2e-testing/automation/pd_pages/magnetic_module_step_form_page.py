"""Page object for the create-protocol onboarding wizard."""

from __future__ import annotations

from playwright.sync_api import Page

from automation.base_page import BasePage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage


class AddMagneticModule(BasePage):
    """Steps for interacting with the magnetic module step form."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.editor = ProtocolEditorPage(page)

    # Add Magnetic Module
    def magnetic_module_engage_height(self, height: int) -> None:
        """
        Set the engage height for the magnetic module.
        Saves form.
        args:
            height: The engage height value to set, as an integer.
        """
        self.page.get_by_role("textbox").fill(str(height))
        self.editor.select_save_text()

    def magnetic_module_disengage(self) -> None:
        """
        Disengage magnetic module.
        Note: You just have to save the step with the disengage option selected,
        there is no text field to fill out for this option.
        """
        self.editor.select_save_text()
