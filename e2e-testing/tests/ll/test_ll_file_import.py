"""File import test for the Labware Creator.

Ported from legacy Cypress test:
    labware-library/cypress/e2e/labware-creator/fileImport.cy.js
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.ll_pages import LabwareCreator

# Directory containing labware fixture files (e2e-testing/fixtures/labware/).
LABWARE_FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "labware"

# Labware definition to import into the creator.
IMPORT_FIXTURE = LABWARE_FIXTURES / "TestLabwareDefinition.json"

# Expected export after re-exporting the imported definition.
EXPECTED_EXPORT_FIXTURE = LABWARE_FIXTURES / "testpro_15_wellplate_5ul.json"


@pytest.mark.llE2E
def test_file_import_flow(page: Page, ll_base_url: str) -> None:
    """Import a labware file, verify pre-populated fields, and re-export."""
    creator = LabwareCreator(page)
    creator.navigate(ll_base_url)

    # -- Upload labware file --
    creator.upload_labware_file(IMPORT_FIXTURE)

    # -- Preview should be visible (all fields populated) --
    creator.expect_missing_info_message(visible=False)

    # -- Verify regularity --
    creator.expect_radio_checked("homogeneousWells", "true")

    # -- Verify footprint --
    creator.expect_input_value("footprintXDimension", "127")
    creator.expect_input_value("footprintYDimension", "85")

    # -- Verify height --
    creator.expect_input_value("labwareZDimension", "5")

    # -- Verify grid --
    creator.expect_input_value("gridRows", "3")
    creator.expect_radio_checked("regularRowSpacing", "true")
    creator.expect_input_value("gridColumns", "5")
    creator.expect_radio_checked("regularColumnSpacing", "true")

    # -- Verify volume --
    creator.expect_input_value("wellVolume", "5")

    # -- Verify well shape --
    creator.expect_radio_checked("wellShape", "circular")
    creator.expect_input_value("wellDiameter", "5")

    # -- Verify well bottom and depth --
    creator.expect_radio_checked("wellBottomShape", "flat")
    creator.expect_well_bottom_image(flat=True, round=False, v=False)
    creator.expect_input_value("wellDepth", "5")

    # -- Verify grid spacing --
    creator.expect_input_value("gridSpacingX", "25")
    creator.expect_input_value("gridSpacingY", "25")

    # -- Verify grid offset --
    creator.expect_input_value("gridOffsetX", "10")
    creator.expect_input_value("gridOffsetY", "10")

    # -- Verify brand info --
    creator.expect_input_value("brand", "TestPro")
    creator.expect_input_value("brandId", "001")

    # -- Verify file info --
    creator.expect_display_name_placeholder("TestPro 15 Well Plate 5 µL")
    creator.expect_filename_placeholder("testpro_15_wellplate_5ul")

    # -- Export should succeed without validation errors --
    creator.click_export_button()
    creator.expect_export_validation_error(visible=False)

    # -- Download and verify exported file --
    with page.expect_download() as download_info:
        creator.click_export_file()
    download = download_info.value
    downloaded_path = download.path()
    assert downloaded_path is not None, "Download did not produce a file"

    actual = json.loads(Path(downloaded_path).read_text(encoding="utf-8"))
    expected = json.loads(EXPECTED_EXPORT_FIXTURE.read_text(encoding="utf-8"))

    assert actual == expected, "Exported labware definition does not match expected fixture"
