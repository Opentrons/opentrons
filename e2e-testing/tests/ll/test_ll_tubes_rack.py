"""Opentrons tube rack creation tests for the Labware Creator.

Ported from legacy Cypress test:
    labware-library/cypress/e2e/labware-creator/tubesRack.cy.js

Each test creates an Opentrons tube rack of a different size (6, 15, 24)
and verifies that the brand field is NOT required (pre-filled).
"""

from __future__ import annotations

import pytest
from playwright.sync_api import Page

from automation.ll_pages import LabwareCreator


def _fill_common_tube_rack_form(creator: LabwareCreator) -> None:
    """Fill the form fields shared across all Opentrons tube rack sizes."""
    creator.expect_missing_info_message(visible=True)

    # Regularity
    creator.set_homogeneous_wells(False)
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_homogeneous_wells(True)
    creator.expect_incompatible_labware_error(visible=False)

    # Height
    creator.set_height("150")
    creator.expect_too_tall_warning(visible=True)
    creator.set_height("200")
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_height("75")
    creator.expect_too_tall_warning(visible=False)
    creator.expect_incompatible_labware_error(visible=False)

    # Volume
    creator.focus_and_blur_volume()
    creator.expect_volume_required_error(visible=True)
    creator.set_well_volume("10")
    creator.expect_volume_required_error(visible=False)

    # Circular wells
    creator.select_well_shape("circular")
    creator.expect_well_dimension_inputs(diameter=True, x_y=False)
    creator.focus_and_blur_diameter()
    creator.expect_diameter_required_error(visible=True)
    creator.set_well_diameter("10")
    creator.expect_diameter_required_error(visible=False)

    # Rectangular wells
    creator.select_well_shape("rectangular")
    creator.expect_well_dimension_inputs(diameter=False, x_y=True)
    creator.focus_and_blur_well_x()
    creator.expect_tube_x_required_error(visible=True)
    creator.set_well_x_dimension("10")
    creator.expect_tube_x_required_error(visible=False)
    creator.focus_and_blur_well_y()
    creator.expect_tube_y_required_error(visible=True)
    creator.set_well_y_dimension("10")
    creator.expect_tube_y_required_error(visible=False)

    # Well bottom shape
    creator.select_well_bottom_shape("flat")
    creator.expect_well_bottom_image(flat=True, round=False, v=False)
    creator.select_well_bottom_shape("u")
    creator.expect_well_bottom_image(flat=False, round=True, v=False)
    creator.select_well_bottom_shape("v")
    creator.expect_well_bottom_image(flat=False, round=False, v=True)

    # Depth
    creator.focus_and_blur_depth()
    creator.expect_depth_required_error(visible=True)
    creator.set_well_depth("10")
    creator.expect_depth_required_error(visible=False)

    creator.expect_missing_info_message(visible=False)

    # Brand field should NOT be required for Opentrons tube racks
    creator.expect_brand_not_required()


@pytest.mark.llE2E
def test_ll_create_6_tube_rack(page: Page, ll_base_url: str) -> None:
    """Create an Opentrons 6-tube rack."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)

    creator.select_labware_type("Tubes + Tube Rack")
    creator.select_tube_rack("Opentrons 6 tubes")
    creator.click_start_creating()

    _fill_common_tube_rack_form(creator)

    # File info
    creator.expect_display_name_placeholder("Opentrons 6 Tube Rack with Generic 0.01 mL")
    creator.expect_filename_placeholder("opentrons_6_tuberack_10ul")

    # Export should succeed
    creator.click_export_button()
    creator.expect_export_validation_error(visible=False)


@pytest.mark.llE2E
def test_ll_create_15_tube_rack(page: Page, ll_base_url: str) -> None:
    """Create an Opentrons 15-tube rack."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)

    creator.select_labware_type("Tubes + Tube Rack")
    creator.select_tube_rack("Opentrons 15 tubes")
    creator.click_start_creating()

    _fill_common_tube_rack_form(creator)

    # File info
    creator.expect_display_name_placeholder("Opentrons 15 Tube Rack with Generic 0.01 mL")
    creator.expect_filename_placeholder("opentrons_15_tuberack_10ul")

    # Export should succeed
    creator.click_export_button()
    creator.expect_export_validation_error(visible=False)


@pytest.mark.llE2E
def test_ll_create_24_tube_rack(page: Page, ll_base_url: str) -> None:
    """Create an Opentrons 24-tube rack."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)

    creator.select_labware_type("Tubes + Tube Rack")
    creator.select_tube_rack("Opentrons 24 tubes")
    creator.click_start_creating()

    _fill_common_tube_rack_form(creator)

    # File info
    creator.expect_display_name_placeholder("Opentrons 24 Tube Rack with Generic 0.01 mL")
    creator.expect_filename_placeholder("opentrons_24_tuberack_10ul")

    # Export should succeed
    creator.click_export_button()
    creator.expect_export_validation_error(visible=False)
