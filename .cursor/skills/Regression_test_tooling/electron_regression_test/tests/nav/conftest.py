"""Navigation tests — left-panel app areas."""

import pytest

from automation.helpers.test_progress import log_banner

pytestmark = pytest.mark.smoke


def pytest_runtest_logstart(nodeid: str, location: tuple[str, int, str]) -> None:
    log_banner("nav", location[2])
