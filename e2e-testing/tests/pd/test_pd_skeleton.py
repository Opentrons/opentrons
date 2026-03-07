"""skeleton test for PD E2E tests."""

import pytest
from playwright.sync_api import Page

from automation.pd_pages import LandingPage


@pytest.mark.pdE2E
@pytest.mark.slow
def test_pd_skeleton(page: Page, pd_base_url: str) -> None:
    """Test complete Flex onboarding workflow.
    Put a nice description of the test here.
    With goals of the test.
    """
    # Start on the home page
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()

    # In comments write out all your test steps
    # Especially document the whys and goals
    # This is especially important for complex tests
    # and to have LLM agents help maintain and extend tests

    # when you need to troubleshoot
    # use page.pause() to inspect the current state
    # this will pause the test and open the Playwright Inspector
    # and will generate python for you!!!
    # page.pause()
