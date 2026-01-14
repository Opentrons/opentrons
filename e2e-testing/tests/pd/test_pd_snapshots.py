"""Snapshot tests for Protocol Designer artifacts."""

from pathlib import Path

import pytest
from playwright.sync_api import Page, expect
from syrupy.assertion import SnapshotAssertion

from automation.pd_pages import LandingPage, ProtocolEditorPage
from snapshot_extensions import PDProtocolExportSnapshotExtension


@pytest.mark.snapshot
@pytest.mark.pdE2E
def test_protocol_fixture_liquid_class_96_channel_file(snapshot: SnapshotAssertion, page: Page, base_url: str) -> None:
    e2e_root = Path(__file__).resolve().parents[2]
    protocol_path = e2e_root / "fixtures" / "protocol" / "9" / "Liquid_Class_96_Channel_Test.py"
    assert protocol_path.exists(), f"Expected protocol fixture at {protocol_path}"

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(protocol_path)
    landing.dismiss_migration_modal()
    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)

    protocol_editor = ProtocolEditorPage(page)
    export_path = Path(protocol_editor.export_protocol())
    export_text = export_path.read_text(encoding="utf-8").replace("\r\n", "\n")

    assert export_text == snapshot.use_extension(PDProtocolExportSnapshotExtension)
