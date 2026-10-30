"""Page object for Vacuum Module step configuration forms."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal, Optional, Sequence

from playwright.sync_api import Page, expect

from automation.base_page import BasePage

if TYPE_CHECKING:
    from automation.pd_pages.protocol_editor_page import ProtocolEditorPage

ProgramType = Literal["state", "profile"]
StateType = Literal["closed", "open", "pumpOn", "pumpOff"]
ModeType = Literal["pressure", "power"]


@dataclass(frozen=True)
class VacuumProfileStepConfig:
    """One step inside a vacuum profile cycle (or standalone profile step)."""

    title: str
    time: str
    pressure_mbar: str
    vent_after: bool = False


@dataclass(frozen=True)
class VacuumProfileCycleConfig:
    """A vacuum profile cycle with one or more nested steps."""

    steps: Sequence[VacuumProfileStepConfig]
    repetitions: str = "1"


class VacuumStepPage(BasePage):
    """Page object for configuring a Vacuum Module step."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self._save_button = self.page.get_by_role("button", name="Save", exact=True)

    def wait_for_form_load(self) -> None:
        """Wait for the Vacuum step form to be visible."""
        self.wait_for_visible(self.page.get_by_text("Module controls", exact=False).first)

    def select_option(self, label: str) -> None:
        """Select a radio / list option by its visible label text."""
        option = self.page.get_by_text(label, exact=False).first
        self.wait_for_visible(option)
        option.click()

    def confirm_mode_update_if_shown(self) -> None:
        """Confirm the vacuum mode-update warning modal when it appears."""
        confirm = self.page.get_by_role("button", name="Confirm", exact=True)
        try:
            confirm.first.wait_for(state="visible", timeout=1500)
            confirm.first.click()
        except Exception:
            pass

    def set_program_type(self, program_type: ProgramType) -> None:
        """Choose Change Vacuum state vs Program a Vacuum profile."""
        if program_type == "state":
            self.select_option("Change Vacuum state")
        else:
            self.select_option("Program a Vacuum profile")
            self.confirm_mode_update_if_shown()

    def set_state_type(self, state_type: StateType) -> None:
        """Choose the vacuum state change (vent / pump on / pump off)."""
        labels = {
            "closed": "Close vent",
            "open": "Open vent",
            "pumpOn": "Turn on Vacuum pump",
            "pumpOff": "Turn off Vacuum pump",
        }
        # When the pump is already on, the label becomes "Change vacuum pump settings".
        if state_type == "pumpOn":
            change = self.page.get_by_text("Change vacuum pump settings", exact=False)
            if change.count() > 0 and change.first.is_visible():
                change.first.click()
                self.confirm_mode_update_if_shown()
                return
        self.select_option(labels[state_type])
        self.confirm_mode_update_if_shown()

    def set_mode_type(self, mode_type: ModeType) -> None:
        """Choose gauge pressure vs pump power mode."""
        if mode_type == "pressure":
            self.select_option("Gauge pressure (mbar)")
        else:
            self.select_option("Pump power (%)")
        self.confirm_mode_update_if_shown()

    def set_pressure(self, pressure_mbar: str) -> None:
        """Fill the gauge pressure field (mbar)."""
        field = self.page.locator('input[name="pressureMbar"]')
        self.wait_for_visible(field)
        field.fill(pressure_mbar)

    def set_power(self, percent_power: int) -> None:
        """Set pump power via the range slider (1–100)."""
        slider = self.page.get_by_role("slider", name="Pump power")
        if slider.count() == 0:
            slider = self.page.locator('input[type="range"]').first
        self.wait_for_visible(slider.first)
        slider.first.fill(str(percent_power))

    def set_duration(self, time: str) -> None:
        """Enable duration and set the hold time (mm:ss)."""
        duration_header = self.page.get_by_text("Duration", exact=True).first
        self.wait_for_visible(duration_header)
        # Duration checkbox sits in the header row next to the title.
        check_button = duration_header.locator("xpath=..").locator("button").first
        check_button.click()
        time_field = self.page.locator('input[name="pumpDurationTime"]')
        self.wait_for_visible(time_field)
        time_field.fill(time)

    def set_ending_hold_vent(self, open_vent: bool) -> None:
        """Toggle ending-hold vent Open vs Closed when the control is visible."""
        ending_hold = self.page.get_by_text("Ending hold", exact=False)
        try:
            ending_hold.first.wait_for(state="visible", timeout=2000)
        except Exception:
            return
        vent_label = self.page.get_by_text("Vent", exact=True).last
        row = vent_label.locator("xpath=ancestor::*[1]")
        label_text = row.inner_text()
        currently_open = "Open" in label_text and "Closed" not in label_text
        if currently_open != open_vent:
            vent_label.click()

    def open_profile_modal(self) -> None:
        """Open the vacuum profile editor modal."""
        trigger = self.page.get_by_text("No profile defined", exact=False)
        if trigger.count() == 0:
            trigger = self.page.get_by_text("profile step", exact=False)
        self.wait_for_visible(trigger.first)
        trigger.first.click()
        self.wait_for_visible(self.page.get_by_text("Edit Vacuum profile steps", exact=False).first)

    def add_profile_cycle(self) -> None:
        """Click Add cycle in the profile modal."""
        self.page.get_by_text("Add cycle", exact=True).click()

    def add_cycle_step(self) -> None:
        """Add a nested step inside the current presaved cycle."""
        self.page.get_by_text("Add a cycle step", exact=False).click()

    def _fill_visible_profile_step(
        self,
        *,
        title: str,
        time: str,
        pressure_mbar: str,
        vent_after: bool,
    ) -> None:
        """Fill the currently visible presaved profile step fields."""
        modal = self.page.get_by_label("ModalShell_ModalArea")
        name_title = modal.get_by_text("Name", exact=True).last
        name_title.locator("xpath=following::input[1]").fill(title)

        pressure_title = modal.get_by_text("Gauge pressure", exact=False).last
        pressure_title.locator("xpath=following::input[1]").fill(pressure_mbar)

        time_title = modal.get_by_text("Time", exact=True).last
        time_title.locator("xpath=following::input[1]").fill(time)

        hold = modal.get_by_text("Ending hold", exact=False).last
        hold_text = hold.locator("xpath=..").inner_text()
        currently_open = "Open" in hold_text and "Closed" not in hold_text
        if currently_open != vent_after:
            modal.get_by_text("Vent", exact=True).last.click()

    def save_presaved_cycle(self) -> None:
        """Save the currently editing cycle via its header Save button."""
        modal = self.page.get_by_label("ModalShell_ModalArea")
        # Cycle header Save is a tertiary button labeled Save (not the modal footer).
        saves = modal.get_by_role("button", name="Save", exact=True)
        # Prefer the innermost/presaved header save (not the modal footer primary).
        if saves.count() > 1:
            saves.nth(0).click()
        else:
            saves.first.click()

    def save_profile_modal(self) -> None:
        """Save the profile modal and return to the vacuum step form."""
        modal = self.page.get_by_label("ModalShell_ModalArea")
        modal.get_by_role("button", name="Save", exact=True).last.click()
        expect(modal).to_have_count(0, timeout=10000)

    def configure_pressure_profile(
        self,
        cycles: Sequence[VacuumProfileCycleConfig],
        *,
        ending_hold_vent: bool = True,
    ) -> None:
        """Build a pressure-mode vacuum profile from cycle definitions."""
        self.set_program_type("profile")
        self.set_mode_type("pressure")
        self.open_profile_modal()

        for cycle in cycles:
            self.add_profile_cycle()
            for index, step in enumerate(cycle.steps):
                if index > 0:
                    self.add_cycle_step()
                self._fill_visible_profile_step(
                    title=step.title,
                    time=step.time,
                    pressure_mbar=step.pressure_mbar,
                    vent_after=step.vent_after,
                )
            # Set cycle repetitions if the field is present.
            reps = self.page.get_by_text("Number of cycles", exact=False)
            if reps.count() > 0:
                reps_input = reps.last.locator("xpath=following::input[1]")
                if reps_input.count() > 0:
                    reps_input.fill(cycle.repetitions)
            self.save_presaved_cycle()

        self.save_profile_modal()
        self.set_ending_hold_vent(ending_hold_vent)

    def save_step(self) -> None:
        """Save the vacuum step form."""
        self.wait_for_visible(self._save_button)
        self._save_button.click()
        # Optional success toast
        toast = self.page.get_by_text("has been saved", exact=False)
        try:
            expect(toast.first).to_be_visible(timeout=5000)
            toast.first.click(timeout=2000)
        except Exception:
            pass


