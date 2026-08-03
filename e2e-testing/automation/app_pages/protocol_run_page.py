"""Page object for the protocol run header actions."""

from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from automation.app_pages.app_base_page import AppBasePage


class ProtocolRunPage(AppBasePage):
    """Wait for analysis and start a protocol run from the run header."""

    ANALYZING_ON_ROBOT = "Analyzing on robot"
    START_RUN = "Start run"
    PAUSE_RUN = "Pause run"
    GO_BACK = "Go back"
    PROCEED_TO_RUN = "Proceed to run"
    PROCEED_TO_RUN_MODAL = "Are you sure you want to proceed to run?"
    MODAL_SHELL = "ModalShell_ModalArea"
    DEFAULT_ANALYSIS_TIMEOUT_MS = 360_000

    def __init__(self, page: Page) -> None:
        """Bind the Playwright page."""
        super().__init__(page)

    def analyzing_button(self) -> Locator:
        """Run header button while protocol analysis is in progress."""
        return self.page.get_by_role("button", name=self.ANALYZING_ON_ROBOT)

    def start_run_button(self) -> Locator:
        """Run header Start run (only one exists before the missing-steps modal)."""
        return self.page.get_by_role("button", name=self.START_RUN)

    def pause_run_button(self) -> Locator:
        """Run header Pause run button (visible once the run is active)."""
        return self.page.get_by_role("button", name=self.PAUSE_RUN)

    def missing_steps_modal(self) -> Locator:
        """ConfirmMissingStepsModal via ModalShell aria-label + title text."""
        return (
            self.page.get_by_label(self.MODAL_SHELL)
            .filter(has_text=self.PROCEED_TO_RUN_MODAL)
            .filter(has=self.page.get_by_role("button", name=self.GO_BACK))
        )

    def missing_steps_start_run_button(self) -> Locator:
        """Modal Start run (scoped to ModalShell, next to Go back)."""
        return self.missing_steps_modal().get_by_role("button", name=self.START_RUN)

    def wait_until_analysis_complete(
        self,
        *,
        timeout_ms: int = DEFAULT_ANALYSIS_TIMEOUT_MS,
    ) -> None:
        """Wait until analysis finishes and Start run is available."""
        analyzing = self.analyzing_button()
        if analyzing.count() > 0:
            expect(analyzing.first).to_be_hidden(timeout=timeout_ms)
        expect(self.start_run_button()).to_be_visible(timeout=timeout_ms)

    def confirm_post_start_run_modals(self) -> None:
        """Confirm missing-steps / heater-shaker modals until the run is active."""
        missing_steps = self.missing_steps_modal()
        hs_proceed = self.page.get_by_role("button", name=self.PROCEED_TO_RUN)
        pause = self.pause_run_button()

        expect(missing_steps.or_(hs_proceed).or_(pause)).to_be_visible(timeout=30_000)

        if missing_steps.count() > 0 and missing_steps.is_visible():
            confirm = self.missing_steps_start_run_button()
            expect(confirm).to_be_visible()
            confirm.click()
            expect(missing_steps).to_be_hidden(timeout=15_000)
            expect(hs_proceed.or_(pause)).to_be_visible(timeout=30_000)

        if hs_proceed.count() > 0 and hs_proceed.is_visible():
            hs_proceed.click()
            expect(hs_proceed).to_be_hidden(timeout=15_000)

    def click_start_run(self) -> None:
        """Click header Start run, confirm any proceed modal, and wait until active."""
        self.dismiss_warning_toast()
        # Header is the only "Start run" until ConfirmMissingStepsModal opens.
        button = self.start_run_button()
        expect(button).to_be_visible(timeout=60_000)
        button.click()
        self.confirm_post_start_run_modals()
        expect(self.pause_run_button()).to_be_visible(timeout=60_000)
