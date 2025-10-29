"""Protocol editor page object."""

from playwright.sync_api import Page

from .base_page import BasePage


class ProtocolEditorPage(BasePage):
    """Main protocol editor page for adding labware and steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def add_labware_to_slot(self, slot: str) -> None:
        """Add labware to a specific slot.

        Args:
            slot: Slot identifier like "D2"
        """
        self.page.get_by_test_id(slot).get_by_role("button", name="Add labware").click()
        self.click_test_id("EmptySelectorButton_click")

    def select_labware_category(self, category_index: int = 2) -> None:
        """Select a labware category from the list.

        Args:
            category_index: Index of the category button (default: 2)
        """
        self.page.get_by_test_id("ListButton_noActive").nth(category_index).click()

    def select_labware_by_name(self, labware_name: str) -> None:
        """Select a specific labware by its name.

        Args:
            labware_name: Name of the labware, e.g., "Axygen 96 Well Plate 500 µL"
        """
        self.page.locator("label").filter(has_text=labware_name).click()
        self.click_test_id("SelectLabwareModal_confirm")

    def edit_liquid(self) -> None:
        """Open the liquid editing interface."""
        self.page.get_by_text("Edit liquid").wait_for(state="visible", timeout=10000)
        self.page.get_by_text("Edit liquid").click()

    def select_first_well(self) -> None:
        """Select the first well in the labware."""
        self.page.locator("circle").first.click()

    def define_liquid(self, name: str) -> None:
        """Define a new liquid with a name.

        Args:
            name: Name of the liquid, e.g., "Water"
        """
        self.click_button("Define a liquid")
        self.page.locator('input[name="displayName"]').click()
        self.page.locator('input[name="displayName"]').fill(name)
        self.page.get_by_label("ModalShell_ModalArea").get_by_role("button", name="Save").click()

    def assign_liquid_to_wells(self, liquid_name: str, volume: str) -> None:
        """Assign a liquid to selected wells with a specific volume.

        Args:
            liquid_name: Name of the liquid
            volume: Volume in µL as a string
        """
        self.click_test_id("dropdownMenu")
        self.click_button(liquid_name)
        self.page.get_by_role("textbox").click()
        self.page.get_by_role("textbox").fill(volume)
        self.click_button("Save")

    def confirm_liquid_setup(self) -> None:
        """Confirm the liquid setup and close the modal."""
        self.click_test_id("Toolbox_confirmButton")

    def add_step(self, step_type: str = "Transfer") -> None:
        """Add a new protocol step.

        Args:
            step_type: Type of step to add, e.g., "Transfer", "Mix", etc.
        """
        self.click_button("Add Step")
        self.click_button(step_type)

    def configure_transfer_source(self) -> None:
        """Configure the source for a transfer step."""
        self.page.locator(".Flex-sc-1qhp8l7-0.InputField___StyledFlex2-sc-1gyyvht-3").first.click()
        self.page.locator("circle").first.click()
        self.click_button("Save")

    def configure_transfer_destination(self, labware_name: str | None = None, well_index: int = 17) -> None:
        """Configure the destination for a transfer step.

        Args:
            labware_name: Name of destination labware (if needed for sandbox)
            well_index: Index of the destination well
        """
        if self.is_sandbox and labware_name:
            self.page.get_by_text("Choose option").click()
            self.click_button(labware_name)

        # Select dispense wells
        if self.is_sandbox:
            self.page.locator('input[name="dispense_wells"]').click()
        else:
            self.page.locator("[name='dispense_wells']").click()

        self.page.locator(f"circle:nth-child({well_index})").first.click()
        self.click_button("Save")

    def set_transfer_volume(self, volume: str) -> None:
        """Set the volume for a transfer step.

        Args:
            volume: Volume in µL as a string
        """
        self.page.locator('input[name="volume"]').click()
        self.page.locator('input[name="volume"]').fill(volume)
        self.click_button("Continue")
        self.click_button("Continue")
