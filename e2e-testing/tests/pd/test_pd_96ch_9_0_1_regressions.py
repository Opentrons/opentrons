"""Thin 96ch regression for PD 9.0.1 NEST 8 reservoir x-axis centering (AUTH-3066).

96ch ALL/COLUMN cannot use NEST 8 row-trough reservoirs; only ROW is valid
(see shared-data wellSets canPipetteUseLabware). AUTH-3066 centers the 12-tip
row on each trough in X.
"""

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage, Timeline, TransferPage
from automation.pd_pages.transfer_form import TransferStepConfig, add_transfer_step
from utility import assert_export_downloads_clean_protocol, import_protocol_and_open_editor

_ROW: TransferPage.NozzleConfig = "Single row of nozzles"
PROTOCOL_PATH = "fixtures/protocol/9/96_channel_setup.py"
PLATE_96 = "NEST 96 Deep Well Plate 2 mL"
RESERVOIR_8 = "NEST 8 Well Reservoir 22 mL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
_TIPRACK_1000_B3 = "B3 Opentrons Flex 96 Filter Tip Rack 1000 µL"
_TIPRACK_1000_SAFE_SLOT = "B2"


def _move_1000ul_tiprack_away_from_stacker(editor: ProtocolEditorPage) -> None:
    print("96ch partial - move 1000uL tiprack from B3 to B2")
    editor.add_step("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")
    editor.move_labware(_TIPRACK_1000_B3, _TIPRACK_1000_SAFE_SLOT)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96ch_nest_8_reservoir_row_transfer(page: Page, pd_exports_dir: Path) -> None:
    """AUTH-3066: 96ch row transfer on NEST 8 Well Reservoir 22 mL (x-axis centering)."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    editor.add_labware_to_slot("C2")
    editor.select_labware_category_by_name("Reservoirs")
    editor.select_labware_by_name(RESERVOIR_8)

    _move_1000ul_tiprack_away_from_stacker(editor)

    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=RESERVOIR_8,
            dest_labware=PLATE_96,
            source_wells="A1",
            dest_wells="A1",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Waste Chute",
            nozzle_config=_ROW,
            primary_nozzle="A1",
        ),
    )

    timeline = Timeline(page)
    timeline.wait_for_timeline_steps(min_steps=2)
    timeline.expect_no_known_regression_errors()
    timeline.select_transfer_steps_sample([1], expect_no_errors=True)
    assert_export_downloads_clean_protocol(
        page,
        editor,
        pd_exports_dir,
        filename="96ch_nest_8_reservoir_row.py",
    )
