"""Tests covering the transfer step workflow in Protocol Designer.

Ports `transferSettings.cy.ts` from the Cypress suite to Playwright.
"""

from __future__ import annotations

import pytest
from playwright.sync_api import Page

from automation.pd_pages import (
    ProtocolEditorPage,
    TransferPage,
)
from utility import _import_protocol_and_open_editor, troubleshoot_and_pause

SOURCE_LABWARE = "Opentrons Tough 300 mL 1 Well Reservoir"

@pytest.mark.pdE2E
@pytest.mark.slow
@troubleshoot_and_pause
def test_transfer_step_single_channel_workflow(page: Page, base_url: str) -> None:
    _import_protocol_and_open_editor(page, "fixtures/protocol/9/Liquid_Class_96_Channel_Test.py")
    """Replicate the Cypress transferSettings single-channel test using Playwright."""
    '''
    1. 1:1 Return tip  1000uL
    2. 1:2 Use 1000 
    3. 2:1 Use 200uL
    4. Partial tip 1:1, 1:2, 2:1
    '''
    editor = ProtocolEditorPage(page)
    editor.open_add_step_menu()
    editor.add_step()
    transfer_page = TransferPage(page)
    transfer_page.tip_rack_page_1_transfer_select()
    transfer_page.source_labware_select(SOURCE_LABWARE)
    transfer_page.destination_labware_select('Greiner 384 Well Plate 240 µL')
    transfer_page.wells_select('Destination', 'A1')
    page.pause()
