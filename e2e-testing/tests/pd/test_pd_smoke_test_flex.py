"""Combined smoke test: onboarding -> transfer -> temp -> pause -> heater-shaker -> thermocycler.

This test stitches together the common onboarding flow from `test_pd_sanity.py`
and exercises module step forms using page objects where available.

Notes:
- Uses page objects under `automation.pd_pages` for most interactions.
- For thermocycler profile programming and heater-shaker timer we use
  a few direct Playwright locators because the POM provides only basic helpers.
"""

import sys
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import ProtocolEditorPage
from automation.pd_pages.heater_shaker_step_form_page import _add_heater_shaker_step
from automation.pd_pages.tc_step_form_page import _add_thermocycler_profile_step, _add_thermocycler_state_step
from automation.pd_pages.tempdeck_step_form_page import _add_temperature_module_step
from utility import import_protocol_and_open_editor

# Make the automation package importable in tests (same pattern as other tests)
sys.path.insert(0, str(Path(__file__).parent.parent))

PROTOCOL_PATH = "fixtures/protocol/9/smoke_flex_setup.py"


@pytest.mark.pdE2E
@pytest.mark.slow
def test_pd_combined_smoke_flow(page: Page, pd_base_url: str) -> None:
    """Run a compact smoke flow that covers the requested module interactions.

    Steps:
    1. Onboarding (create protocol, choose pipette, enable modules)
    2. Add Temperature step (50°C) and add a Pause step after it
    3. Add Heater-Shaker step (50°C, 300 rpm) with a 00:30 timer
    4. Add Thermocycler step in STATE mode (Block 40°C, Lid 110°C, Lid OPEN)
    5. Add Thermocycler step in PROFILE mode with cycle definition

    If any Playwright action or assertion fails, the test will pause for debugging.
    """
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)

    editor = ProtocolEditorPage(page)
    print("✓ File uploaded, ready for module steps")
    editor.add_step("Temperature")
    _add_temperature_module_step(page, "50")
    editor.add_step("Heater-Shaker")
    _add_heater_shaker_step(page, "50", "300", "00:30")
    print("✓ Heater-Shaker step: 50°C, 300 rpm, timer 00:30")
    editor.add_step("Thermocycler")
    _add_thermocycler_state_step(page, block_temp="40", lid_temp="110", lid_position="open")
    editor.add_step("Thermocycler")
    _add_thermocycler_profile_step(
        page,
        well_volume="100",
        lid_temp="50",
        cycles=[
            {
                "repeat_count": "2",
                "steps": [
                    {"name": "Cycle 1", "temperature": "40", "time": "1:00"},
                    {"name": "Cycle 2", "temperature": "4", "time": "0:01"},
                ],
            }
        ],
    )

    expect(page.get_by_role("button", name="Export")).to_be_visible(timeout=10000)

    print("✅ Combined smoke flow completed successfully")
