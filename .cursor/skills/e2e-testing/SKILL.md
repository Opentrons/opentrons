---
name: e2e-testing
description: E2E testing conventions for Protocol Designer and Labware Library using Playwright + pytest in e2e-testing/. Use when writing, running, or modifying end-to-end tests, page objects, or Playwright tests.
---

# E2E Testing Instructions

## Project Overview

The `e2e-testing` directory contains end-to-end tests for **Protocol Designer (PD)** and **Labware Library (LL)** using:

- **Playwright** — Browser automation (Chromium)
- **pytest** — Test framework
- **pytest-playwright** — Pytest + Playwright integration
- **uv** — Python package manager (lockfile: `uv.lock`)
- **Python 3.12**

## Directory Layout

- `automation/base_page.py` — Shared `BasePage` class inherited by all page objects
- `automation/pd_pages/` — PD page objects (import from `automation.pd_pages`)
- `automation/ll_pages/` — LL page objects (import from `automation.ll_pages`)
- `tests/pd/` — PD E2E tests (marked `@pytest.mark.pdE2E`)
- `tests/ll/` — LL E2E tests (marked `@pytest.mark.llE2E`)
- `fixtures/` — Protocol JSON files, labware definitions, and test data

## Architecture — Page Object Model

**ALWAYS use Page Object Model and/or Screenplay Pattern** when writing or modifying tests.

### Shared Base (`automation/base_page.py`)

`BasePage` provides: `click_button`, `click_test_id`, `fill_input`, `wait_for_visible`, `dismiss_release_notes_toast`, `highlight_element`, `goto`. Exposes `self.is_sandbox` (True when `TEST_ENV=sandbox`). All page objects inherit from it.

### PD Page Objects (`automation/pd_pages/`)

`LandingPage`, `CreateProtocolWizard`, `PipetteModal`, `ModuleConfigPage`, `DeckConfigPage`, `ProtocolEditorPage`, `TransferPage`, `MixStepForm`, `ThermocyclerStepPage`, `ThermocyclerProfileModal`, `TemperatureStepPage`, `HeaterShakerStepPage`, `PlateReaderPage`, `FlexStackerPage`, `SettingsPage`, `Timeline`.

### LL Page Objects (`automation/ll_pages/`)

`DesktopNavigation`, `LabwareCreator`.

### Tests (`tests/pd/` and `tests/ll/`)

- Import and use page objects — never write raw Playwright selectors in test files
- Naming: `test_<feature>_<scenario>`
- Mark PD tests with `@pytest.mark.pdE2E`, LL tests with `@pytest.mark.llE2E`
- Add `@pytest.mark.slow` for tests taking >10 seconds
- Add type annotations: `def test_name(page: Page, pd_base_url: str) -> None:`

### Example — PD Page Object

```python
"""Module for <page name> interactions."""

from playwright.sync_api import Page
from automation.base_page import BasePage


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

### Example — PD Test

```python
import pytest
from playwright.sync_api import Page
from automation.pd_pages import LandingPage, MyPage


@pytest.mark.pdE2E
def test_my_feature(page: Page, pd_base_url: str) -> None:
    """Test description here."""
    landing = LandingPage(page)
    landing.wait_for_page_load()

    my_page = MyPage(page)
    my_page.fill_protocol_name("Test Protocol")
    my_page.click_submit_button()
```

### Example — LL Test

```python
import pytest
from playwright.sync_api import Page
from automation.ll_pages import DesktopNavigation


@pytest.mark.llE2E
def test_nav_loads(page: Page, ll_base_url: str) -> None:
    """Verify navigation renders."""
    page.goto(f"{ll_base_url}/")
    nav = DesktopNavigation(page)
    nav.wait_for_loaded()
```

## Environment Configuration

Tests run against different environments via `TEST_ENV`:

- **local** (default): Auto-builds and serves the app (PD on ports 4173-4175, LL on ports 4176-4178)
- **staging**: PD → `https://staging.designer.opentrons.com` / LL → `https://staging.labware.opentrons.com`
- **prod**: PD → `https://designer.opentrons.com` / LL → `https://labware.opentrons.com`
- **sandbox**: TODO — Not implemented (requires branch-specific URLs)

### conftest.py Fixtures

| Fixture                    | Scope    | Purpose                                                                                        |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `pd_base_url`              | session  | Resolves PD URL; starts local preview server when `TEST_ENV=local`                             |
| `ll_base_url`              | session  | Resolves LL URL; starts local preview server when `TEST_ENV=local`                             |
| `page`                     | function | Creates a Playwright page, navigates to the correct app URL based on test markers, saves video |
| `browser_context_args`     | session  | Viewport 1280x720, video recording                                                             |
| `browser_type_launch_args` | session  | Headless/headed, slow_mo                                                                       |
| `eyes`                     | function | Applitools Eyes session (or None)                                                              |
| `eyes_singleton`           | session  | Shared Applitools Eyes instance                                                                |

### Key Environment Variables

| Variable             | Default | Notes                                 |
| -------------------- | ------- | ------------------------------------- |
| `TEST_ENV`           | `local` | `local`, `staging`, `prod`, `sandbox` |
| `HEADLESS`           | (unset) | `true` / `false`; overrides default   |
| `SKIP_SERVER_START`  | `false` | Skip automatic server build+serve     |
| `PD_SERVER_URL`      | auto    | Override PD URL                       |
| `LL_SERVER_URL`      | auto    | Override LL URL                       |
| `LL_SERVER_PORT`     | `4176`  | Preferred port for LL local server    |
| `APPLITOOLS_API_KEY` | (unset) | Enable Applitools visual checks       |

## Development Commands

**ALWAYS run before committing:**

