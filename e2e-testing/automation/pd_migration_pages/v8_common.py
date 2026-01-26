"""Shared migration actions for Protocol Designer 8.x UIs.

This module exists to avoid copy/paste across per-version migration action
modules when selectors and flows are identical.

Version-specific modules (e.g. v8_7_x.py, v8_8_x.py) should subclass
`MigrationActionsV8_Common` and override only what changes.
"""

from __future__ import annotations

import os
import time
from pathlib import Path

from playwright.sync_api import Download, Page, TimeoutError, expect

from .actions import ExportedProtocol
from .base_page import MigrationBasePage


class MigrationActionsV8_Common(MigrationBasePage):
    """Shared selectors and actions for PD 8.x migrations."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self._last_import_diagnostics: dict[str, int | bool] = {}
        self._last_export_diagnostics: dict[str, int | bool | str] = {}

    def get_last_import_diagnostics(self) -> dict[str, int | bool]:
        """Return diagnostics captured during the most recent import step."""

        return dict(self._last_import_diagnostics)

    def get_last_export_diagnostics(self) -> dict[str, int | bool | str]:
        """Return diagnostics captured during the most recent export step."""

        return dict(self._last_export_diagnostics)

    def _ui_timeout_ms(self) -> int:
        return int(os.environ.get("MIGRATION_REPORT_UI_TIMEOUT_MS", "3000"))

    def _download_timeout_ms(self) -> int:
        # Exports may be a bit slower than UI interactions, especially headless.
        return int(os.environ.get("MIGRATION_REPORT_DOWNLOAD_TIMEOUT_MS", "15000"))

    def _confirm_welcome_modal_if_present(self) -> None:
        confirm = self.page.get_by_role("button", name="Confirm")
        if confirm.count() > 0 and confirm.first.is_visible():
            confirm.first.click()
            overlay = self.page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
            if overlay.count() > 0:
                overlay.wait_for(state="hidden", timeout=10000)

        # Release-notes toast sometimes blocks clicks.
        toast = self.page.get_by_text("updated Protocol Designer", exact=False)
        if toast.count() > 0:
            close_icon = self.page.get_by_label("close_icon")
            if close_icon.count() > 0:
                close_icon.first.click()
            else:
                self.page.keyboard.press("Escape")

    def import_protocol_from_landing(self, protocol_path: Path) -> None:
        """Import a protocol fixture from the landing page."""

        self._last_import_diagnostics = {
            "migration_modal_shown": False,
            "migration_modal_wait_ms": 0,
            "migration_modal_click_ms": 0,
            "step_wait_landing_ready_ms": 0,
            "step_welcome_modal_ms": 0,
            "step_click_import_existing_ms": 0,
            "step_set_input_files_ms": 0,
            "step_wait_overlay_hidden_ms": 0,
        }

        step_start = time.perf_counter()

        expect(self.page.get_by_test_id("basic_button_Create new")).to_be_visible(timeout=self._ui_timeout_ms())
        self._last_import_diagnostics["step_wait_landing_ready_ms"] = int((time.perf_counter() - step_start) * 1000)

        step_start = time.perf_counter()
        self._confirm_welcome_modal_if_present()
        self._last_import_diagnostics["step_welcome_modal_ms"] = int((time.perf_counter() - step_start) * 1000)

        step_start = time.perf_counter()
        self.page.get_by_text("Import existing protocol").click()
        self._last_import_diagnostics["step_click_import_existing_ms"] = int((time.perf_counter() - step_start) * 1000)

        step_start = time.perf_counter()
        self.page.get_by_label("Import_from_landing").set_input_files(str(protocol_path))
        self._last_import_diagnostics["step_set_input_files_ms"] = int((time.perf_counter() - step_start) * 1000)

        # Migration modal may appear for older fixtures.
        # It can render slightly after file selection, so wait a short time for it.
        overlay = self.page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
        import_button = self.page.get_by_role("button", name="Import", exact=True)
        wait_start = time.perf_counter()
        try:
            import_button.wait_for(state="visible", timeout=self._ui_timeout_ms())
            self._last_import_diagnostics["migration_modal_wait_ms"] = int((time.perf_counter() - wait_start) * 1000)
            self._last_import_diagnostics["migration_modal_shown"] = True

            click_start = time.perf_counter()
            import_button.click()
            self._last_import_diagnostics["migration_modal_click_ms"] = int((time.perf_counter() - click_start) * 1000)
            try:
                overlay_hidden_start = time.perf_counter()
                overlay.wait_for(state="hidden", timeout=10000)
                self._last_import_diagnostics["step_wait_overlay_hidden_ms"] = int(
                    (time.perf_counter() - overlay_hidden_start) * 1000
                )
            except TimeoutError:
                pass

            if os.environ.get("MIGRATION_REPORT_LOG_MIGRATION_MODAL", "false").lower() == "true":
                print(
                    "[migration-modal] shown=%s wait_ms=%s click_ms=%s"
                    % (
                        self._last_import_diagnostics["migration_modal_shown"],
                        self._last_import_diagnostics["migration_modal_wait_ms"],
                        self._last_import_diagnostics["migration_modal_click_ms"],
                    )
                )
        except TimeoutError:
            self._last_import_diagnostics["migration_modal_wait_ms"] = int((time.perf_counter() - wait_start) * 1000)
            if os.environ.get("MIGRATION_REPORT_LOG_MIGRATION_MODAL", "false").lower() == "true":
                print(
                    "[migration-modal] shown=%s wait_ms=%s"
                    % (
                        self._last_import_diagnostics["migration_modal_shown"],
                        self._last_import_diagnostics["migration_modal_wait_ms"],
                    )
                )
            pass

    def wait_for_protocol_loaded(self) -> None:
        """Wait for a stable editor element that indicates protocol loaded."""

        start = time.perf_counter()
        expect(self.page.get_by_text("Protocol Metadata")).to_be_visible(timeout=self._ui_timeout_ms())
        # Store under export diagnostics to keep all runtime step timing in one place.
        # Runner will also record wait_loaded_ms separately.
        self._last_export_diagnostics["step_wait_protocol_loaded_ms"] = int((time.perf_counter() - start) * 1000)

    def export_protocol(self, destination: Path) -> ExportedProtocol:
        """Export protocol and save it to the given destination path."""

        self._last_export_diagnostics = {
            "continue_modal_shown": False,
            "continue_modal_wait_ms": 0,
            "continue_clicked": False,
            "download_suggested_filename": "",
            "download_url": "",
            "download_url_is_blob": False,
            "download_wait_ms": 0,
            "download_save_as_ms": 0,
            "download_saved_bytes": 0,
            "step_close_overlay_ms": 0,
            "step_wait_export_enabled_ms": 0,
            "step_click_export_ms": 0,
            "step_click_continue_ms": 0,
        }

        def _maybe_capture_failure_artifacts(reason: str) -> None:
            artifacts_root = os.environ.get("MIGRATION_REPORT_ARTIFACTS_DIR", "").strip()
            if not artifacts_root:
                return

            key = destination.stem or "unknown"
            target_dir = Path(artifacts_root) / key
            target_dir.mkdir(parents=True, exist_ok=True)

            try:
                (target_dir / "error.txt").write_text(reason + "\n", encoding="utf-8")
            except Exception:
                pass

            try:
                self.page.screenshot(path=str(target_dir / "page.png"), full_page=True)
            except Exception:
                pass

            try:
                (target_dir / "page.html").write_text(self.page.content(), encoding="utf-8")
            except Exception:
                pass

        overlay = self.page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
        if overlay.count() > 0 and overlay.is_visible():
            close_start = time.perf_counter()
            # In headless mode the close icon can detach/re-render during click.
            # Escape is typically more reliable.
            self.page.keyboard.press("Escape")

            if overlay.is_visible():
                close_icon = self.page.get_by_label("close_icon")
                if close_icon.count() > 0:
                    try:
                        close_icon.first.click(timeout=500)
                    except TimeoutError:
                        # Best effort only; don't let this dominate the run.
                        pass

            try:
                overlay.wait_for(state="hidden", timeout=self._ui_timeout_ms())
            except TimeoutError:
                pass

            self._last_export_diagnostics["step_close_overlay_ms"] = int((time.perf_counter() - close_start) * 1000)

        export_button = self.page.get_by_role("button", name="Export protocol")
        continue_button = self.page.get_by_role("button", name="Continue with export")

        download_timeout_ms = self._download_timeout_ms()

        if os.environ.get("MIGRATION_REPORT_DEBUG_DOWNLOAD", "false").lower() == "true":

            def _log_download(download: Download) -> None:
                print("[migration-download] suggested=%s url=%s" % (download.suggested_filename, download.url))

            self.page.on("download", _log_download)

        # Export can be disabled briefly while the editor finishes loading.
        enabled_start = time.perf_counter()
        expect(export_button).to_be_visible(timeout=self._ui_timeout_ms())
        expect(export_button).to_be_enabled(timeout=download_timeout_ms)
        self._last_export_diagnostics["step_wait_export_enabled_ms"] = int((time.perf_counter() - enabled_start) * 1000)

        # We need to handle two possible flows:
        # 1) Export triggers a download immediately.
        # 2) Export triggers a "Continue with export" confirmation, and download only
        #    begins after clicking it.
        #
        # Using a blocking wait for the Continue modal inside `expect_download` can
        # unintentionally add ~UI-timeout latency even when the download starts quickly.
        # Instead, attach a download handler and poll for either condition.
        download_start = time.perf_counter()
        captured_downloads: list[Download] = []

        def _capture_first_download(download: Download) -> None:
            if not captured_downloads:
                captured_downloads.append(download)

        self.page.on("download", _capture_first_download)
        try:
            try:
                export_click_start = time.perf_counter()
                export_button.click()
                self._last_export_diagnostics["step_click_export_ms"] = int(
                    (time.perf_counter() - export_click_start) * 1000
                )
            except TimeoutError:
                export_click_start = time.perf_counter()
                export_button.click(force=True)
                self._last_export_diagnostics["step_click_export_ms"] = int(
                    (time.perf_counter() - export_click_start) * 1000
                )

            continue_wait_start = time.perf_counter()
            deadline = download_start + (download_timeout_ms / 1000)

            while time.perf_counter() < deadline:
                if captured_downloads:
                    break

                # If the Continue modal appears, click it once.
                if not self._last_export_diagnostics["continue_clicked"]:
                    try:
                        if continue_button.is_visible(timeout=50):
                            self._last_export_diagnostics["continue_modal_shown"] = True
                            self._last_export_diagnostics["continue_modal_wait_ms"] = int(
                                (time.perf_counter() - continue_wait_start) * 1000
                            )

                            cont_click_start = time.perf_counter()
                            continue_button.click()
                            self._last_export_diagnostics["continue_clicked"] = True
                            self._last_export_diagnostics["step_click_continue_ms"] = int(
                                (time.perf_counter() - cont_click_start) * 1000
                            )
                    except TimeoutError:
                        pass

                # Yield to Playwright so events can be processed.
                self.page.wait_for_timeout(25)

            if not captured_downloads:
                raise TimeoutError("Timed out waiting for export download after clicking Export")

            download = captured_downloads[0]
        except TimeoutError as e:
            _maybe_capture_failure_artifacts(str(e))
            raise
        finally:
            try:
                self.page.remove_listener("download", _capture_first_download)
            except Exception:
                pass

        self._last_export_diagnostics["download_wait_ms"] = int((time.perf_counter() - download_start) * 1000)
        self._last_export_diagnostics["download_suggested_filename"] = download.suggested_filename
        self._last_export_diagnostics["download_url"] = download.url
        self._last_export_diagnostics["download_url_is_blob"] = download.url.startswith("blob:")

        destination.parent.mkdir(parents=True, exist_ok=True)
        save_start = time.perf_counter()
        download.save_as(str(destination))
        self._last_export_diagnostics["download_save_as_ms"] = int((time.perf_counter() - save_start) * 1000)
        try:
            self._last_export_diagnostics["download_saved_bytes"] = destination.stat().st_size
        except Exception:
            pass

        if os.environ.get("MIGRATION_REPORT_LOG_DOWNLOAD", "false").lower() == "true":
            print(
                "[download] continue_shown=%s continue_clicked=%s wait_ms=%s save_ms=%s suggested=%s"
                % (
                    self._last_export_diagnostics["continue_modal_shown"],
                    self._last_export_diagnostics["continue_clicked"],
                    self._last_export_diagnostics["download_wait_ms"],
                    self._last_export_diagnostics["download_save_as_ms"],
                    self._last_export_diagnostics["download_suggested_filename"],
                )
            )
        return ExportedProtocol(download_path=destination)
