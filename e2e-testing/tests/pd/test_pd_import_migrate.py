"""Snapshot tests for Protocol Designer artifacts."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage
from protocols import get_protocol_fixtures_filtered_for_e2e


@pytest.mark.snapshot
@pytest.mark.pdE2E
def test_migrate(page: Page, pd_base_url: str) -> None:
    """Import every protocol fixture in one session (faster than per-fixture parametrization).

    Subset fixtures with ``PD_PROTOCOL_FIXTURE_KEY`` or ``PD_PROTOCOL_FIXTURE_KEYS``
    (comma-separated stems). See :func:`protocols.get_protocol_fixtures_filtered_for_e2e`.
    """
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
            failures.append((protocol.key, str(exc)))

    if failures:
        lines = "\n".join(f"  - {key}: {err}" for key, err in failures)
        pytest.fail(f"Import failed for {len(failures)} fixture(s):\n{lines}")