```bash
make format       # Auto-format (ruff format + ruff check --fix)
make typecheck    # Run mypy
make check        # lint + typecheck combined
make prep         # format + typecheck
```

**Running PD tests:**

```bash
make test-pd-local                               # Headless, chromium
make test-pd-local-headed                        # Headed, 250ms slow-mo
make test-pd-local PYTEST_ARGS="-k test_name"    # Run one test
make test-pd-staging                             # Against staging
make test-pd-prod                                # Against prod
make test-pd-debug                               # Headed, 1000ms slow-mo, verbose
```

**Running LL tests:**

```bash
make test-ll-local                               # Headless, chromium
make test-ll-local-headed                        # Headed
make test-ll-staging                             # Against staging
make test-ll-prod                                # Against prod
```

**Other targets:**

```bash
make test-unit      # Unit tests only
make troubleshoot   # Re-run last failures in headed mode
make codegen        # Playwright Inspector/recorder (default localhost:4173)
make codegen URL=<url>  # Record against custom URL
```

## Code Quality Standards

### Type Annotations (REQUIRED)

All functions must have type annotations:

```python
# Good
def my_function(page: Page, name: str) -> None:
    """Docstring here."""
    pass

# Bad — Missing type annotations
def my_function(page, name):
    pass
```

Note: `mypy` is strict for `automation/` but relaxed (`disallow_untyped_defs = false`) for `tests/`.

### Imports

Import page objects from the package, not from internal modules:

```python
# Good
from automation.pd_pages import LandingPage
from automation.ll_pages import LabwareCreator
from automation.base_page import BasePage

# Bad
from automation.pd_pages.landing_page import LandingPage
```

### Docstrings

**ALWAYS add docstrings** to modules (top of file), classes, and public methods.

## Testing Best Practices

### Selectors (prefer in order)

1. `get_by_role()` — Semantic HTML roles
2. `get_by_test_id()` — Test IDs
3. `get_by_text()` — Visible text
4. `get_by_label()` — Form labels

Avoid CSS selectors (brittle) and XPath (hard to maintain).

### Wait for Elements

**ALWAYS wait** before interacting:

```python
# Good — Using BasePage helper
self.wait_for_visible(element, timeout=5000)

# Good — Using Playwright expect
from playwright.sync_api import expect
expect(element).to_be_visible()
element.click()

# Bad — No wait
self.page.get_by_role("button", name="Submit").click()
```

### Test Independence

- Don't rely on test execution order
- Don't share state between tests
- Clean up handled by fixtures and fresh browser contexts

### Test Markers

Every PD test **must** have `@pytest.mark.pdE2E`. Every LL test **must** have `@pytest.mark.llE2E`. A test cannot have both markers.

## Visual Snapshots (Applitools Eyes)

- Use the `eyes` pytest fixture (exposed via `pytest_plugins = ["eyes"]` in `conftest.py`)
- `python-dotenv` loads `.env`. Set `APPLITOOLS_API_KEY` to enable
- In headed mode, `eyes` yields `None` (no visual snapshots)

```python
from eyes import Eyes

def test_my_feature(page: Page, pd_base_url: str, eyes: Eyes | None) -> None:
    # ... navigate ...
    if eyes is None:
        return
    eyes.check("After navigation")
    eyes.check_element("Timeline", page.get_by_test_id("TimelineToolbox_scrollContainer"))
```

## Common Patterns

### Adding a New PD Test

1. Create/update page objects in `automation/pd_pages/`
2. Write test in `tests/pd/` using page objects, add `@pytest.mark.pdE2E`
3. Add type annotations and docstrings
4. Run locally: `make test-pd-local PYTEST_ARGS="-k test_name"`
5. Check code quality: `make check`

### Adding a New LL Test

1. Create/update page objects in `automation/ll_pages/`
2. Write test in `tests/ll/` using page objects, add `@pytest.mark.llE2E`
3. Add type annotations and docstrings
4. Run locally: `make test-ll-local PYTEST_ARGS="-k test_name"`
5. Check code quality: `make check`

### Chaining Page Objects

```python
def navigate_and_configure(self) -> "NextPage":
    """Navigate to next page and return its page object."""
    self.click_button("Next")
    from .next_page import NextPage
    return NextPage(self.page)
```

## CI/CD Integration

- **`.github/workflows/pd-e2e-test.yaml`** — PD E2E tests
- **`.github/workflows/ll-e2e-test.yaml`** — LL E2E tests
- **`.github/workflows/e2e-test-checks.yaml`** — Lint + typecheck

## Troubleshooting

### Local Server Issues

1. Check Node.js version: `node --version` (should be >= 22.22.0)
2. Build manually: `cd ../protocol-designer && make build` or `cd ../labware-library && make build`
3. Check memory: PD Makefile sets `NODE_OPTIONS=--max-old-space-size=8192`
4. Kill conflicting processes: `pkill -9 node`

### Import Errors

1. Run: `make setup`
2. Verify: `uv run python -c "from automation.base_page import BasePage; print('OK')"`

### Test Timeouts

Default: 300 seconds per test (set in `pytest.ini`). Per-test override: `@pytest.mark.timeout(600)`. Use `make test-pd-debug` or `make troubleshoot` for step-by-step debugging.

## DO NOT

1. Write Playwright selectors directly in test files — USE page objects
2. Use CSS selectors without justification — USE semantic selectors
3. Commit without running `make check`
4. Skip type annotations — REQUIRED by mypy
5. Rely on test execution order — tests must be independent
6. Use `time.sleep()` — use Playwright's waiting mechanisms
7. Mark a test with both `@pytest.mark.pdE2E` and `@pytest.mark.llE2E`
8. Import `BasePage` from `automation.pd_pages.base_page` — use `automation.base_page`
