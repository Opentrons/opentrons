---
applyTo: 'e2e-testing/**'
---

# E2E Testing Instructions

## Project Overview

The `e2e-testing` directory contains end-to-end tests for Protocol Designer using:

- **Playwright** - Browser automation
- **pytest** - Test framework
- **pytest-playwright** - Pytest + Playwright integration
- **uv** - Python package manager

## Architecture

### Page Object Model (POM) Pattern

**ALWAYS use Page Object Model** when writing or modifying tests:

1. **Page Objects** (`automation/pd_pages/`):
   - Encapsulate all element locators and interactions
   - Inherit from `BasePage` for common functionality
   - Use `self.is_sandbox` property for environment-specific selectors
   - Methods should return `None` or page objects (for chaining)
   - Add type annotations to all methods

2. **Tests** (`tests/`):
   - Import and use page objects, never direct Playwright selectors
   - Focus on test logic and assertions
   - Use descriptive test names: `test_<feature>_<scenario>`
   - Add `@pytest.mark.slow` for tests taking >10 seconds
   - Add type annotations: `def test_name(page: Page, base_url: str) -> None:`

**Example - Creating a new page object:**

```python
"""Module for <page name> interactions."""

from playwright.sync_api import Page
from .base_page import BasePage


class MyPage(BasePage):
    """Page object for <page name>."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def click_submit_button(self) -> None:
        """Click the submit button."""
        self.click_button("Submit")

    def fill_protocol_name(self, name: str) -> None:
        """Fill in the protocol name field."""
        self.fill_input("protocolName", name)
```

**Example - Using page objects in tests:**

```python
from automation.pd_pages import LandingPage, MyPage

def test_my_feature(page: Page, base_url: str) -> None:
    """Test description here."""
    landing = LandingPage(page)
    landing.wait_for_page_load()

    my_page = MyPage(page)
    my_page.fill_protocol_name("Test Protocol")
    my_page.click_submit_button()
```

## Environment Configuration

Tests run against different environments via `TEST_ENV`:

- **local** (default): `http://localhost:4173` - Auto-builds and serves Protocol Designer
- **staging**: `https://staging.designer.opentrons.com`
- **prod**: `https://designer.opentrons.com`
- **sandbox**: TODO - Not implemented (requires branch-specific URLs)

**Environment detection in page objects:**

```python
class MyPage(BasePage):
    def select_slot(self, slot: str) -> None:
        """Select a deck slot (environment-aware)."""
        if self.is_sandbox:
            # Sandbox uses different selectors
            self.page.get_by_text(f"Slot {slot}").click()
        else:
            # Staging/prod use test-ids
            self.page.get_by_test_id(f"slot-{slot}").click()
```

## Key Files

### `conftest.py` - Pytest Configuration

- **Fixtures you can use:**
  - `page: Page` - Pre-configured Playwright page
  - `base_url: str` - Environment URL
  - `browser_context_args` - Browser viewport & video settings
  - `browser_type_launch_args` - Headless/headed mode
  - `dev_server` - Auto-starts Protocol Designer for local tests

### `pytest.ini` - Test Settings

- Test discovery: `test_*.py`, `*_test.py`
- Browser: Chromium only
- Timeout: 300 seconds per test
- Markers: `slow`, `integration`

### `pyproject.toml` - Dependencies & Tools

- **Dependencies:** playwright, pytest, pytest-playwright, mypy, ruff
- **Build system:** hatchling
- **Packages:** `automation`, `tests`
- **Type checking:** Strict mypy with test exemptions

## Development Commands

**ALWAYS run these before committing:**

```bash
make check                   # Runs lint + typecheck (required)
make format                  # Auto-format code
make lint                    # Check code style with ruff
make typecheck               # Run mypy type checking
```

**Running tests:**

```bash
make test-pd-local              # Local build (headed, 250ms slow-mo)
make test-pd-local-headless     # Local build (headless)
make test-pd-staging            # Staging environment
make test-pd-staging-headless   # Staging (headless)
make test-pd-prod               # Production (use sparingly!)
make test-pd-debug              # Debug mode (1000ms slow-mo, verbose)
```

**Development tools:**

```bash
make codegen                 # Launch Playwright Inspector/recorder
make codegen URL=<url>       # Record against custom URL
```

## Code Quality Standards

### Type Annotations (REQUIRED)

All functions must have type annotations:

```python
# ✅ CORRECT
def my_function(page: Page, name: str) -> None:
    """Docstring here."""
    pass

# ❌ WRONG - Missing type annotations
def my_function(page, name):
    pass
```

### Imports

**Organize imports:**

1. Standard library
2. Third-party (pytest, playwright)
3. Local imports

```python
"""Module docstring."""

import os
from typing import Any

import pytest
from playwright.sync_api import Page

from automation.pd_pages import LandingPage
```

### Docstrings

**ALWAYS add docstrings** to:

- Modules (top of file)
- Classes
- Public methods

```python
"""Module for landing page interactions."""

class LandingPage(BasePage):
    """Page object for Protocol Designer landing page."""

    def wait_for_page_load(self) -> None:
        """Wait for the landing page to fully load."""
        pass
```

## Video Recordings

**All tests automatically record videos** to `test-results/videos/`:

- Videos saved for passing AND failing tests
- Format: `<test-name>-<timestamp>.webm`
- Uploaded to GitHub Actions artifacts (7-day retention)
- **DO NOT** commit videos to git (already in `.gitignore`)

