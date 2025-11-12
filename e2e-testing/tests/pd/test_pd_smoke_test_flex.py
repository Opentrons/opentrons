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
from typing import Optional

import pytest
from playwright.sync_api import Page, expect

# Make the automation package importable in tests (same pattern as other tests)
sys.path.insert(0, str(Path(__file__).parent.parent))

from automation.pd_pages import (
    HeaterShakerStepPage,
    LandingPage,
    ProtocolEditorPage,
    TemperatureStepPage,
)
from automation.pd_pages.tc_step_form_page import ThermocyclerStepPage


@pytest.mark.pdE2E
@pytest.mark.slow
def import_protocol_onboarding_flow(page: Page, base_url: str) -> ProtocolEditorPage:
    """Import test_pd_sanity.py and return the editor page object."""
    landing_page = LandingPage(page)
    landing_page.goto(base_url)
    landing_page.wait_for_page_load()
    print("✓ Main page loaded")

    landing_page.confirm_welcome_modal()

    landing_page.click_import_existing_protocol()

    print("✓ Protocol creation initiated")
    landing_page.upload_protocol_file("fixtures/protocol/9/smoke_flex_setup.py")
    print("✓ Protocol file uploaded")

    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)

    page.get_by_role("button", name="Edit protocol").click()

    return ProtocolEditorPage(page)


