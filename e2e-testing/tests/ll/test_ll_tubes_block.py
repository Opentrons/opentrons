"""Aluminum block creation tests for the Labware Creator.

Ported from legacy Cypress test:
    labware-library/cypress/e2e/labware-creator/tubesBlock.cy.js

Covers 96-well (Tubes, PCR Tube Strip, PCR Plate) and 24-well aluminum
block configurations.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.ll_pages import LabwareCreator

LABWARE_FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "labware"
EXPECTED_24_WELL = LABWARE_FIXTURES / "testpro_24_aluminumblock_10ul.json"


def _setup_96_well_tubes(creator: LabwareCreator, ll_base_url: str) -> None:
    """Navigate and select 96-well Tubes aluminum block."""
    creator.navigate(ll_base_url)
    creator.select_labware_type("Tubes / Plates + Opentrons Aluminum Block")
    creator.select_aluminum_block("96 well")
    creator.select_block_top_labware("Tubes")
    creator.click_start_creating()


def _test_well_shapes_circular(creator: LabwareCreator) -> None:
    """Test circular well shape inputs."""
    creator.select_well_shape("circular")
    creator.expect_well_dimension_inputs(diameter=True, x_y=False)
    creator.focus_and_blur_diameter()
    creator.expect_diameter_required_error(visible=True)
    creator.set_well_diameter("10")
    creator.expect_diameter_required_error(visible=False)


def _test_well_shapes_rectangular_tube(creator: LabwareCreator) -> None:
    """Test rectangular well shape inputs with 'Tube X/Y' errors."""
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


def _test_well_shapes_rectangular_well(creator: LabwareCreator) -> None:
    """Test rectangular well shape inputs with 'Well X/Y' errors."""
    creator.select_well_shape("rectangular")
    creator.expect_well_dimension_inputs(diameter=False, x_y=True)
    creator.focus_and_blur_well_x()
    creator.expect_well_x_required_error(visible=True)
    creator.set_well_x_dimension("10")
    creator.expect_well_x_required_error(visible=False)
    creator.focus_and_blur_well_y()
    creator.expect_well_y_required_error(visible=True)
    creator.set_well_y_dimension("10")
    creator.expect_well_y_required_error(visible=False)


def _test_well_bottom_shapes(creator: LabwareCreator) -> None:
    """Test well bottom shape images and depth validation."""
    creator.select_well_bottom_shape("flat")
    creator.expect_well_bottom_image(flat=True, round=False, v=False)
    creator.select_well_bottom_shape("u")
    creator.expect_well_bottom_image(flat=False, round=True, v=False)
    creator.select_well_bottom_shape("v")
    creator.expect_well_bottom_image(flat=False, round=False, v=True)
    creator.focus_and_blur_depth()
    creator.expect_depth_required_error(visible=True)
    creator.set_well_depth("10")
    creator.expect_depth_required_error(visible=False)


def _test_regularity(creator: LabwareCreator) -> None:
    """Test regularity radio buttons."""
    creator.set_homogeneous_wells(False)
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_homogeneous_wells(True)
    creator.expect_incompatible_labware_error(visible=False)


def _test_height(creator: LabwareCreator) -> None:
    """Test height validation."""
    creator.set_height("150")
    creator.expect_too_tall_warning(visible=True)
    creator.set_height("200")
    creator.expect_incompatible_labware_error(visible=True)
    creator.set_height("75")
    creator.expect_too_tall_warning(visible=False)
    creator.expect_incompatible_labware_error(visible=False)


def _test_volume(creator: LabwareCreator) -> None:
    """Test volume validation."""
    creator.focus_and_blur_volume()
    creator.expect_volume_required_error(visible=True)
    creator.set_well_volume("10")
    creator.expect_volume_required_error(visible=False)


def _test_export_with_brand_96(creator: LabwareCreator, page: Page) -> None:
    """Test export flow for 96-well block (no file comparison)."""
    creator.click_export_button()
    creator.expect_export_validation_error(visible=True)
    creator.close_export_error_modal()

    creator.expect_simple_brand_required_error(visible=True)
    creator.set_brand("TestPro")
    creator.expect_simple_brand_required_error(visible=False)
    creator.set_brand_id("001")

    creator.expect_display_name_placeholder("TestPro 96 Aluminum Block 10 µL")
    creator.expect_filename_placeholder("testpro_96_aluminumblock_10ul")

    creator.click_export_button()
    creator.expect_export_validation_error(visible=False)


# =====================================================================
# 96-well Tubes
# =====================================================================


@pytest.mark.llE2E
def test_ll_96_block_tubes_circular_wells(page: Page, ll_base_url: str) -> None:
    """Test circular wells for 96-well aluminum block with tubes."""
    creator = LabwareCreator(page)
    _setup_96_well_tubes(creator, ll_base_url)
    _test_well_shapes_circular(creator)


@pytest.mark.llE2E
def test_ll_96_block_tubes_full_form(page: Page, ll_base_url: str) -> None:
    """Full form and export test for 96-well aluminum block with tubes."""
    creator = LabwareCreator(page)
    _setup_96_well_tubes(creator, ll_base_url)

    creator.expect_missing_info_message(visible=True)

    _test_regularity(creator)
    _test_height(creator)
    _test_volume(creator)

    # Rectangular wells (Tube X/Y errors)
    _test_well_shapes_rectangular_tube(creator)

    # Well bottom and depth
    _test_well_bottom_shapes(creator)

    creator.expect_missing_info_message(visible=False)

    # Export
    _test_export_with_brand_96(creator, page)


# =====================================================================
# 96-well PCR Tube Strip
# =====================================================================


@pytest.mark.llE2E
def test_ll_96_block_pcr_strip_full_form(page: Page, ll_base_url: str) -> None:
    """Full form and export test for 96-well block with PCR Tube Strip.

    Note: The PCR Tube Strip test in Cypress shares the 96-well Tubes
    beforeEach setup.  The product renders the same form for both.
    """
    creator = LabwareCreator(page)
    _setup_96_well_tubes(creator, ll_base_url)

    creator.expect_missing_info_message(visible=True)

    _test_regularity(creator)
    _test_height(creator)
    _test_volume(creator)

    # Circular wells
    _test_well_shapes_circular(creator)

    # Rectangular wells (Tube X/Y errors)
    _test_well_shapes_rectangular_tube(creator)

    # Well bottom and depth
    _test_well_bottom_shapes(creator)

    creator.expect_missing_info_message(visible=False)

    # Export
    _test_export_with_brand_96(creator, page)


# =====================================================================
# 96-well PCR Plate
# =====================================================================


@pytest.mark.llE2E
def test_ll_96_block_pcr_plate_full_form(page: Page, ll_base_url: str) -> None:
    """Full form and export test for 96-well block with PCR Plate."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)
    creator.select_labware_type("Tubes / Plates + Opentrons Aluminum Block")
    creator.select_aluminum_block("96 well")
    creator.select_block_top_labware("PCR Plate")
    creator.click_start_creating()

    creator.expect_missing_info_message(visible=True)

    _test_regularity(creator)
    _test_height(creator)
    _test_volume(creator)

    # Circular wells
    _test_well_shapes_circular(creator)

    # Rectangular wells (Well X/Y errors for PCR Plate)
    _test_well_shapes_rectangular_well(creator)

    # Well bottom and depth
    _test_well_bottom_shapes(creator)

    creator.expect_missing_info_message(visible=False)

    # Export
    _test_export_with_brand_96(creator, page)