## Testing Best Practices

### 1. Use Descriptive Selectors

**Prefer (in order):**

1. `get_by_role()` - Semantic HTML roles
2. `get_by_test_id()` - Test IDs added by developers
3. `get_by_text()` - Visible text
4. `get_by_label()` - Form labels

When porting scenarios from the legacy Cypress suite, mirror the selectors used in `protocol-designer/cypress/support/**` first, before digging through product source. Those support helpers are the single source of truth for module, labware, and slot identifiers.

**Avoid:**

- CSS selectors (brittle, implementation-dependent)
- XPath (hard to read, maintain)

### 2. Wait for Elements

**ALWAYS wait** for elements before interacting:

```python
# ✅ CORRECT - Using expect() from base_page
from playwright.sync_api import expect
element = self.page.get_by_role("button", name="Submit")
expect(element).to_be_visible()
element.click()

# ✅ CORRECT - Using wait_for_visible() from BasePage
self.wait_for_visible(element, timeout=5000)

# ❌ WRONG - No wait, will fail if element not immediately ready
self.page.get_by_role("button", name="Submit").click()
```

### 3. Test Independence

**Each test must be independent:**

- Don't rely on test execution order
- Don't share state between tests
- Clean up any created resources (handled by fixtures)

### 4. Assertions

Use pytest assertions:

```python
# ✅ CORRECT
assert page.url == base_url
assert "Protocol Designer" in page.title()

# ✅ CORRECT - Playwright assertions (better for async)
from playwright.sync_api import expect
expect(page.get_by_text("Success")).to_be_visible()
```

## Common Patterns

### Adding a New Test

1. **Create/update page objects** in `automation/pd_pages/`
2. **Write test** in `tests/` using page objects
3. **Add type annotations** to all functions
4. **Run locally:** `make test-pd-local`
5. **Check code quality:** `make check`
6. **Commit changes**

### Environment-Aware Selectors

```python
def select_element(self, name: str) -> None:
    """Select element (environment-aware)."""
    if self.is_sandbox:
        # Sandbox-specific selector
        self.page.locator(f"[data-sandbox-id='{name}']").click()
    else:
        # Staging/prod selector
        self.page.get_by_test_id(name).click()
```

### Chaining Page Objects

```python
def navigate_and_configure(self) -> "NextPage":
    """Navigate to next page and return its page object."""
    self.click_button("Next")
    from .next_page import NextPage
    return NextPage(self.page)

# Usage in tests:
next_page = landing.navigate_and_configure()
next_page.configure_settings()
```

## CI/CD Integration

### GitHub Actions Workflows

**`.github/workflows/pd-e2e-test.yaml`:**

- Runs on: push to `edge`, `e2e-testing` branches
- Jobs: `e2e-test-local`, `e2e-test-staging`
- Automatically runs in **headless mode** (`CI=true`)
- Uploads test results and videos as artifacts

**`.github/workflows/e2e-test-checks.yaml`:**

- Runs on: push to `edge`, `e2e-testing`, PRs
- Job: `checks` - Runs `make check` (lint + typecheck)

### Artifacts

Test results uploaded to GitHub Actions:

- **Name:** `playwright-results-local` or `playwright-results-staging`
- **Contains:** Test results, HTML reports, video recordings
- **Retention:** 7 days

## Troubleshooting

### Local Server Issues

If Protocol Designer fails to build/serve:

1. Check Node.js version: `node --version` (should be 22.12.0)
2. Build manually: `cd ../protocol-designer && make build`
3. Check memory: PD Makefile sets `NODE_OPTIONS=--max-old-space-size=8192`
4. Kill conflicting processes: `pkill -9 node`

### Import Errors

If page object imports fail:

1. Run: `make setup`
2. Verify package installed: `uv run python -c "import automation"`
3. Check `pyproject.toml` includes `automation` in packages

### Type Check Failures

If mypy reports errors:

1. Add missing type annotations
2. Use `typing` imports: `from typing import Any`
3. Tests can be less strict (see `pyproject.toml` overrides)
4. Fix incrementally: `make typecheck`

### Test Timeouts

Default timeout: 300 seconds per test

- Increase in `pytest.ini`: `timeout = <seconds>`
- Or per-test: `@pytest.mark.timeout(600)`
- Use `make test-debug` for step-by-step debugging

## DO NOT

1. ❌ Write Playwright selectors directly in tests - USE page objects
2. ❌ Use CSS selectors without justification - USE semantic selectors
3. ❌ Commit without running `make check` - ALWAYS check first
4. ❌ Skip type annotations - REQUIRED by mypy
5. ❌ Test against production frequently - Use staging
6. ❌ Commit video files - Already in `.gitignore`
7. ❌ Rely on test execution order - Tests must be independent
8. ❌ Use `time.sleep()` - Use Playwright's waiting mechanisms

## DO

1. ✅ Use Page Object Model for all tests
2. ✅ Add type annotations to all functions
3. ✅ Run `make check` before committing
4. ✅ Test locally before pushing: `make test-pd-local`
5. ✅ Add docstrings to modules, classes, and public methods
6. ✅ Use environment-aware selectors when needed
7. ✅ Write descriptive test names
8. ✅ Mark slow tests with `@pytest.mark.slow`
9. ✅ Review video recordings when debugging failures
10. ✅ Keep page objects focused and single-purpose
