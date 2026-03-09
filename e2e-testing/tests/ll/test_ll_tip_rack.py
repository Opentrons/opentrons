"""Tip rack creation test for the Labware Creator.

Ported from legacy Cypress test:
    labware-library/cypress/e2e/labware-creator/tipRack.cy.js
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.ll_pages import LabwareCreator

LABWARE_FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "labware"
EXPECTED_FIXTURE = LABWARE_FIXTURES / "generic_1_tiprack_20ul.json"


@pytest.mark.llE2E
def test_ll_create_tip_rack(page: Page, ll_base_url: str) -> None:
    """Create a tip rack and verify the exported definition."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)

    # -- Select labware type --
    creator.select_labware_type("Tip Rack")
    creator.click_start_creating()

    # -- Custom Tip Rack Warning --
    creator.expect_section_paragraph(
        "CustomTiprackWarning",
        "Opentrons tip racks are recommended for use with the OT-2 and Flex",
    )
    creator.expect_section_paragraph(
        "CustomTiprackWarning",
        "Third party tips can fit, but not necessarily with a tight seal.",
    )

    # -- Hand-Placed Tip Fit --
    creator.expect_section_heading("HandPlacedTipFit", "Hand-Placed Tip Fit")
    creator.expect_section_paragraph(
        "HandPlacedTipFit",
        "Place the tip on the pipette you wish to use it on.",
    )
    creator.expect_section_paragraph(
        "HandPlacedTipFit",
        "Note that fit may vary between Single and 8 Channel pipettes",
    )

    # Default fit is empty
    creator.expect_tip_fit_empty()

    # Verify fit is required
    creator.focus_and_blur_tip_fit()
    creator.expect_tip_fit_required_error(visible=True)

    # Loose fit
    creator.select_tip_fit("Loose")
    creator.expect_loose_fit_warning()

    # Snug fit
    creator.select_tip_fit("Snug")
    creator.expect_snug_fit_message()

    # -- Total Footprint --
    creator.expect_section_heading("Footprint", "Total Footprint")
    creator.expect_section_paragraph(
        "Footprint",
        "If your Tip Rack has an adapter, place it in the adapter.",
    )
    creator.expect_image("labware footprint")

    # Enter valid footprint
    creator.set_footprint_x("127")
    creator.set_footprint_y("85")

    # Too small footprint X
    creator.set_footprint_x("20")
    creator.expect_footprint_too_small_error(visible=True)

    # Too large footprint X
    creator.set_footprint_x("2000")
    creator.expect_footprint_too_large_error(visible=True)

    # Too small footprint Y
    creator.set_footprint_y("20")
    creator.expect_footprint_too_small_error(visible=True)

    # Too large footprint Y
    creator.set_footprint_y("2000")
    creator.expect_footprint_too_large_error(visible=True)

    # Reset to valid
    creator.set_footprint_x("127")
    creator.set_footprint_y("85")

    # -- Total Height --
    creator.expect_section_heading("Height", "Total Height")
    creator.expect_section_paragraph(
        "Height",
        "Include the adapter and tops of the pipette tips in the measurement.",
    )
    creator.expect_image("plate or reservoir height")
    creator.set_height("24")

    # -- Tip Length --
    creator.expect_section_heading("WellBottomAndDepth", "Tip Length")
    creator.expect_section_paragraph(
        "WellBottomAndDepth",
        "Reference the top of the tip to the bottom of the tip.",
    )
    creator.expect_image("tip length")
    creator.set_well_depth("12")

    # -- Grid --
    creator.expect_section_heading("Grid", "Grid")
    creator.expect_image("grid rows and columns")
    creator.set_grid_rows("5")
    creator.set_regular_row_spacing(True)
    creator.set_grid_columns("5")
    creator.set_regular_column_spacing(True)

    # -- Volume --
    creator.expect_section_heading("Volume", "Volume")
    creator.expect_section_paragraph(
        "Volume",
        "Total maximum volume of each tip.",
    )
    creator.set_well_volume("20")

    # -- Tip Diameter --
    creator.expect_section_heading("TipDiameter", "Tip Diameter")
    creator.expect_section_paragraph(
        "TipDiameter",
        "Reference the inside of the tip.",
    )
    creator.expect_image("circular well diameter")
    creator.set_well_diameter("10")

    # -- Tip Spacing --
    creator.expect_section_heading("WellSpacing", "Tip Spacing")
    creator.expect_section_paragraph(
        "WellSpacing",
        "Spacing is between the center of tips.",
    )
    creator.expect_image("circular well spacing")
    creator.set_grid_spacing_x("15")
    creator.set_grid_spacing_y("15")

    # -- Grid Offset --
    creator.expect_section_heading("GridOffset", "Grid Offset")
    creator.expect_image("tip grid offset")
    creator.expect_image("circular well offset")
    creator.set_grid_offset_x("10")
    creator.set_grid_offset_y("10")

    # -- Description --
    creator.expect_section_heading("Description", "Description")
    creator.set_brand("Brand Chalu")
    creator.set_brand_id("abcd12345!@#$%,efghij6789^&*()")

    # -- File --
    creator.expect_section_heading("File", "File")
    creator.set_display_name("Brand Chalu 1 Tip Rack 20ul")
    creator.set_load_name("generic_1_tiprack_20ul")

    # -- Export and verify --
    creator.click_export_file()

    with page.expect_download() as download_info:
        creator.click_export_file()
    download = download_info.value
    downloaded_path = download.path()
    assert downloaded_path is not None, "Download did not produce a file"

    actual = json.loads(Path(downloaded_path).read_text(encoding="utf-8"))
    expected = json.loads(EXPECTED_FIXTURE.read_text(encoding="utf-8"))
    assert actual == expected, "Exported labware definition does not match expected fixture"

    # -- Grid-too-large warnings --
    creator.set_grid_offset_y("24")
    creator.expect_grid_too_large_y_error(visible=True)

    creator.set_grid_offset_x("240")
    creator.expect_grid_too_large_x_error(visible=True)
