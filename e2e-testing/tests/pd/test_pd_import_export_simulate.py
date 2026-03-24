"""E2E test: import protocol fixtures in PD, export as Python, then simulate with opentrons_simulate."""

import shutil
import subprocess
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage, ProtocolEditorPage
from protocols import get_protocol_fixtures_filtered_for_e2e


@pytest.mark.slow
@pytest.mark.pdE2E
def test_import_export_simulate(
    page: Page,
    pd_base_url: str,
    tmp_path: Path,
    e2e_monorepo_root: Path,
    opentrons_simulate_path: Path,
) -> None:
    """Import each protocol fixture in PD, export as Python, run opentrons_simulate.

    Runs in one browser session. Narrow fixtures with ``PD_PROTOCOL_FIXTURE_KEY`` or
    ``PD_PROTOCOL_FIXTURE_KEYS``; see :func:`protocols.get_protocol_fixtures_filtered_for_e2e`.
    """
    if not opentrons_simulate_path.exists():
        pytest.skip(reason="api venv not set up; run make -C api setup")

    fixtures = get_protocol_fixtures_filtered_for_e2e()
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()

    failures: list[tuple[str, str]] = []

    for index, protocol in enumerate(fixtures):
        if index > 0:
            page.goto(pd_base_url)
            landing.wait_for_page_load()
            landing.confirm_welcome_modal_if_present()

        landing.click_import_existing_protocol()
        landing.upload_protocol_file(str(protocol.path))
        landing.dismiss_migration_modal()
        try:
            expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=5000)
        except AssertionError as exc:
            failures.append((protocol.key, f"metadata: {exc}"))
            continue

        editor = ProtocolEditorPage(page)
        try:
            downloaded_path = editor.export_protocol()
        except Exception as exc:
            failures.append((protocol.key, f"export: {exc}"))
            continue

        exported_py = tmp_path / f"{protocol.key}.py"
        shutil.copy(downloaded_path, exported_py)

        result = subprocess.run(
            [str(opentrons_simulate_path), str(exported_py)],
            capture_output=True,
            text=True,
            cwd=str(e2e_monorepo_root),
            timeout=60,
        )
        if result.returncode != 0:
            failures.append(
                (
                    protocol.key,
                    "simulate failed\nstdout:\n"
                    f"{result.stdout}\nstderr:\n{result.stderr}",
                )
            )

    if failures:
        lines = "\n".join(f"  - {key}: {err}" for key, err in failures)
        pytest.fail(f"import/export/simulate failed for {len(failures)} fixture(s):\n{lines}")
