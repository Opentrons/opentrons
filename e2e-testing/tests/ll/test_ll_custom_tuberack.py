"""Custom tube rack creation test for the Labware Creator.

Ported from legacy Cypress test:
    labware-library/cypress/e2e/labware-creator/customTubeRack.cy.js
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.ll_pages import LabwareCreator

# Directory containing labware fixture files (e2e-testing/fixtures/labware/).
LABWARE_FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "labware"

# Expected export for the custom tube rack.
EXPECTED_FIXTURE = LABWARE_FIXTURES / "somerackbrand_24_tuberack_1500ul.json"


@pytest.mark.llE2E
def test_ll_create_custom_6x4_tuberack(page: Page, ll_base_url: str) -> None:
    """Create a custom 6×4 tube rack and verify the exported definition."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)

    # -- Select labware type: Tubes + Tube Rack --
    creator.select_labware_type("Tubes + Tube Rack")
    creator.select_tube_rack("Non-Opentrons tube rack")
    creator.click_start_creating()

    # -- No preview image yet --
    creator.expect_missing_info_message(visible=True)

    # -- Regularity --
    creator.set_homogeneous_wells(False)
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_homogeneous_wells(True)
    creator.expect_incompatible_labware_error(visible=False)

    # -- Footprint --
    creator.set_footprint_x("128")
    creator.set_footprint_y("86")

    # -- Height --
    creator.set_height("150")
    creator.expect_too_tall_warning(visible=True)
    creator.set_height("200")
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_height("120")
    creator.expect_too_tall_warning(visible=False)
    creator.expect_incompatible_labware_error(visible=False)

    # -- Grid --
    creator.set_grid_rows("6")
    creator.set_grid_columns("4")
    creator.set_regular_row_spacing(True)
    creator.set_regular_column_spacing(True)

    # -- Volume --
    creator.focus_and_blur_volume()
    creator.expect_volume_required_error(visible=True)
    creator.set_well_volume("1500")
    creator.expect_volume_required_error(visible=False)

    # -- Rectangular wells --
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

    # -- Circular wells --
    creator.select_well_shape("circular")
    creator.expect_well_dimension_inputs(diameter=True, x_y=False)

    creator.focus_and_blur_diameter()
    creator.expect_diameter_required_error(visible=True)
    creator.set_well_diameter("12")
    creator.expect_diameter_required_error(visible=False)

    # -- Well bottom shape --
    # Flat
    creator.select_well_bottom_shape("flat")
    creator.expect_well_bottom_image(flat=True, round=False, v=False)

    # U-shaped
    creator.select_well_bottom_shape("u")
    creator.expect_well_bottom_image(flat=False, round=True, v=False)

    # V-shaped
    creator.select_well_bottom_shape("v")
    creator.expect_well_bottom_image(flat=False, round=False, v=True)

    # Depth
    creator.focus_and_blur_depth()
    creator.expect_depth_required_error(visible=True)
    creator.set_well_depth("100")
    creator.expect_depth_required_error(visible=False)

    # -- Offset / spacing --
    creator.set_grid_spacing_x("18")
    creator.set_grid_spacing_y("14")
    creator.set_grid_offset_x("15")
    creator.set_grid_offset_y("8")

    # -- Preview should now be visible --
    creator.expect_missing_info_message(visible=False)

    # -- Export with missing fields --
    creator.click_export_button()
    creator.expect_export_validation_error(visible=True)
    creator.close_export_error_modal()

    # Brand field should be shown for custom tube rack
    creator.expect_brand_required_error(visible=True)
    creator.set_brand("somerackbrand")
    creator.set_group_brand("sometubebrand")

    # -- File info --
    creator.expect_display_name_placeholder("somerackbrand 24 Tube Rack with sometubebrand 1.5 mL")
    creator.expect_filename_placeholder("somerackbrand_24_tuberack_1500ul")

    # -- Download and verify exported file --
    with page.expect_download() as download_info:
        creator.click_export_file()
    download = download_info.value
    downloaded_path = download.path()
    assert downloaded_path is not None, "Download did not produce a file"

    actual = json.loads(Path(downloaded_path).read_text(encoding="utf-8"))
    expected = json.loads(EXPECTED_FIXTURE.read_text(encoding="utf-8"))

    assert actual == expected, "Exported labware definition does not match expected fixture"
