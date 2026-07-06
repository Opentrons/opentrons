"""E2E tests for 8-channel partial/single tip pickup and multi-transfer workflows."""

"""
TODO:
For 8ch/1ch, you’re more likely under-covered: manual tip tracking (called out TODO), waste chute, additional partial counts/primaries, and manual tracking on 8ch partial.
Also, I think you can only do 1ch “consolidate” steps, so that’s 1 less type of step.
We can also do a more comprehensive 8ch/1ch test by adding some 8ch partial steps.

"""

from typing import List

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import ProtocolEditorPage, TransferPage, TransferStepConfig, add_transfer_step
from utility import import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/single_eight_partial_tip_setup.py"

PLATE_384 = "Corning 384 Well Plate 112 µL Flat"
TEMP_24 = "Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap"
TC_96 = "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt"
PIPETTE_8CH = "Flex 8-Channel 1000 µL"
PIPETTE_1CH = "Flex 1-Channel 50 µL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_20 = "Opentrons Flex 96 Filter Tip Rack 20 µL"

TEMP_24_WELLS: List[str] = [f"{row}{col}" for col in range(1, 7) for row in "ABCD"]


@pytest.mark.pdE2E
@pytest.mark.slow
def test_pd_single_eight_partial_tip_workflow(page: Page) -> None:
    """Exercise single-nozzle distribute, partial 5/8 transfer, and 1ch TC↔temp transfers."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    print("8ch single-nozzle distribute from 384 plate to all 24 temp-deck tubes")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_8CH,
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=TEMP_24,
            source_wells="A1",
            dest_wells=TEMP_24_WELLS,
            path="Distribute",
            volume="30",
            change_tip="Once",
            nozzle_config="Single nozzle",
        ),
    )

    print("8ch partial 5/8 nozzles from 384 column 23 to TC 96-well column 1")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_8CH,
            tip_rack=TIPRACK_1000,
            source_labware=PLATE_384,
            dest_labware=TC_96,
            source_wells="H23",
            dest_wells="H1",
            path="Single transfer",
            volume="30",
            change_tip="Once",
            nozzle_config="Partial nozzles",
            partial_count=5,
        ),
    )

    print("1ch distribute TC → temp 24")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TC_96,
            dest_labware=TEMP_24,
            source_wells="A1",
            dest_wells=["A1", "A2", "A3"],
            path="Distribute",
            volume="20",
            change_tip="Always",
        ),
    )

    print("1ch consolidate temp 24 → TC")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TEMP_24,
            dest_labware=TC_96,
            source_wells=["B1", "B2"],
            dest_wells="B1",
            path="Consolidate",
            volume="10",
            change_tip="Once",
        ),
    )

    print("1ch single transfer TC → temp with manual tip tracking")
    print("todo: add manual tip tracking")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TC_96,
            dest_labware=TEMP_24,
            source_wells="C1",
            dest_wells="C1",
            path="Single transfer",
            volume="20",
            change_tip="Once",
        ),
    )
    print("1ch single transfer temp → TC reusing tip from previous")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            pipette=PIPETTE_1CH,
            tip_rack=TIPRACK_20,
            source_labware=TEMP_24,
            dest_labware=TC_96,
            source_wells="D1",
            dest_wells="D1",
            path="Single transfer",
            volume="20",
            change_tip="Never",
        ),
    )

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)