# =====================================================================
# 24-well Tubes (with file comparison)
# =====================================================================


@pytest.mark.llE2E
def test_ll_24_block_tubes_full_form(page: Page, ll_base_url: str) -> None:
    """Full form and export test for 24-well aluminum block with tubes."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)
    creator.select_labware_type("Tubes / Plates + Opentrons Aluminum Block")
    creator.select_aluminum_block("24 well")

    # 24-well block should NOT show the 'top labware' dropdown
    creator.expect_block_top_labware_not_visible()

    creator.click_start_creating()

    _test_regularity(creator)
    _test_height(creator)
    _test_volume(creator)

    # Circular wells
    _test_well_shapes_circular(creator)

    # Rectangular wells (Well X/Y errors for 24-well)
    _test_well_shapes_rectangular_well(creator)

    # Well bottom and depth
    _test_well_bottom_shapes(creator)

    creator.expect_missing_info_message(visible=False)

    # Export
    creator.click_export_button()
    creator.expect_export_validation_error(visible=True)
    creator.close_export_error_modal()

    creator.expect_simple_brand_required_error(visible=True)
    creator.set_brand("TestPro")
    creator.expect_simple_brand_required_error(visible=False)
    creator.set_brand_id("001")

    creator.expect_display_name_placeholder("TestPro 24 Aluminum Block 10 µL")
    creator.expect_filename_placeholder("testpro_24_aluminumblock_10ul")

    creator.click_export_button()
    creator.expect_export_validation_error(visible=False)

    # Download and verify
    with page.expect_download() as download_info:
        creator.click_export_file()
    download = download_info.value
    downloaded_path = download.path()
    assert downloaded_path is not None, "Download did not produce a file"

    actual = json.loads(Path(downloaded_path).read_text(encoding="utf-8"))
    expected = json.loads(EXPECTED_24_WELL.read_text(encoding="utf-8"))
    assert actual == expected, "Exported labware definition does not match expected fixture"
