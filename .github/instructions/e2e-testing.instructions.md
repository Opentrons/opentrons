---
applyTo: 'e2e-testing/**'
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

Key directories:

- `automation/base_page.py` — Shared `BasePage` class inherited by all page objects
- `automation/pd_pages/` — PD page objects (import from `automation.pd_pages`)
- `automation/ll_pages/` — LL page objects (import from `automation.ll_pages`)
- `tests/pd/` — PD E2E tests (marked `@pytest.mark.pdE2E`)
- `tests/ll/` — LL E2E tests (marked `@pytest.mark.llE2E`)
- `fixtures/` — Protocol JSON files, labware definitions, and test data

## Architecture

### Page Object Model (POM) Pattern

**ALWAYS use Page Object Model and/or Screenplay Pattern** when writing or modifying tests:

1. **Shared base** (`automation/base_page.py`):
   - `BasePage` provides: `click_button`, `click_test_id`, `fill_input`, `wait_for_visible`, `dismiss_release_notes_toast`, `highlight_element`, `goto`
   - Exposes `self.is_sandbox` (True when `TEST_ENV=sandbox`)
   - All page objects in both `pd_pages/` and `ll_pages/` inherit from it via `from automation.base_page import BasePage`

2. **PD Page Objects** (`automation/pd_pages/`):
   - `LandingPage` — welcome modal, create/import protocol
   - `CreateProtocolWizard` — robot type, pipette, gripper, etc.
   - `PipetteModal` — pipette selection
   - `ModuleConfigPage` — module hardware configuration
   - `DeckConfigPage` — slot selection, fixtures, modules, naming
   - `ProtocolEditorPage` — labware placement, liquid editing, well selection, toolbox
   - `TransferPage` — transfer step form
   - `MixStepForm` — mix step form
   - `ThermocyclerStepPage`, `ThermocyclerProfileModal` — TC steps
   - `TemperatureStepPage` — temp deck steps
   - `HeaterShakerStepPage` — H/S steps
   - `PlateReaderPage` — absorbance reader
   - `FlexStackerPage` — Flex Stacker configuration
   - `SettingsPage` — app settings
   - `Timeline` — protocol timeline

3. **LL Page Objects** (`automation/ll_pages/`):
   - `DesktopNavigation` — header nav, subdomain links, About dropdown
   - `LabwareCreator` — full Labware Creator wizard (type selection, dimensions, grid, well shape, export)

4. **Tests** (`tests/pd/` and `tests/ll/`):
   - Import and use page objects — never write raw Playwright selectors in test files
   - Focus on test logic and assertions
   - Naming: `test_<feature>_<scenario>`
   - Mark PD tests with `@pytest.mark.pdE2E`, LL tests with `@pytest.mark.llE2E`
   - Add `@pytest.mark.slow` for tests taking >10 seconds
   - Add type annotations: `def test_name(page: Page, pd_base_url: str) -> None:`

**Example — PD page object:**

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

**Example — PD test:**

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

**Example — LL test:**

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
- **staging**: PD → `https://staging.designer.opentrons.com` · LL → `https://staging.labware.opentrons.com`
- **prod**: PD → `https://designer.opentrons.com` · LL → `https://labware.opentrons.com`
- **sandbox**: TODO — Not implemented (requires branch-specific URLs)

### conftest.py Fixtures

| Fixture                    | Scope    | Purpose                                                                                        |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `pd_base_url`              | session  | Resolves PD URL; starts local preview server when `TEST_ENV=local`                             |
| `ll_base_url`              | session  | Resolves LL URL; starts local preview server when `TEST_ENV=local`                             |
| `page`                     | function | Creates a Playwright page, navigates to the correct app URL based on test markers, saves video |
| `browser_context_args`     | session  | Viewport 1280×720, video recording                                                             |
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

## Key Files

- **`conftest.py`** — Fixtures, server lifecycle, video recording, Applitools batch setup
- **`pytest.ini`** — Markers (`pdE2E`, `llE2E`, `slow`, `unit`, `integration`), addopts, timeout (300 s)
- **`pyproject.toml`** — Dependencies (`playwright>=1.55`, `eyes-playwright>=6.4`), ruff (line-length 120, py312), mypy (strict for `automation/`, relaxed for `tests/`)
- **`eyes.py`** — `Eyes` wrapper class, `eyes` + `eyes_singleton` fixtures
- **`utility.py`** — `troubleshoot_and_pause` decorator, `_import_protocol_and_open_editor`, `create_new_protocol_from_landing_page`
- **`run_many_tests.py`** — Local "CI" runner: format → lint → typecheck with auto-fix

## Development Commands

**ALWAYS run these before committing:**

```bash
make format                  # Auto-format (ruff format + ruff check --fix)
make typecheck               # Run mypy
make check                   # lint + typecheck combined
make prep                    # format + typecheck
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
make test-unit               # Unit tests only
make troubleshoot            # Re-run last failures in headed mode
make codegen                 # Playwright Inspector/recorder (default localhost:4173)
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

Note: `mypy` is strict for `automation/` but relaxed (`disallow_untyped_defs = false`) for `tests/`.

### Imports

Organized automatically by ruff. Import page objects from the package, not from internal modules:

```python
# ✅ CORRECT
from automation.pd_pages import LandingPage
from automation.ll_pages import LabwareCreator
from automation.base_page import BasePage

