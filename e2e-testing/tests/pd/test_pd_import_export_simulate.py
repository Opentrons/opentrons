"""E2E test: import protocol fixtures in PD, export as Python, then simulate with opentrons_simulate."""

import shutil
import subprocess
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage, ProtocolEditorPage
from protocols import ProtocolFixture, get_protocol_fixtures


@pytest.mark.slow
@pytest.mark.pdE2E
@pytest.mark.parametrize(
    "protocol",
    get_protocol_fixtures(),
    ids=lambda f: f.key,
)
def test_import_export_simulate(
    page: Page,
    pd_base_url: str,
    protocol: ProtocolFixture,
    tmp_path: Path,
    opentrons_simulate_path: Path,
) -> None:
    """Import each protocol fixture in PD, export as Python, run opentrons_simulate to verify it simulates."""
    if not opentrons_simulate_path.exists():
        pytest.skip(reason="api venv not set up; run make -C api setup")

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(protocol.path)
    landing.dismiss_migration_modal()
    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=5000)

    editor = ProtocolEditorPage(page)
    downloaded_path = editor.export_protocol()
    exported_py = tmp_path / f"{protocol.key}.py"
    shutil.copy(downloaded_path, exported_py)

    monorepo_root = opentrons_simulate_path.parent.parent.parent
    result = subprocess.run(
        [str(opentrons_simulate_path), str(exported_py)],
        capture_output=True,
        text=True,
        cwd=str(monorepo_root),
        timeout=60,
    )

    assert result.returncode == 0, (
        f"opentrons_simulate failed for {protocol.key}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
    )
