"""Page object for the Labware Creator flow.

Encapsulates locators and interactions for the Labware Library's
``/#/create`` page, mirroring selectors from the legacy Cypress suite
in ``labware-library/cypress/support``.
"""

from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from automation.pd_pages.base_page import BasePage


class LabwareCreator(BasePage):
    """Page object for the Labware Creator wizard."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    # ------------------------------------------------------------------
    # Navigation
    # ------------------------------------------------------------------

    def navigate(self, base_url: str) -> None:
        """Navigate to the Labware Creator page."""
        self.page.goto(f"{base_url}/#/create")

    # ------------------------------------------------------------------
    # Generic helpers
    # ------------------------------------------------------------------

    def _input(self, name: str) -> Locator:
        """Return an ``<input>`` element by its ``name`` attribute."""
        return self.page.locator(f'input[name="{name}"]')

    def _radio(self, name: str, value: str) -> Locator:
        """Return a radio / checkbox ``<input>`` by name + value."""
        return self.page.locator(f'input[name="{name}"][value="{value}"]')

    def _click_radio_in_group(self, question_text: str, option_label: str) -> None:
        """Click a radio option scoped to its question/group text.

        The Labware Creator renders custom radio controls where the actual
        ``<input>`` is visually hidden and overlaid by other elements.
        Clicking the ``<input>`` directly fails because pointer events are
        intercepted.  Instead we locate the question text element, go up
        to its parent container, find the radio by role, then click its
        parent wrapper ``<div>`` which is the intended click target.
        """
        question = self.page.get_by_text(question_text, exact=True)
        group = question.locator("..")
        radio = group.get_by_role("radio", name=option_label)
        # Click the parent wrapper div instead of the hidden input.
        radio.locator("..").click()

    # ------------------------------------------------------------------
    # Labware-type dropdown
    # ------------------------------------------------------------------

    def _open_dropdown(self, label_text: str) -> None:
        """Open a react-select combobox dropdown by its label text.

        The Labware Creator uses react-select which renders an accessible
        ``combobox`` role.  Clicking the combobox opens the options list.
        """
        self.page.get_by_role("combobox", name=label_text).click()

    def _pick_option(self, option_text: str) -> None:
        """Click an option in an open react-select dropdown."""
        self.page.get_by_text(option_text, exact=True).click()

    def select_labware_type(self, label: str) -> None:
        """Open the 'What type of labware…' dropdown and pick *label*."""
        self._open_dropdown("What type of labware are you creating?")
        self._pick_option(label)

    def select_tube_rack(self, label: str) -> None:
        """Open the 'Which tube rack?' dropdown and pick *label*."""
        self._open_dropdown("Which tube rack?")
        self._pick_option(label)

    def click_start_creating(self) -> None:
        """Click 'Start creating labware'."""
        self.page.get_by_text("Start creating labware").click(force=True)

    # ------------------------------------------------------------------
    # Preview image
    # ------------------------------------------------------------------

    def expect_missing_info_message(self, *, visible: bool = True) -> None:
        """Assert whether the 'Add missing info…' message is shown."""
        msg = self.page.get_by_text("Add missing info to see labware preview")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Regularity (homogeneous wells)
    # ------------------------------------------------------------------

    def set_homogeneous_wells(self, value: bool) -> None:
        """Check the regularity radio button (Yes / No)."""
        label = "Yes" if value else "No"
        self._click_radio_in_group("Are all your tubes the same shape and size?", label)

    def expect_incompatible_labware_error(self, *, visible: bool = True) -> None:
        """Assert the 'not compatible with the Labware Creator' error."""
        msg = self.page.get_by_text("Your labware is not compatible with the Labware Creator")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Footprint
    # ------------------------------------------------------------------

    def set_footprint_x(self, value: str) -> None:
        """Fill the footprint X dimension."""
        self._input("footprintXDimension").fill(value)
        self._input("footprintXDimension").blur()

    def set_footprint_y(self, value: str) -> None:
        """Fill the footprint Y dimension."""
        self._input("footprintYDimension").clear()
        self._input("footprintYDimension").fill(value)
        self._input("footprintYDimension").blur()

    # ------------------------------------------------------------------
    # Height
    # ------------------------------------------------------------------

    def set_height(self, value: str) -> None:
        """Fill the labware Z dimension (height) field."""
        self._input("labwareZDimension").clear()
        self._input("labwareZDimension").fill(value)
        self._input("labwareZDimension").blur()

    def expect_too_tall_warning(self, *, visible: bool = True) -> None:
        """Assert the 'may be too tall' warning."""
        msg = self.page.get_by_text("This labware may be too tall")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Grid
    # ------------------------------------------------------------------

    def set_grid_rows(self, value: str) -> None:
        """Fill the grid rows field."""
        self._input("gridRows").fill(value)
        self._input("gridRows").blur()

    def set_grid_columns(self, value: str) -> None:
        """Fill the grid columns field."""
        self._input("gridColumns").fill(value)
        self._input("gridColumns").blur()

    def set_regular_row_spacing(self, value: bool) -> None:
        """Check regular row spacing radio."""
        label = "Yes" if value else "No"
        self._click_radio_in_group("Are all of your rows evenly spaced?", label)

    def set_regular_column_spacing(self, value: bool) -> None:
        """Check regular column spacing radio."""
        label = "Yes" if value else "No"
        self._click_radio_in_group("Are all of your columns evenly spaced?", label)

    # ------------------------------------------------------------------
    # Volume
    # ------------------------------------------------------------------

    def set_well_volume(self, value: str) -> None:
        """Fill the well volume field."""
        self._input("wellVolume").fill(value)
        self._input("wellVolume").blur()

    def focus_and_blur_volume(self) -> None:
        """Focus then blur the volume input to trigger validation."""
        self._input("wellVolume").focus()
        self._input("wellVolume").blur()

    def expect_volume_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Volume is a required field' error."""
        msg = self.page.get_by_text("Volume is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Well shape
    # ------------------------------------------------------------------

    def select_well_shape(self, shape: str) -> None:
        """Select well shape: ``rectangular`` or ``circular``."""
        label_map = {"circular": "Circular", "rectangular": "Rectangular"}
        self._click_radio_in_group("Tube shape", label_map[shape])

    def expect_well_dimension_inputs(
        self,
        *,
        diameter: bool = False,
        x_y: bool = False,
    ) -> None:
        """Assert which well-dimension inputs are visible."""
        if diameter:
            expect(self._input("wellDiameter")).to_be_visible()
        else:
            expect(self._input("wellDiameter")).to_have_count(0)

        if x_y:
            expect(self._input("wellXDimension")).to_be_visible()
            expect(self._input("wellYDimension")).to_be_visible()
        else:
            expect(self._input("wellXDimension")).to_have_count(0)
            expect(self._input("wellYDimension")).to_have_count(0)

    # Rectangular dimensions

    def set_well_x_dimension(self, value: str) -> None:
        """Fill the well X dimension."""
        self._input("wellXDimension").fill(value)
        self._input("wellXDimension").blur()

    def focus_and_blur_well_x(self) -> None:
        """Focus then blur well X to trigger validation."""
        self._input("wellXDimension").focus()
        self._input("wellXDimension").blur()

    def set_well_y_dimension(self, value: str) -> None:
        """Fill the well Y dimension."""
        self._input("wellYDimension").fill(value)
        self._input("wellYDimension").blur()

    def focus_and_blur_well_y(self) -> None:
        """Focus then blur well Y to trigger validation."""
        self._input("wellYDimension").focus()
        self._input("wellYDimension").blur()

    def expect_tube_x_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Tube X is a required field' error."""
        msg = self.page.get_by_text("Tube X is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def expect_tube_y_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Tube Y is a required field' error."""
        msg = self.page.get_by_text("Tube Y is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # Circular dimensions

    def set_well_diameter(self, value: str) -> None:
        """Fill the well diameter."""
        self._input("wellDiameter").fill(value)
        self._input("wellDiameter").blur()

    def focus_and_blur_diameter(self) -> None:
        """Focus then blur diameter to trigger validation."""
        self._input("wellDiameter").focus()
        self._input("wellDiameter").blur()

    def expect_diameter_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Diameter is a required field' error."""
        msg = self.page.get_by_text("Diameter is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Well bottom shape and depth
    # ------------------------------------------------------------------

    def select_well_bottom_shape(self, shape: str) -> None:
        """Select well bottom shape: ``flat``, ``u``, or ``v``."""
        label_map = {"flat": "Flat", "u": "Round", "v": "V-Bottom"}
        self._click_radio_in_group("Bottom shape", label_map[shape])

    def expect_well_bottom_image(
        self,
        *,
        flat: bool = False,
        round: bool = False,
        v: bool = False,
    ) -> None:
        """Assert which well-bottom images are displayed.

        Mirrors the ``wellBottomImageLocator`` from the Cypress support file.
        """
        flat_img = self.page.locator('img[alt*="flat bottom"]')
        round_img = self.page.locator('img[alt*="u shaped"]')
        v_img = self.page.locator('img[alt*="v shaped"]')

        if flat:
            expect(flat_img).to_be_visible()
        else:
            expect(flat_img).to_have_count(0)

        if round:
            expect(round_img).to_be_visible()
        else:
            expect(round_img).to_have_count(0)

        if v:
            expect(v_img).to_be_visible()
        else:
            expect(v_img).to_have_count(0)

    def set_well_depth(self, value: str) -> None:
        """Fill the well depth field."""
        self._input("wellDepth").fill(value)
        self._input("wellDepth").blur()

    def focus_and_blur_depth(self) -> None:
        """Focus then blur depth to trigger validation."""
        self._input("wellDepth").focus()
        self._input("wellDepth").blur()

    def expect_depth_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Depth is a required field' error."""
        msg = self.page.get_by_text("Depth is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Offset / spacing
    # ------------------------------------------------------------------

    def set_grid_spacing_x(self, value: str) -> None:
        """Fill the grid spacing X field."""
        self._input("gridSpacingX").fill(value)
        self._input("gridSpacingX").blur()

    def set_grid_spacing_y(self, value: str) -> None:
        """Fill the grid spacing Y field."""
        self._input("gridSpacingY").fill(value)
        self._input("gridSpacingY").blur()

    def set_grid_offset_x(self, value: str) -> None:
        """Fill the grid offset X field."""
        self._input("gridOffsetX").fill(value)
        self._input("gridOffsetX").blur()

    def set_grid_offset_y(self, value: str) -> None:
        """Fill the grid offset Y field."""
        self._input("gridOffsetY").fill(value)
        self._input("gridOffsetY").blur()

    # ------------------------------------------------------------------
    # Export
    # ------------------------------------------------------------------

    def click_export_button(self) -> None:
        """Click the export button (uses the CSS class selector from Cypress)."""
        self.page.locator('button[class*="_export_button_"]').click(force=True)

    def expect_export_validation_error(self, *, visible: bool = True) -> None:
        """Assert the 'Please resolve all invalid fields…' modal."""
        msg = self.page.get_by_text("Please resolve all invalid fields in order to export the labware definition")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def close_export_error_modal(self) -> None:
        """Close the export-error modal by clicking 'close'."""
        self.page.get_by_text("close").click(force=True)

    def click_export_file(self) -> None:
        """Click the 'EXPORT FILE' button to trigger the download."""
        self.page.get_by_role("button", name="EXPORT FILE").click()

    # ------------------------------------------------------------------
    # Brand fields
    # ------------------------------------------------------------------

    def expect_brand_required_error(self, *, visible: bool = True) -> None:
        """Assert that rack and/or tube brand required errors are shown."""
        rack_msg = self.page.get_by_text("Rack Brand is a required field")
        tube_msg = self.page.get_by_text("Tube Brand is a required field")
        if visible:
            expect(rack_msg).to_be_visible()
            expect(tube_msg).to_be_visible()
        else:
            expect(rack_msg).not_to_be_visible()
            expect(tube_msg).not_to_be_visible()

    def set_brand(self, value: str) -> None:
        """Fill the brand field."""
        self._input("brand").fill(value)

    def set_group_brand(self, value: str) -> None:
        """Fill the tube brand (groupBrand) field."""
        self._input("groupBrand").fill(value)

    # ------------------------------------------------------------------
    # File-info assertions
    # ------------------------------------------------------------------

    def expect_display_name_placeholder(self, expected: str) -> None:
        """Assert the display-name input has the expected placeholder."""
        expect(self.page.locator(f'input[placeholder="{expected}"]')).to_be_visible()

    def expect_filename_placeholder(self, expected: str) -> None:
        """Assert the filename input has the expected placeholder."""
        expect(self.page.locator(f'input[placeholder="{expected}"]')).to_be_visible()