# ❌ WRONG
from automation.pd_pages.landing_page import LandingPage  # Too specific
```

### Docstrings

**ALWAYS add docstrings** to modules (top of file), classes, and public methods.

## Testing Best Practices

### 1. Use Descriptive Selectors

**Prefer (in order):**

1. `get_by_role()` — Semantic HTML roles
2. `get_by_test_id()` — Test IDs added by developers
3. `get_by_text()` — Visible text
4. `get_by_label()` — Form labels

**Avoid:** CSS selectors (brittle), XPath (hard to maintain).

### 2. Wait for Elements

**ALWAYS wait** for elements before interacting:

```python
# ✅ CORRECT — Using BasePage helper
self.wait_for_visible(element, timeout=5000)

# ✅ CORRECT — Using Playwright expect
from playwright.sync_api import expect
expect(element).to_be_visible()
element.click()

# ❌ WRONG — No wait
self.page.get_by_role("button", name="Submit").click()
```

### 3. Test Independence

- Don't rely on test execution order
- Don't share state between tests
- Clean up is handled by fixtures and fresh browser contexts

### 4. Assertions

```python
# Playwright assertions (preferred)
from playwright.sync_api import expect
expect(page.get_by_text("Success")).to_be_visible()

# pytest assertions (also fine)
assert "Protocol Designer" in page.title()
```

### 5. Test Markers

Every PD test **must** have `@pytest.mark.pdE2E`. Every LL test **must** have `@pytest.mark.llE2E`. A test cannot have both markers.

## Visual Snapshots (Applitools Eyes)

- Use the `eyes` pytest fixture (exposed via `pytest_plugins = ["eyes"]` in `conftest.py`).
- `python-dotenv` loads `.env`. Set `APPLITOOLS_API_KEY` to enable.
- In headed mode, `eyes` yields `None` (no visual snapshots).
- Multiple `eyes.check(...)` calls group under one Applitools test per pytest function.

```python
from eyes import Eyes

def test_my_feature(page: Page, pd_base_url: str, eyes: Eyes | None) -> None:
    # ... navigate ...
    if eyes is None:
        return
    eyes.check("After navigation")
    eyes.check_element("Timeline", page.get_by_test_id("TimelineToolbox_scrollContainer"))
```

Batch naming: Local → `dev run | <TEST_ENV>` · CI → `CI | <PR branch>`.

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

### Adding Labware Fixtures for LL Tests

Place custom labware JSON files in `fixtures/labware/`. The `LabwareCreator` page object has methods like `import_labware_file()` that accept file paths relative to the e2e-testing directory.

### Chaining Page Objects

```python
def navigate_and_configure(self) -> "NextPage":
    """Navigate to next page and return its page object."""
    self.click_button("Next")
    from .next_page import NextPage
    return NextPage(self.page)
```

## CI/CD Integration

### GitHub Actions Workflows

- **`.github/workflows/pd-e2e-test.yaml`** — PD E2E tests
- **`.github/workflows/ll-e2e-test.yaml`** — LL E2E tests
- **`.github/workflows/e2e-test-checks.yaml`** — Lint + typecheck

## Troubleshooting

### Local Server Issues

If Protocol Designer or Labware Library fails to build/serve:

1. Check Node.js version: `node --version` (should be 22.21.1)
2. Build manually: `cd ../protocol-designer && make build` or `cd ../labware-library && make build`
3. Check memory: PD Makefile sets `NODE_OPTIONS=--max-old-space-size=8192`
4. Kill conflicting processes: `pkill -9 node`
5. Check that `node` and `npx` are on PATH (the e2e `conftest.py` spawns `make -C ../protocol-designer serve`)

### Import Errors

1. Run: `make setup`
2. Verify: `uv run python -c "from automation.base_page import BasePage; print('OK')"`
3. Check `pyproject.toml` `[tool.hatch.build.targets.wheel]` includes `automation` and `tests`

### Type Check Failures

1. Add missing type annotations
2. Tests are allowed to omit type annotations (see `[[tool.mypy.overrides]]` in `pyproject.toml`)
3. Fix incrementally: `make typecheck`

### Test Timeouts

Default timeout: 300 seconds per test (set in `pytest.ini`).

- Per-test override: `@pytest.mark.timeout(600)`
- Use `make test-pd-debug` / `make troubleshoot` for step-by-step debugging

## DO NOT

1. ❌ Write Playwright selectors directly in test files — USE page objects
2. ❌ Use CSS selectors without justification — USE semantic selectors
3. ❌ Commit without running `make check`
4. ❌ Skip type annotations — REQUIRED by mypy
5. ❌ Rely on test execution order — Tests must be independent
6. ❌ Use `time.sleep()` — Use Playwright's waiting mechanisms
7. ❌ Mark a test with both `@pytest.mark.pdE2E` and `@pytest.mark.llE2E`
8. ❌ Import `BasePage` from `automation.pd_pages.base_page` — it no longer exists there; use `automation.base_page`

## DO

1. ✅ Use Page Object Model or Screenplay pattern for all tests
2. ✅ Add type annotations to all functions
3. ✅ Run `make check` before committing
4. ✅ Test PD locally: `make test-pd-local` · Test LL locally: `make test-ll-local`
5. ✅ Add docstrings to modules, classes, and public methods
6. ✅ Use environment-aware selectors when needed (`self.is_sandbox`)
7. ✅ Write descriptive test names
8. ✅ Mark slow tests with `@pytest.mark.slow`
9. ✅ Review video recordings when debugging failures (`test-results/videos/`)
10. ✅ Keep page objects focused and single-purpose
11. ✅ Document test steps with comments and print statements so agents can maintain them
12. ✅ Use `make troubleshoot` to re-run last failures in headed mode