def add_vacuum_close_vent(editor: ProtocolEditorPage, vacuum: VacuumStepPage) -> None:
    """Add a vacuum step that closes the vent."""
    editor.add_step("Vacuum")
    vacuum.wait_for_form_load()
    vacuum.set_program_type("state")
    vacuum.set_state_type("closed")
    vacuum.save_step()


def add_vacuum_open_vent(editor: ProtocolEditorPage, vacuum: VacuumStepPage) -> None:
    """Add a vacuum step that opens the vent."""
    editor.add_step("Vacuum")
    vacuum.wait_for_form_load()
    vacuum.set_program_type("state")
    vacuum.set_state_type("open")
    vacuum.save_step()


def add_vacuum_pump_off(editor: ProtocolEditorPage, vacuum: VacuumStepPage) -> None:
    """Add a vacuum step that turns the pump off."""
    editor.add_step("Vacuum")
    vacuum.wait_for_form_load()
    vacuum.set_program_type("state")
    vacuum.set_state_type("pumpOff")
    vacuum.save_step()


def add_vacuum_pressure_state(
    editor: ProtocolEditorPage,
    vacuum: VacuumStepPage,
    *,
    pressure_mbar: str,
    duration: Optional[str] = None,
    ending_hold_vent: Optional[bool] = None,
) -> None:
    """Add a vacuum state step in pressure mode, optionally timed."""
    editor.add_step("Vacuum")
    vacuum.wait_for_form_load()
    vacuum.set_program_type("state")
    vacuum.set_state_type("pumpOn")
    vacuum.set_mode_type("pressure")
    vacuum.set_pressure(pressure_mbar)
    if duration is not None:
        vacuum.set_duration(duration)
        if ending_hold_vent is not None:
            vacuum.set_ending_hold_vent(ending_hold_vent)
    vacuum.save_step()


def add_vacuum_power_state(
    editor: ProtocolEditorPage,
    vacuum: VacuumStepPage,
    *,
    percent_power: int,
    duration: Optional[str] = None,
    ending_hold_vent: Optional[bool] = None,
) -> None:
    """Add a vacuum state step in power mode, optionally timed."""
    editor.add_step("Vacuum")
    vacuum.wait_for_form_load()
    vacuum.set_program_type("state")
    vacuum.set_state_type("pumpOn")
    vacuum.set_mode_type("power")
    vacuum.set_power(percent_power)
    if duration is not None:
        vacuum.set_duration(duration)
        if ending_hold_vent is not None:
            vacuum.set_ending_hold_vent(ending_hold_vent)
    vacuum.save_step()


def add_vacuum_pressure_profile(
    editor: ProtocolEditorPage,
    vacuum: VacuumStepPage,
    cycles: Sequence[VacuumProfileCycleConfig],
    *,
    ending_hold_vent: bool = True,
) -> None:
    """Add a vacuum profile step in pressure mode."""
    editor.add_step("Vacuum")
    vacuum.wait_for_form_load()
    vacuum.configure_pressure_profile(cycles, ending_hold_vent=ending_hold_vent)
    vacuum.save_step()
