"""Test ability to drag and drop steps on the protocol editor."""

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage
from utility import import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/8/doItAllV8.json"


@pytest.mark.pdE2E
@pytest.mark.slow
def test_drag_drop_steps(page: Page, pd_base_url: str) -> None:
    editor = ProtocolEditorPage(page)

    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)

    editor = ProtocolEditorPage(page)

    ## Drag Transfer Step down the Step Form, from step 3 (index 2) to step 7 (becomes index 6)
    editor.drag_and_drop(2, 7)

    ## Drag Transfer Step down the Step Form, from step 7 (index 6) to step 10 (becomes index 9 )
    editor.drag_and_drop(6, 10)

    ## Drag Transfer Step up the Step Form, from step 10 (index 9) to index 2 (becomes step 3)
    editor.drag_and_drop(9, 2)

    ## Drag Move Labware Step up the Step Form, from step 11 (index 10) to index 6 (becomes step 7)
    editor.drag_and_drop(10, 6)

    ## Drag Move Labware Step down the Step Form, from step 7 (index 6) to step 11 (becomes step 10)
    editor.drag_and_drop(6, 11)
    editor.select_step(0, "Show Thermocycler Profile")
