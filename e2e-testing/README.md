# E2E Testing

End-to-end tests for the Opentrons **Protocol Designer (PD)**, **Labware Library (LL)**, and **Opentrons desktop app (Electron)** using Playwright and pytest.

## Prerequisites

- Python 3.12
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Node.js 22 (for building PD / LL locally)

## Quick Start

1. **Install dependencies:**

   ```bash
   make setup test-setup
   ```

2. **Run tests to recreate the failure locally:**

   ```bash
   make test-pd-local
   ```

3. **Troubleshoot in headed mode and only running the failing test:**

   ```bash
   make troubleshoot
   ```

4. If you know the test name you want to run, this is how you watch it run in headed mode:

   ```bash
   make test-pd-local-headed PYTEST_ARGS="-k test_name"
   ```

## Tips

- run `make -C protocol-designer serve` and `make -C labware-library serve` in separate terminals to keep local apps running while you develop tests. This keeps the test framework from spinning them up each test run. This only works if you are not making changes to the PD or LL code. `make serve` does not hot reload.
- If you **are** making changes to PD or LL code, let the test suite handle starting/stopping the apps as needed.
- use `page.highlight(selector)` to debug selectors in headed mode
- have the Playwright MCP installed in your dev environment so that you may prompt agents to run the test and then use the Playwright MCP to recreate test steps and fix the test code. Example prompt: `Run test x and inspect the output and test code and then use the Playwright MCP to fix the test code, explaining as you go`

## Running Tests

### Protocol Designer (PD)

```bash
make test-pd-local                               # Headless, chromium
make test-pd-local-headed                        # Headed, 250ms slow-mo
make test-pd-local PYTEST_ARGS="-k test_name"    # Run one test
make test-pd-staging                             # Against staging
make test-pd-prod                                # Against production
make test-pd-debug                               # Headed, 1000ms slow-mo, verbose
```

### Labware Library (LL)

```bash
make test-ll-local                               # Headless, chromium
make test-ll-local-headed                        # Headed
make test-ll-staging                             # Against staging
make test-ll-prod                                # Against production
```

### Opentrons App (Electron)

Requires a connected Flex/OT-3 (USB or Wi-Fi) or the `fake-robot` dev profile.

```bash
make configure-robot                             # Interactive .env setup
make check-robot                                 # Verify robot connectivity
make test-app-nav                                # Navigation smoke tests
make test-app-nav-headed                         # Headed Electron window
make test-app-device-cards-headed                # Device card exercises (headed)
python main_script.py fake-robot tests/app/nav/  # Dev app + local robot-server
```

Use `--robot-profile fake-robot`, `--robot-name QA1Potato`, or positional args via `main_script.py`.

### Other Targets

```bash
make test-unit               # Unit tests only
make troubleshoot            # Re-run last failures in headed mode
make codegen                 # Playwright Inspector/recorder (localhost:4173)
make codegen URL=<url>       # Record against a custom URL
```

#### make test-compare

> by adding markers and parameters to your test function, you can run it against multiple versions of the app to compare behavior:

```python
@pytest.mark.compare_versions
@pytest.mark.parametrize("pd_base_url", ["http://localhost:5178/", "https://designer.opentrons.com"])
```

**Note:** Local tests automatically:

- Look for an already-running server on the expected ports
- Build and serve the app via `make -C ../protocol-designer serve` or `make -C ../labware-library serve` if nothing is running
- Wait for the server to be ready
- Clean up the server after tests complete if it was started by the test suite

### Custom Environment

```bash
make test-pd TEST_ENV=staging   # Equivalent to make test-pd-staging
make test-ll TEST_ENV=prod      # Equivalent to make test-ll-prod
```

## Directory Layout

- `automation/` — Page objects and shared helpers
  - `base_page.py` — Shared `BasePage` class inherited by all page objects
  - `pd_pages/` — Protocol Designer page objects (import from `automation.pd_pages`)
  - `ll_pages/` — Labware Library page objects (import from `automation.ll_pages`)
  - `app_pages/` — Opentrons desktop app page objects (import from `automation.app_pages`)
  - `app_helpers/` — Electron launch, robot connection, and app-specific helpers
- `tests/` — Test files organized by application
  - `pd/` — PD tests (marked `@pytest.mark.pdE2E`)
  - `ll/` — LL tests (marked `@pytest.mark.llE2E`)
  - `app/` — Opentrons desktop app tests (markers: `smoke`, `device_cards`)
- `open_app.py`, `configure_robot.py`, `main_script.py` — Electron app test runner utilities
- `fixtures/` — Protocol JSON files, labware definitions, and test data
- `conftest.py` — Pytest fixtures for server lifecycle, page creation, video recording, and Applitools
- `eyes.py` — Applitools Eyes wrapper and pytest fixture
- `utility.py` — Shared test helpers

## Architecture

### Page Object Model (POM)

Tests use the **Page Object Model** pattern for maintainability:

> We are not super strict on POM adherence in this age of LLMs, and we might do better with other patterns like Screenplay in some situations.
> Screenplay is a design pattern that focuses on user interactions and goals rather than page structure.

- **`BasePage`** (`automation/base_page.py`) — Shared base class with common helpers (`click_button`, `fill_input`, `wait_for_visible`, etc.). All page objects inherit from it.
- **PD page objects** (`automation/pd_pages/`) — One class per PD screen/feature (landing, protocol editor, step forms, settings, etc.)
- **LL page objects** (`automation/ll_pages/`) — Classes for LL navigation and the Labware Creator wizard
- **Tests** (`tests/pd/`, `tests/ll/`) — Focus on test scenarios and assertions using page objects. Mark with `@pytest.mark.pdE2E` or `@pytest.mark.llE2E`.

