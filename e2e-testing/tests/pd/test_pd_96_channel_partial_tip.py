"""E2E tests for 96-channel partial/single tip pickup and full-rack transfer workflows."""

from typing import List, Optional

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import ProtocolEditorPage, TransferPage, TransferStepConfig, add_transfer_step
from utility import import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/96_channel_setup.py"

PLATE_384 = "Applied Biosystems MicroAmp 384 Well Plate 40 µL"
PLATE_96 = "NEST 96 Deep Well Plate 2 mL"
PIPETTE_96CH = "Flex 96-Channel 1000 µL"
TIPRACK_1000 = "Opentrons Flex 96 Filter Tip Rack 1000 µL"
TIPRACK_200 = "Opentrons Flex 96 Filter Tip Rack 200 µL"

ROW_NOZZLE_TIPS: List[str] = [f"A{col}" for col in range(1, 13)]
COLUMN_NOZZLE_TIPS: List[str] = [f"{row}1" for row in "ABCDEFGH"]


def _wells_for_partial_384(
    nozzle_config: TransferPage.NozzleConfig,
    primary_nozzle: str,
) -> tuple[str, str]:
    """Return source/dest wells reachable for a 96ch partial layout on a 384-well plate."""
    if nozzle_config == "Single column of nozzles":
        if primary_nozzle == "A12":
            return "A24", "B24"
        return "A1", "B1"
    if nozzle_config == "Single row of nozzles":
        if primary_nozzle == "H1":
            return "P1", "P3"
        return "A1", "A3"
    single_quadrant_wells = {
        "A1": ("A1", "C1"),
        "A12": ("A1", "C1"),
        "H1": ("P1", "P3"),
        "H12": ("P24", "P22"),
    }
    return single_quadrant_wells.get(primary_nozzle, ("A1", "C1"))


def _partial_384_config(
    *,
    nozzle_config: TransferPage.NozzleConfig,
    primary_nozzle: str,
    change_tip: str,
    drop_location: str = "Tip rack",
    tip_tracking: TransferPage.TipTrackingMode = "Automatic tip tracking (recommended)",
    manual_tips: Optional[List[str]] = None,
) -> TransferStepConfig:
    """Build a partial-pickup transfer step on the 384-well plate using the 1000µL rack."""
    source_well, dest_well = _wells_for_partial_384(nozzle_config, primary_nozzle)
    return TransferStepConfig(
        tip_rack=TIPRACK_1000,
        source_labware=PLATE_384,
        dest_labware=PLATE_384,
        source_wells=source_well,
        dest_wells=dest_well,
        path="Single transfer",
        volume="30",
        change_tip=change_tip,
        drop_location=drop_location,
        tip_tracking=tip_tracking,
        manual_tips=manual_tips,
        nozzle_config=nozzle_config,
        primary_nozzle=primary_nozzle,
    )


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(600)
def test_pd_96_channel_single_and_row_partial_tip(page: Page) -> None:
    """Exercise 96ch single-quadrant and row partial tip pickups with varied tip strategies."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    print("96ch single A1 quadrant — Always")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single nozzle",
            primary_nozzle="A1",
            change_tip="Always",
            manual_tips=["H12"],
        ),
    )

    print("96ch single A12 quadrant — return tip")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single nozzle",
            primary_nozzle="A12",
            change_tip="Once",
            drop_location="Tip rack",
        ),
    )

    print("96ch single H1 quadrant — Once")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single nozzle",
            primary_nozzle="H1",
            change_tip="Once",
        ),
    )

    print("96ch single H12 quadrant — manual tip tracking")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single nozzle",
            primary_nozzle="H12",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
            manual_tips=["H12"],
        ),
    )

    print("96ch top row (A1) — Always")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            change_tip="Always",
        ),
    )

    print("96ch bottom row (H1) — return tip")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            change_tip="Once",
            drop_location="Tip rack",
        ),
    )

    print("96ch top row (A1) — Once")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single row of nozzles",
            primary_nozzle="A1",
            change_tip="Once",
        ),
    )

    print("96ch bottom row (H1) — manual tip tracking")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single row of nozzles",
            primary_nozzle="H1",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
            manual_tips=ROW_NOZZLE_TIPS,
        ),
    )

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(450)
def test_pd_96_channel_column_and_full_tip(page: Page) -> None:
    """Exercise 96ch column partial tip pickups and one full-rack 200µL transfer."""
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)

    print("96ch left column (A1) — Always")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            change_tip="Always",
        ),
    )

    print("96ch right column (A12) — return tip")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single column of nozzles",
            primary_nozzle="A12",
            change_tip="Once",
            drop_location="Tip rack",
        ),
    )

    print("96ch left column (A1) — Once")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single column of nozzles",
            primary_nozzle="A1",
            change_tip="Once",
        ),
    )

    print("96ch right column (A12) — manual tip tracking")
    add_transfer_step(
        editor,
        transfer,
        _partial_384_config(
            nozzle_config="Single column of nozzles",
            primary_nozzle="A12",
            change_tip="Once",
            tip_tracking="Manual tip tracking",
            manual_tips=COLUMN_NOZZLE_TIPS,
        ),
    )

    print("96ch full-rack transfer — 200µL tip rack, NEST 96 → NEST 96")
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=PLATE_96,
            dest_labware=PLATE_96,
            source_wells="A1",
            dest_wells="B1",
            path="Single transfer",
            volume="50",
            change_tip="Once",
            drop_location="Tip rack",
            nozzle_config="All nozzles (recommended)",
        ),
    )

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)
