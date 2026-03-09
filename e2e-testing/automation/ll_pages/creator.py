"""Page object for the Labware Creator flow.

Encapsulates locators and interactions for the Labware Library's
``/#/create`` page, mirroring selectors from the legacy Cypress suite
in ``labware-library/cypress/support``.
"""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import Locator, Page, expect

from automation.base_page import BasePage


class LabwareCreator(BasePage):
    """Page object for the Labware Creator wizard."""

    #: Timeout (ms) for validation assertions that depend on React re-renders.
    EXPECT_TIMEOUT = 10_000

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

    def _fill_and_tab(self, name: str, value: str) -> None:
        """Fill an input by name and dispatch blur to trigger validation.

        Uses ``click()`` to ensure focus, ``fill()`` to set the value
        (which already clears the field), and ``blur()`` to trigger
        React/Formik ``onBlur`` handlers without shifting focus to the
        next field.
        """
        field = self._input(name)
        field.click()
        field.fill(value)
        field.blur()

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

    def _click_radio_by_name_value(self, name: str, value: str) -> None:
        """Click a radio input by its HTML name and value attributes.

        More robust than ``_click_radio_in_group`` because it does not
        depend on question text that varies across labware types.
        """
        radio = self._radio(name, value)
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
        """Check the regularity radio button (Yes / No).

        Works for all labware types (tubes, wells, reservoirs) because
        it locates the radio by its HTML name+value attributes.
        """
        val = "true" if value else "false"
        self._click_radio_by_name_value("homogeneousWells", val)

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
        self._fill_and_tab("footprintXDimension", value)

    def set_footprint_y(self, value: str) -> None:
        """Fill the footprint Y dimension."""
        self._fill_and_tab("footprintYDimension", value)

    # ------------------------------------------------------------------
    # Height
    # ------------------------------------------------------------------

    def set_height(self, value: str) -> None:
        """Fill the labware Z dimension (height) field."""
        self._fill_and_tab("labwareZDimension", value)

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
        self._fill_and_tab("gridRows", value)

    def set_grid_columns(self, value: str) -> None:
        """Fill the grid columns field."""
        self._fill_and_tab("gridColumns", value)

    def set_regular_row_spacing(self, value: bool) -> None:
        """Check regular row spacing radio."""
        val = "true" if value else "false"
        self._click_radio_by_name_value("regularRowSpacing", val)

    def set_regular_column_spacing(self, value: bool) -> None:
        """Check regular column spacing radio."""
        val = "true" if value else "false"
        self._click_radio_by_name_value("regularColumnSpacing", val)

    # ------------------------------------------------------------------
    # Volume
    # ------------------------------------------------------------------

    def set_well_volume(self, value: str) -> None:
        """Fill the well volume field."""
        self._fill_and_tab("wellVolume", value)

    def focus_and_blur_volume(self) -> None:
        """Click then tab away from the volume input to trigger validation."""
        self._input("wellVolume").click()
        self.page.keyboard.press("Tab")

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
        """Select well shape: ``rectangular`` or ``circular``.

        Uses HTML name+value attributes, so works for all labware types.
        """
        self._click_radio_by_name_value("wellShape", shape)

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
        self._fill_and_tab("wellXDimension", value)

    def focus_and_blur_well_x(self) -> None:
        """Click then tab away from well X to trigger validation."""
        well_x = self._input("wellXDimension")
        expect(well_x).to_be_visible()
        well_x.click()
        self.page.keyboard.press("Tab")

    def set_well_y_dimension(self, value: str) -> None:
        """Fill the well Y dimension."""
        self._fill_and_tab("wellYDimension", value)

    def focus_and_blur_well_y(self) -> None:
        """Click then tab away from well Y to trigger validation."""
        well_y = self._input("wellYDimension")
        expect(well_y).to_be_visible()
        well_y.click()
        self.page.keyboard.press("Tab")

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
        self._fill_and_tab("wellDiameter", value)

    def focus_and_blur_diameter(self) -> None:
        """Click then tab away from diameter to trigger validation."""
        diameter = self._input("wellDiameter")
        expect(diameter).to_be_visible()
        diameter.click()
        self.page.keyboard.press("Tab")

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
        """Select well bottom shape: ``flat``, ``u``, or ``v``.

        Uses HTML name+value attributes, so works for all labware types.
        """
        self._click_radio_by_name_value("wellBottomShape", shape)

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
        self._fill_and_tab("wellDepth", value)

    def focus_and_blur_depth(self) -> None:
        """Click then tab away from depth to trigger validation."""
        self._input("wellDepth").click()
        self.page.keyboard.press("Tab")

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
        self._fill_and_tab("gridSpacingX", value)

    def set_grid_spacing_y(self, value: str) -> None:
        """Fill the grid spacing Y field."""
        self._fill_and_tab("gridSpacingY", value)

    def set_grid_offset_x(self, value: str) -> None:
        """Fill the grid offset X field."""
        self._fill_and_tab("gridOffsetX", value)

    def set_grid_offset_y(self, value: str) -> None:
        """Fill the grid offset Y field."""
        self._fill_and_tab("gridOffsetY", value)

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

    # ------------------------------------------------------------------
    # File import (drag-and-drop / upload)
    # ------------------------------------------------------------------

    def upload_labware_file(self, file_path: Path | str) -> None:
        """Upload a labware JSON file via the hidden file input.

        The Labware Creator has a drag-and-drop zone with a hidden
        ``<input type="file">``.  We set the file directly on that input.
        """
        file_input = self.page.locator('[class*="file_drop"] input[type="file"]')
        file_input.set_input_files(str(file_path))

    # ------------------------------------------------------------------
    # Input value assertions (for verifying pre-populated fields)
    # ------------------------------------------------------------------

    def expect_input_value(self, name: str, expected_value: str) -> None:
        """Assert that an input with the given name has the expected value."""
        expect(self._input(name)).to_have_value(expected_value)

    def expect_radio_checked(self, name: str, value: str) -> None:
        """Assert that a radio input with the given name+value is checked."""
        expect(self._radio(name, value)).to_be_checked()

    def expect_input_exists(self, name: str) -> None:
        """Assert that an input with the given name exists on the page."""
        expect(self._input(name)).to_be_attached()

    # ------------------------------------------------------------------
    # Footprint error messages
    # ------------------------------------------------------------------

    def expect_footprint_too_large_error(self, *, visible: bool = True) -> None:
        """Assert the 'too large to fit in a single slot' error."""
        msg = self.page.get_by_text("Your labware is too large to fit in a single slot properly.").first
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def expect_footprint_too_small_error(self, *, visible: bool = True) -> None:
        """Assert the 'too small to fit in a slot' error."""
        msg = self.page.get_by_text("Your labware is too small to fit in a slot properly.").first
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Grid required-field errors + focus/blur helpers
    # ------------------------------------------------------------------

    def focus_and_blur_rows(self) -> None:
        """Click then tab away from grid rows to trigger validation."""
        self._input("gridRows").click()
        self.page.keyboard.press("Tab")

    def expect_rows_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Number of rows is a required field' error."""
        msg = self.page.get_by_text("Number of rows is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def focus_and_blur_columns(self) -> None:
        """Click then tab away from grid columns to trigger validation."""
        self._input("gridColumns").click()
        self.page.keyboard.press("Tab")

    def expect_columns_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Number of columns is a required field' error."""
        msg = self.page.get_by_text("Number of columns is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def expect_row_spacing_radio_not_visible(self) -> None:
        """Assert the row-spacing radio is not rendered (e.g. 1-row reservoir)."""
        expect(self._radio("regularRowSpacing", "false")).to_have_count(0)

    # ------------------------------------------------------------------
    # Grid spacing / offset required-field errors + focus/blur helpers
    # ------------------------------------------------------------------

    def focus_and_blur_grid_spacing_x(self) -> None:
        """Click then tab away from grid spacing X to trigger validation."""
        self._input("gridSpacingX").click()
        self.page.keyboard.press("Tab")

    def expect_x_spacing_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'X Spacing (Xs) is a required field' error."""
        msg = self.page.get_by_text("X Spacing (Xs) is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def focus_and_blur_grid_spacing_y(self) -> None:
        """Click then tab away from grid spacing Y to trigger validation."""
        self._input("gridSpacingY").click()
        self.page.keyboard.press("Tab")

    def expect_y_spacing_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Y Spacing (Ys) is a required field' error."""
        msg = self.page.get_by_text("Y Spacing (Ys) is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def focus_and_blur_grid_offset_x(self) -> None:
        """Click then tab away from grid offset X to trigger validation."""
        self._input("gridOffsetX").click()
        self.page.keyboard.press("Tab")

    def expect_x_offset_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'X Offset (Xo) is a required field' error."""
        msg = self.page.get_by_text("X Offset (Xo) is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def focus_and_blur_grid_offset_y(self) -> None:
        """Click then tab away from grid offset Y to trigger validation."""
        self._input("gridOffsetY").click()
        self.page.keyboard.press("Tab")

    def expect_y_offset_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Y Offset (Yo) is a required field' error."""
        msg = self.page.get_by_text("Y Offset (Yo) is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Well X / Y required-field errors (for non-tube labware)
    # ------------------------------------------------------------------

    def expect_well_x_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Well X is a required field' error."""
        msg = self.page.get_by_text("Well X is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def expect_well_y_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Well Y is a required field' error."""
        msg = self.page.get_by_text("Well Y is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Brand (simple — non custom-tube-rack labware)
    # ------------------------------------------------------------------

    def expect_simple_brand_required_error(self, *, visible: bool = True) -> None:
        """Assert the simple 'Brand is a required field' error.

        Used for well plates, reservoirs, aluminum blocks — labware
        types that have a single brand field instead of separate
        rack-brand and tube-brand fields.
        """
        msg = self.page.get_by_text("Brand is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def expect_brand_not_required(self) -> None:
        """Assert that no brand-required error is shown at all.

        Used for Opentrons tube racks where the brand is pre-filled.
        """
        expect(self.page.get_by_text("Brand is a required field")).to_have_count(0)

    def set_brand_id(self, value: str) -> None:
        """Fill the brand ID field."""
        self._input("brandId").fill(value)

    # ------------------------------------------------------------------
    # Aluminum block dropdowns
    # ------------------------------------------------------------------

    def select_aluminum_block(self, label: str) -> None:
        """Open the 'Which aluminum block?' dropdown and pick *label*."""
        self._open_dropdown("Which aluminum block?")
        self._pick_option(label)

    def select_block_top_labware(self, label: str) -> None:
        """Open the 'What labware is on top…' dropdown and pick *label*."""
        self._open_dropdown("What labware is on top of your aluminum block?")
        self._pick_option(label)

    def expect_block_top_labware_not_visible(self) -> None:
        """Assert the 'What labware is on top…' dropdown is not shown."""
        expect(self.page.get_by_text("What labware is on top of your aluminum block?")).to_have_count(0)

    # ------------------------------------------------------------------
    # Tip rack – Hand-Placed Tip Fit
    # ------------------------------------------------------------------

    def select_tip_fit(self, option: str) -> None:
        """Select a tip-fit option (e.g. 'Loose' or 'Snug') via the combobox."""
        combo = self.page.locator("#HandPlacedTipFit").get_by_role("combobox")
        combo.click()
        combo.fill(option)
        self.page.get_by_text(option, exact=True).click()

    def focus_and_blur_tip_fit(self) -> None:
        """Click then click away from the tip-fit dropdown to trigger validation."""
        combo = self.page.locator("#HandPlacedTipFit").get_by_role("combobox")
        combo.click()
        # Click a paragraph inside the section to blur
        self.page.locator("#HandPlacedTipFit p").first.click()

    def expect_tip_fit_required_error(self, *, visible: bool = True) -> None:
        """Assert the 'Fit is a required field' error."""
        msg = self.page.get_by_text("Fit is a required field")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def expect_loose_fit_warning(self) -> None:
        """Assert the loose-fit warning message is shown."""
        expect(
            self.page.get_by_text(
                "If your tip does not fit when placed by hand then it is not "
                "a good candidate for this pipette on the OT-2."
            )
        ).to_be_visible()

    def expect_snug_fit_message(self) -> None:
        """Assert the snug-fit guidance message is shown."""
        expect(
            self.page.get_by_text("If your tip seems to fit when placed by hand it may work on the OT-2.")
        ).to_be_visible()

    # ------------------------------------------------------------------
    # Tip rack – default fit value
    # ------------------------------------------------------------------

    def expect_tip_fit_empty(self) -> None:
        """Assert the tip-fit input has no value selected (empty)."""
        expect(self.page.locator("#HandPlacedTipFit input").first).to_have_value("")

    # ------------------------------------------------------------------
    # Section assertions (by DOM section ID)
    # ------------------------------------------------------------------

    def expect_section_heading(self, section_id: str, heading: str) -> None:
        """Assert that a section contains an h2 with the given text."""
        expect(self.page.locator(f"#{section_id} h2").get_by_text(heading)).to_be_visible()

    def expect_section_paragraph(self, section_id: str, text: str) -> None:
        """Assert that a section contains a paragraph with the given text."""
        expect(self.page.locator(f"#{section_id}").get_by_text(text)).to_be_visible()

    def expect_image(self, alt_text: str) -> None:
        """Assert an image with the given alt text is visible."""
        expect(self.page.locator(f'img[alt="{alt_text}"]')).to_be_visible()

    # ------------------------------------------------------------------
    # Display name / load name (File section)
    # ------------------------------------------------------------------

    def set_display_name(self, value: str) -> None:
        """Fill the display name input."""
        self._input("displayName").fill(value)

    def set_load_name(self, value: str) -> None:
        """Fill the load name input."""
        self._input("loadName").fill(value)

    # ------------------------------------------------------------------
    # Grid-too-large warnings (CheckYourWork section)
    # ------------------------------------------------------------------

    def expect_grid_too_large_x_error(self, *, visible: bool = True) -> None:
        """Assert the 'Grid of tips is larger… in the X dimension' error."""
        msg = self.page.get_by_text("larger than labware footprint in the X dimension")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    def expect_grid_too_large_y_error(self, *, visible: bool = True) -> None:
        """Assert the 'Grid of tips is larger… in the Y dimension' error."""
        msg = self.page.get_by_text("larger than labware footprint in the Y dimension")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()

    # ------------------------------------------------------------------
    # Well plate specific
    # ------------------------------------------------------------------

    def expect_well_check_warning(self, *, visible: bool = True) -> None:
        """Assert the 'double-check well size, Y Spacing, and Y Offset' text."""
        msg = self.page.get_by_text("Please double-check well size, Y Spacing, and Y Offset.")
        if visible:
            expect(msg).to_be_visible()
        else:
            expect(msg).not_to_be_visible()