### Key Fixtures (conftest.py)

| Fixture       | Scope    | Purpose                                                                                        |
| ------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `pd_base_url` | session  | Resolves PD URL; starts local preview server when `TEST_ENV=local`                             |
| `ll_base_url` | session  | Resolves LL URL; starts local preview server when `TEST_ENV=local`                             |
| `page`        | function | Creates a Playwright page, navigates to the correct app URL based on test markers, saves video |
| `eyes`        | function | Applitools Eyes session (or `None` when disabled)                                              |

### Environment Variables

| Variable             | Default | Notes                                 |
| -------------------- | ------- | ------------------------------------- |
| `TEST_ENV`           | `local` | `local`, `staging`, `prod`, `sandbox` |
| `HEADLESS`           | (unset) | `true` / `false`; overrides default   |
| `SKIP_SERVER_START`  | `false` | Skip automatic server build+serve     |
| `PD_SERVER_URL`      | auto    | Override PD URL                       |
| `LL_SERVER_URL`      | auto    | Override LL URL                       |
| `LL_SERVER_PORT`     | `4176`  | Preferred port for LL local server    |
| `APPLITOOLS_API_KEY` | (unset) | Enable Applitools visual checks       |

## Development Workflow

### Code Quality

Run all checks before committing:

```bash
make format                  # Auto-format (ruff format + ruff check --fix)
make typecheck               # Run mypy
make check                   # lint + typecheck combined
make prep                    # format + typecheck
```

Or use the local CI runner:

```bash
uv run python run_many_tests.py     # format → lint → typecheck, with auto-fix
```

### Composing and Troubleshooting Tests

Use the test skeleton in `e2e-testing/tests/pd/test_pd_skeleton.py` as a basis for a new test.

#### To compose a test with the Playwright Inspector

1. `make codegen`
2. Copy that code into a new test file in `tests/pd/` or `tests/ll/`

#### To troubleshoot an existing test

1. Run the test in headed mode and insert `page.pause()` where you want to debug
2. Copy out the code into the test file

```bash
make test-pd-local-headed PYTEST_ARGS="-k test_pd_skeleton"
```

Or re-run last failures:

```bash
make troubleshoot
```

### Test Organization

- **PD tests** (`tests/pd/`) — Onboarding, imports, protocol steps, settings, drag-and-drop, URL navigation, etc.
- **LL tests** (`tests/ll/`) — Navigation, labware creator forms for well plates, reservoirs, tube racks, etc.
- **Unit tests** — `test_testfiles.py` validates fixture JSON files

### Test Reports and Artifacts

All tests automatically generate comprehensive reports and recordings:

**HTML Report** (`test-results/report.html`)

**Video Recordings** (`test-results/videos/`):

- Videos saved for **all tests** (passing AND failing)
- Named by test function for easy identification
- Useful for debugging test failures

**Artifacts in CI:**

- All test results uploaded to GitHub Actions artifacts
- Available in Actions UI for 7 days
- **DO NOT** commit `test-results/` to git (already in `.gitignore`)

## Contributing

1. Write tests using Page Object Model / Screenplay pattern
2. Add new PD page objects to `automation/pd_pages/`, LL to `automation/ll_pages/`
3. Run `make check` before committing
4. Ensure tests pass locally: `make test-pd-local` / `make test-ll-local`
5. Keep page objects environment-aware (use `self.is_sandbox`)
6. Add type annotations (enforced by mypy)
7. Document test steps with comments and print statements so agents can maintain them
8. Mark PD tests `@pytest.mark.pdE2E`, LL tests `@pytest.mark.llE2E` — never both

## Visual Snapshots (Applitools Eyes)

This project includes an opt-in Applitools Eyes integration for visual snapshots.

### Setup

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Add your Applitools API key:

   ```bash
   APPLITOOLS_API_KEY=...your_key...
   ```

`python-dotenv` will load the nearest `.env` automatically during the test run.

### Usage

Use the `eyes` pytest fixture when you want to capture visual checkpoints.

```python
from playwright.sync_api import Locator, Page

from eyes import Eyes


def test_visual_checkpoint(page: Page, eyes: Eyes | None) -> None:
   # ... navigate using page objects ...

   if eyes is None:
      # Eyes is disabled in headed mode or when APPLITOOLS_API_KEY is missing.
      return

   eyes.check("Main Page")

   timeline: Locator = page.get_by_test_id("TimelineToolbox_scrollContainer")
   eyes.check_element("Timeline Toolbox (stitched)", timeline)
```

Notes:

- If `APPLITOOLS_API_KEY` is not set, the `eyes` fixture yields `None`.
- In headed mode, the `eyes` fixture yields `None` (no visual snapshots).
- Applitools batch name:
  - Local/dev: `dev run | <TEST_ENV>`
  - CI: `CI | <PR branch>`

## CI/CD Integration

### GitHub Actions Workflows

- **`.github/workflows/pd-e2e-test.yaml`** — PD E2E tests
- **`.github/workflows/ll-e2e-test.yaml`** — LL E2E tests
- **`.github/workflows/e2e-test-checks.yaml`** — Lint + typecheck