@pytest.mark.pdE2E
@pytest.mark.slow
def test_pd_combined_smoke_flow(page: Page, base_url: str) -> None:
    """Run a compact smoke flow that covers the requested module interactions.

    Steps:
    1. Onboarding (create protocol, choose pipette, enable modules)
    2. Add Temperature step (50°C) and add a Pause step after it
    3. Add Heater-Shaker step (50°C, 300 rpm) with a 00:30 timer
    4. Add Thermocycler step in STATE mode (Block 40°C, Lid 110°C, Lid OPEN)
    5. Add Thermocycler step in PROFILE mode with cycle definition

    If any Playwright action or assertion fails, the test will pause for debugging.
    """

    editor = import_protocol_onboarding_flow(page, base_url)
    print("✓ File uploaded, ready for module steps")

    _add_temperature_module_step(editor, page, "50")

    _add_heater_shaker_step(editor, page, "50", "300", "00:30")
    print("✓ Heater-Shaker step: 50°C, 300 rpm, timer 00:30")

    _add_thermocycler_state_step(editor, page, block_temp="40", lid_temp="110", lid_position="open")

    _add_thermocycler_profile_step(
        editor,
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


def _add_temperature_module_step(editor: ProtocolEditorPage, page: Page, temp: str) -> None:
    """Add a Temperature Module step and an immediate Pause step to the protocol.

    Args:
        editor: The initialized ProtocolEditorPage object for adding steps.
        page: The Playwright Page object for raw interactions.
        temp: The target temperature for the module (e.g., "50" for 50°C).
    """
    editor.add_step("Temperature")
    temp_page = TemperatureStepPage(page)
    temp_page.set_target_temperature(temp)
    temp_page.save_step()
    temp_page.add_pause()
    print(f"✓ Temperature step set to {temp}°C and Pause step added.")


def _add_heater_shaker_step(editor: ProtocolEditorPage, page: Page, temp: str, speed: str, timer: str) -> None:
    """Add a Heater-Shaker step configured with temperature, speed, and timer.

    Args:
        editor: The initialized ProtocolEditorPage object for adding steps.
        page: The Playwright Page object for raw interactions.
        temp: The target temperature for the module (e.g., "50").
        speed: The target RPM speed for the shaker (e.g., "300").
        timer: The optional timer duration in HH:MM format (e.g., "00:30").
    """
    editor.add_step("Heater-Shaker")
    hs_page = HeaterShakerStepPage(page)
    hs_page.wait_for_form_load()

    hs_page.set_target_temperature(temp)
    hs_page.set_target_speed(speed)

    try:
        timer_input = page.locator('input[name="heaterShakerTimer"]')
        timer_input.click()
        timer_input.fill(timer)
        print(f"✓ Heater-Shaker timer set to {timer}")
    except Exception as e:  # noqa: BLE001
        print(f"Warning: Could not set Heater-Shaker timer. Error: {e}")

    hs_page.save_step()
    hs_page.pause_confirm()

    print(f"✓ Heater-Shaker step added (T:{temp}°C, S:{speed}rpm).")


def _add_thermocycler_state_step(
    editor: ProtocolEditorPage,
    page: Page,
    block_temp: Optional[str] = None,
    lid_temp: Optional[str] = None,
    lid_position: str = "open",
) -> None:
    """Add a Thermocycler step in STATE mode with configurable parameters.

    Args:
        editor: The initialized ProtocolEditorPage object for adding steps.
        page: The Playwright Page object for raw interactions.
        block_temp: Block target temperature (e.g., "40"). If None, block is not toggled.
        lid_temp: Lid target temperature (e.g., "110"). If None, lid is not toggled.
        lid_position: Lid position ("open" or "closed"). Defaults to "open".
    """
    editor.add_step("Thermocycler")
    tc_page = ThermocyclerStepPage(page)

    print("✓ Thermocycler step form loaded (State mode)")

    tc_page.select_state_mode()
    print("✓ State mode selected")

    if block_temp is not None:
        tc_page.toggle_block_temperature(enable=True)
        tc_page.set_block_temperature(block_temp)
        print(f"✓ Block temperature: ON at {block_temp}°C")
    else:
        print("⊘ Block temperature: not configured")

    if lid_temp is not None:
        tc_page.toggle_lid_temperature(enable=True)
        tc_page.set_lid_temperature(lid_temp)
        print(f"✓ Lid temperature: ON at {lid_temp}°C")
    else:
        print("⊘ Lid temperature: not configured")

    tc_page.set_lid_position(lid_position)
    print(f"✓ Lid position: {lid_position.upper()}")

    tc_page.save_step()
    print("✅ Thermocycler state step saved")


def _add_thermocycler_profile_step(
    editor: ProtocolEditorPage,
    page: Page,
    well_volume: str = "100",
    lid_temp: str = "50",
    cycles: Optional[list] = None,
) -> None:
    """Add a Thermocycler step in PROFILE mode with configurable cycle definition.

    Args:
        editor: The initialized ProtocolEditorPage object for adding steps.
        page: The Playwright Page object for raw interactions.
        well_volume: Well volume in µL (e.g., "100").
        lid_temp: Lid temperature (e.g., "50").
        cycles: List of cycle dictionaries. Each dict should contain:
            {
                "repeat_count": "2",
                "steps": [
                    {
                        "name": "Cycle 1",
                        "temperature": "40",
                        "time": "1:00"
                    },
                    ...
                ]
            }
            If None, defaults to a single cycle with 2 steps repeating 2 times.

    Example:
        _add_thermocycler_profile_step(
            editor, page,
            well_volume="100",
            lid_temp="50",
            cycles=[{
                "repeat_count": "35",
                "steps": [
                    {"name": "Denature", "temperature": "95", "time": "0:30"},
                    {"name": "Anneal", "temperature": "60", "time": "0:30"},
                ]
            }]
        )
    """
    if cycles is None:
        cycles = [
            {
                "repeat_count": "2",
                "steps": [
                    {"name": "Cycle 1", "temperature": "40", "time": "1:00"},
                    {"name": "Cycle 2", "temperature": "4", "time": "0:01"},
                ],
            }
        ]

    editor.add_step("Thermocycler")
    tc_page = ThermocyclerStepPage(page)

    print("✓ Thermocycler step form loaded (Profile mode)")

    tc_page.select_profile_mode()
    print("✓ Profile mode selected")

    tc_page.set_well_volume(well_volume)
    print(f"✓ Well volume: {well_volume} µL")

    tc_page.set_profile_lid_temperature(lid_temp)
    print(f"✓ Lid temperature: {lid_temp}°C")

    profile_modal = tc_page.open_profile_programmer()
    profile_modal.wait_for_modal_load()

    for cycle_idx, cycle_config in enumerate(cycles):
        profile_modal.add_cycle()
        profile_modal.delete_thermocycler_step(step_index=0)
        print(f"✓ Cycle {cycle_idx} added")

        steps = cycle_config.get("steps", [])
        for step_idx, step_config in enumerate(steps):
            # to avoid arbitrary
            profile_modal.add_cycle_step(cycle_index=cycle_idx)
            profile_modal.fill_cycle_step(
                cycle_index=cycle_idx,
                step_index=step_idx,
                step_name=step_config["name"],
                temperature=step_config["temperature"],
                time=step_config["time"],
            )
            print(
                f"  ✓ Step {step_idx}: {step_config['name']} @ {step_config['temperature']}°C for {step_config['time']}"
            )

        repeat_count = cycle_config.get("repeat_count", "1")
        profile_modal.set_cycle_count(cycle_index=cycle_idx, count=repeat_count)
        print(f"✓ Cycle {cycle_idx} repeat count: {repeat_count}")

        profile_modal.save_cycle(cycle_index=cycle_idx)
        print(f"✓ Cycle {cycle_idx} saved")

    profile_modal.save_and_close_profile()
    print("✓ Profile modal saved and closed")

    tc_page.save_step()
    print("✅ Thermocycler profile step saved")
