"""PD 9.0.1 regressions for 96ch Flex protocols.

AUTH-3066: 96ch ALL/COLUMN cannot use NEST 8 row-trough reservoirs; only ROW is
valid (see shared-data wellSets canPipetteUseLabware). Centers the 12-tip row on
each trough in X.

AUTH-3067 / AUTH-3069: Flex 20 µL filter tip racks are compatible with the Flex
Stacker in Protocol Designer.

Fixture: fixtures/protocol/9/96_channel_9_0_1_regressions_setup.py (p200_96)
  - C2 NEST 8 Well Reservoir 22 mL
  - C1 mag block + NEST 96 Deep Well
  - B2 20 µL filter tip rack
  - B3 20 µL unfiltered tip rack
  - A4 stacker with 20 µL filter tip rack
  - A2 384 plate
  - D1 free for gripper moves off the shuttle
"""

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage
from automation.pd_pages.flex_stacker import FlexStackerPage
from automation.pd_pages.transfer_form import TransferStepConfig, add_transfer_step
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

_ROW: TransferPage.NozzleConfig = "Single row of nozzles"
PROTOCOL_PATH = "fixtures/protocol/9/96_channel_9_0_1_regressions_setup.py"
PLATE_96 = "NEST 96 Deep Well Plate 2 mL"
RESERVOIR_8 = "NEST 8 Well Reservoir 22 mL"
TIPRACK_20_FILTER = "Opentrons Flex 96 Filter Tip Rack 20 µL"
TIPRACK_20 = "Opentrons Flex 96 Tip Rack 20 µL"
_STACKER_A4 = "A4 Flex Stacker"
_TIPRACK_20_FILTER_ON_SHUTTLE = "A4 Opentrons Flex 96 Filter Tip Rack 20 µL (1)"
_TIPRACK_20_ON_B3 = "B3 Opentrons Flex 96 Tip Rack 20 µL"
_SAFE_SLOT_D1 = "D1"
_SAFE_SLOT_D2 = "D2"


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
@pytest.mark.parametrize(
    "tip_rack",
    [TIPRACK_20_FILTER, TIPRACK_20],
)
def test_pd_96ch_nest_8_reservoir_row_transfer(
    page: Page,
    pd_exports_dir: Path,
    tip_rack: str,
) -> None:
    """AUTH-3066: 96ch row transfer on NEST 8 with 20 µL filter and unfiltered tips."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=tip_rack,
            source_labware=RESERVOIR_8,
            dest_labware=PLATE_96,
            source_wells="A1",
            dest_wells="A1",
            path="Single transfer",
            volume="10",
            change_tip="Once",
            drop_location="Waste Chute",
            nozzle_config=_ROW,
            primary_nozzle="A1",
        ),
    )

    tip_suffix = "filter" if "Filter" in tip_rack else "unfiltered"
    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=1)
    timeline.expect_no_known_regression_errors()
    timeline.select_transfer_steps_sample([0], expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename=f"96ch_nest_8_reservoir_row_20ul_{tip_suffix}.py",
    )


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_20ul_filter_tiprack_flex_stacker_compatible(page: Page) -> None:
    """AUTH-3067/3069: 20 µL filter tip racks work with Flex Stacker retrieve + move."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    stacker = FlexStackerPage(page)

    # Filter tips are preloaded in the stacker — retrieve and gripper-move onto free D1.
    editor.add_step("Stacker")
    stacker.retrieve_stacker(_STACKER_A4)
    stacker.save_stacker_step()
    stacker.wait_for_save_banner_gone()
    editor.move_labware_with_gripper(_TIPRACK_20_FILTER_ON_SHUTTLE, _SAFE_SLOT_D1)

    # Unfiltered 20 µL tips start on B3 — gripper-move confirms they are valid deck labware.
    editor.move_labware_with_gripper(_TIPRACK_20_ON_B3, _SAFE_SLOT_D2)

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=3)
    timeline.expect_no_known_regression_errors()
