"""Well plate creation test for the Labware Creator.

Ported from legacy Cypress test:
    labware-library/cypress/e2e/labware-creator/wellPlate.cy.js
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.ll_pages import LabwareCreator

LABWARE_FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "labware"
EXPECTED_FIXTURE = LABWARE_FIXTURES / "testpro_80_wellplate_100ul.json"


@pytest.mark.llE2E
def test_ll_create_well_plate(page: Page, ll_base_url: str) -> None:
    """Create a well plate and verify the exported definition."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)

    # -- Select labware type --
    creator.select_labware_type("Well Plate")
    creator.click_start_creating()

    creator.expect_missing_info_message(visible=True)

    # -- Regularity --
    creator.set_homogeneous_wells(False)
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_homogeneous_wells(True)
    creator.expect_incompatible_labware_error(visible=False)

    # -- Footprint --
    creator.set_footprint_x("150")
    creator.expect_footprint_too_large_error(visible=True)
    creator.set_footprint_x("127")
    creator.expect_footprint_too_large_error(visible=False)

    creator.set_footprint_y("150")
    creator.expect_footprint_too_large_error(visible=True)
    creator.set_footprint_y("85")
    creator.expect_footprint_too_large_error(visible=False)

    # -- Height --
    creator.set_height("150")
    creator.expect_too_tall_warning(visible=True)
    creator.set_height("200")
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_height("75")
    creator.expect_too_tall_warning(visible=False)
    creator.expect_incompatible_labware_error(visible=False)

    # -- Grid rows --
    creator.focus_and_blur_rows()
    creator.expect_rows_required_error(visible=True)
    creator.set_grid_rows("8")
    creator.expect_rows_required_error(visible=False)

    # Row spacing
    creator.set_regular_row_spacing(False)
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_regular_row_spacing(True)

    # -- Grid columns --
    creator.focus_and_blur_columns()
    creator.expect_columns_required_error(visible=True)
    creator.set_grid_columns("10")
    creator.expect_columns_required_error(visible=False)

    # Column spacing
    creator.set_regular_column_spacing(False)
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_regular_column_spacing(True)
    creator.expect_incompatible_labware_error(visible=False)

    # -- Volume --
    creator.focus_and_blur_volume()
    creator.expect_volume_required_error(visible=True)
    creator.set_well_volume("100")
    creator.expect_volume_required_error(visible=False)

    # -- Circular wells --
    creator.select_well_shape("circular")
    creator.expect_well_dimension_inputs(diameter=True, x_y=False)
    creator.focus_and_blur_diameter()
    creator.expect_diameter_required_error(visible=True)
    creator.set_well_diameter("10")
    creator.expect_diameter_required_error(visible=False)

    # -- Rectangular wells --
    creator.select_well_shape("rectangular")
    creator.expect_well_dimension_inputs(diameter=False, x_y=True)
    creator.focus_and_blur_well_x()
    creator.expect_well_x_required_error(visible=True)
    creator.set_well_x_dimension("8")
    creator.expect_well_x_required_error(visible=False)
    creator.focus_and_blur_well_y()
    creator.expect_well_y_required_error(visible=True)
    creator.set_well_y_dimension("8")
    creator.expect_well_y_required_error(visible=False)

    # -- Well bottom shape --
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

    # -- Well spacing (X and Y for well plates) --
    creator.focus_and_blur_grid_spacing_x()
    creator.expect_x_spacing_required_error(visible=True)
    creator.set_grid_spacing_x("12")
    creator.expect_x_spacing_required_error(visible=False)

    creator.focus_and_blur_grid_spacing_y()
    creator.expect_y_spacing_required_error(visible=True)
    creator.set_grid_spacing_y("10")
    creator.expect_y_spacing_required_error(visible=False)

    # -- Grid offset --
    creator.focus_and_blur_grid_offset_x()
    creator.expect_x_offset_required_error(visible=True)
    creator.set_grid_offset_x("10")
    creator.expect_x_offset_required_error(visible=False)

    creator.focus_and_blur_grid_offset_y()
    creator.expect_y_offset_required_error(visible=True)
    creator.set_grid_offset_y("8")
    creator.expect_y_offset_required_error(visible=False)

    creator.expect_missing_info_message(visible=False)
    creator.expect_well_check_warning(visible=False)

    # -- Export with missing fields --
    creator.click_export_button()
    creator.expect_export_validation_error(visible=True)
    creator.close_export_error_modal()

    # Brand info
    creator.expect_simple_brand_required_error(visible=True)
    creator.set_brand("TestPro")
    creator.expect_simple_brand_required_error(visible=False)
    creator.set_brand_id("001")

    # File info placeholders
    creator.expect_display_name_placeholder("TestPro 80 Well Plate 100 µL")
    creator.expect_filename_placeholder("testpro_80_wellplate_100ul")

    # -- Export should succeed --
    creator.click_export_button()
    creator.expect_export_validation_error(visible=False)

    # -- Download and verify --
    with page.expect_download() as download_info:
        creator.click_export_file()
    download = download_info.value
    downloaded_path = download.path()
    assert downloaded_path is not None, "Download did not produce a file"

    actual = json.loads(Path(downloaded_path).read_text(encoding="utf-8"))
    expected = json.loads(EXPECTED_FIXTURE.read_text(encoding="utf-8"))
    assert actual == expected, "Exported labware definition does not match expected fixture"
