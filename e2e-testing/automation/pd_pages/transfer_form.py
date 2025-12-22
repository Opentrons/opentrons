"""Protocol editor page object."""

from typing import List, Literal, Union

from playwright.sync_api import Page

from .base_page import BasePage

from opentrons.protocol_api import labware

def get_all_tiprack_display_names():
# Get all standard labware load names (e.g., 'opentrons_96_tiprack_300ul')
    all_labware = labware.get_all_labware_definitions()
    tiprack_display_names = []
    for load_name, definition in all_labware.items():
        # Check if the labware is categorized as a tip rack
        if definition.get('parameters', {}).get('isTiprack'):
            display_name = definition.get('metadata', {}).get('displayName')
            if display_name:
                tiprack_display_names.append(display_name)
# Sort and remove duplicates
    return sorted(list(set(tiprack_display_names)))

class TransferPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def select_nozzles(self, nozzles: Literal["All", "Column", "Single"]) -> None:
        """Select from All, Column, or Single nozzles."""
        initial_nozzle = self.page.get_by_text('All')
        initial_nozzle.click()
        actual_nozzle_option = self.page.get_by_text(nozzles)
        actual_nozzle_option.click()

    def tip_rack_page_1_transfer_select(self, tiprack: str) -> None:
        """Select tip rack on page 1 of transfer step for Flex robot."""
        self.page.get_by_test_id("tipRack_dropdownMenu").click()
        tip_rack = self.page.get_by_text(tiprack)
        tip_rack.click()
    def source_labware_select(self, labware: str) -> None:
        """Select source labware in transfer step."""
        self.page.get_by_test_id("aspirate_labware_dropdownMenu").click()
        source_labware = self.page.get_by_text(labware)
        source_labware.click()
    locations = Literal['Source', 'Destination']
    def wells_select(self, location:locations, wells: Union[str, List[str]], rect: bool = True) -> None:
        """
        Select source wells. 
        Args:
            wells: A single well name (e.g., "A1") or a list (e.g., ["A1", "B1", "C1"]).
            rect: If True, uses the 'rect' selector logic for SVG grids.
        """
        if location == 'Source':
            self.page.locator('input[name="aspirate_wells"]').click()
        elif location == 'Destination':
            self.page.locator('input[name="dispense_wells"]').click()

        # 2. Convert single string to list for uniform processing
        well_list = [wells] if isinstance(wells, str) else wells

        for well in well_list:
            if rect:
                # Target the SVG rect specifically by its data attribute
                self.page.locator(f'rect[data-wellname="{well}"]').click()
            else:
                # Fallback for non-rect elements if applicable
                self.page.get_by_text(f'circle[data-wellname="{well}"]').click()
        self.page.get_by_text('Save', exact=True).click()

    def destination_labware_select(self, labware: str) -> None:
        """Select destination labware in transfer step."""
        self.page.get_by_test_id("dispense_labware_dropdownMenu").click()
        destination_labware = self.page.get_by_text(labware)
        destination_labware.click()
    
    def Pipette_Path(self) -> str:
        """Get the data-testid path for the pipette selection element."""
        return "pipette_dropdownMenu"