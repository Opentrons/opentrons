"""Landing page link tests for the Labware Creator.

Ported from legacy Cypress test:
    labware-library/cypress/e2e/labware-creator/create.cy.js
"""

from __future__ import annotations

import pytest
from playwright.sync_api import Page, expect


@pytest.mark.llE2E
def test_ll_landing_page_links(page: Page, ll_base_url: str) -> None:
    """Verify the Labware Creator landing page contains required links."""
    page.goto(f"{ll_base_url}/#/create")

    # Back to Labware Library link
    back_link = page.get_by_text("Back to Labware Library")
    expect(back_link).to_be_visible()
    expect(back_link).to_have_attribute("href", value="#/")

    # Custom labware guide link
    guide_link = page.get_by_text("read the custom labware guide")
    expect(guide_link).to_be_visible()
    expect(guide_link).to_have_attribute(
        "href",
        "https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions",
    )

    # Second Labware Library link (in body text paragraph)
    body_ll_link = page.get_by_role("paragraph").filter(has_text="This tool will allow you to").get_by_role("link")
    expect(body_ll_link).to_be_visible()

    # Second labware guide link ("this guide")
    this_guide = page.locator("a").filter(has_text="this guide")
    expect(this_guide).to_be_visible()
    expect(this_guide).to_have_attribute(
        "href",
        "https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions",
    )
