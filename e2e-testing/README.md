# E2E Testing for Protocol Designer

End-to-end tests for the Opentrons Protocol Designer using Playwright and pytest.

## Prerequisites

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Node.js 22.12.0 (for building Protocol Designer locally)

## Quick Start

1. **Install dependencies:**
   ```bash
   make setup
   ```

2. **Install Playwright Chromium browser:**
   ```bash
   make test-setup
   ```

3. **Run tests:**
   ```bash
   make test-local        # Test against local build
   make test-staging      # Test against staging environment
   ```

## Running Tests

### Local Testing

Tests against a local production build (automatically built and served on `http://localhost:4173`):

```bash
make test-local              # Headed mode (visible browser), 250ms slow-mo
make test-local-headless     # Headless mode (no UI)
```

**Note:** Local tests automatically:
- Build Protocol Designer with `make -C ../protocol-designer serve`
- Wait for the server to be ready on port 4173 (or 4174/4175 if occupied)
- Clean up the server after tests complete

### Remote Environment Testing

Test against deployed environments:

```bash
make test-staging            # https://staging.designer.opentrons.com
make test-staging-headless   # Staging in headless mode
make test-prod               # https://designer.opentrons.com (production)
```

**Sandbox testing:** Not yet implemented (requires branch-specific URL configuration)
```bash
make test-sandbox            # Returns TODO error
```

### Custom Environment

Set `TEST_ENV` variable directly:

```bash
make test TEST_ENV=staging   # Equivalent to make test-staging
```

### Debug & Development

**Debug mode** - Slow motion (1000ms), visible browser, verbose output:
```bash
make test-debug
make test-debug TEST_ENV=staging
```

**Test recorder** - Generate test code interactively with Playwright Inspector:
```bash
make codegen                          # Opens localhost:4173
make codegen URL=https://staging.designer.opentrons.com
```

## Test Execution Modes

| Mode | Headless | Slow Motion | Use Case |
|------|----------|-------------|----------|
| Local (default) | No | 250ms | Development, debugging |
| Headless | Yes | 0ms | CI/CD, faster execution |
| Debug | No | 1000ms | Step-by-step debugging |
| CI (automatic) | Yes | 0ms | GitHub Actions |

**Headless mode** is automatically enabled when:
- Running in CI (`CI=true` environment variable)
- Using `-headless` make targets
- Setting `HEADLESS=true` environment variable

## Supported Environments

| Environment | URL | Auto-start Server | Notes |
|-------------|-----|-------------------|-------|
| **local** | `http://localhost:4173` | ✅ Yes (if not running) | Builds & serves production assets |
| **staging** | `https://staging.designer.opentrons.com` | ❌ No | Remote deployment |
| **prod** | `https://designer.opentrons.com` | ❌ No | Production (use sparingly) |
| **sandbox** | TBD | ❌ No | TODO: Branch-specific URLs |

### Using a Background Server Process

The test suite automatically checks if the server is already running before starting a new one. This allows you to run the Protocol Designer in the background for faster test iterations:

**Option 1: Run server in background, tests reuse it automatically**
```bash
# Terminal 1 - Start the server
cd protocol-designer && make serve

# Terminal 2 - Run tests (will detect and reuse existing server)
cd ../e2e-testing && make test-local
```

**Option 2: Explicitly skip server management**
```bash
# Terminal 1 - Start the server
cd protocol-designer && make serve

# Terminal 2 - Run tests with SKIP_SERVER_START
cd ../e2e-testing && SKIP_SERVER_START=true make test-local
```

With `SKIP_SERVER_START=true`, tests will fail immediately if no server is running, making it clear that you need to start it manually.

## Project Structure

```text
e2e-testing/
├── automation/               # Test automation package
│   └── pd_pages/            # Page Object Models for Protocol Designer
│       ├── __init__.py
│       ├── base_page.py              # Base page with common functionality
│       ├── landing_page.py           # Landing/welcome page
│       ├── pipette_modal.py          # Pipette configuration modal
│       ├── module_config_page.py     # Module/fixture selection
│       ├── deck_config_page.py       # Deck configuration
│       └── protocol_editor_page.py   # Protocol editor interactions
├── tests/                    # Test files (pytest discovery)
│   └── pd_sanity_test.py    # Sanity tests using page objects
├── conftest.py              # Pytest fixtures & Playwright config
├── pytest.ini               # Pytest settings
├── pyproject.toml           # Python dependencies & tool config
├── Makefile                 # Build/test/lint targets
├── .gitignore              # Git ignore patterns
└── README.md               # This file
```

## Architecture

### Page Object Model (POM)

Tests use the **Page Object Model** pattern for maintainability:

**Page Objects** (`automation/pd_pages/`):
- Encapsulate page structure and element locators
- Provide high-level methods for user interactions
- Handle environment-specific selectors (via `is_sandbox` property)
- Inherit from `BasePage` for common functionality

**Tests** (`tests/`):
- Focus on test scenarios and assertions
- Use page objects for all UI interactions
- Marked with `@pytest.mark.slow` for long-running tests

**Example:**

```python
from automation.pd_pages import LandingPage, PipetteModal

def test_create_protocol(page: Page, base_url: str) -> None:
    # Use page objects for clear, maintainable test code
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.click_create_protocol()
    
    pipette_modal = PipetteModal(page)
    pipette_modal.select_pipette_type("1-Channel", "1000 µL")
    pipette_modal.save_pipette_selection()
```

### Key Components

**`conftest.py`** - Pytest configuration:
- `browser_context_args()`: Browser viewport & video recording settings
- `browser_type_launch_args()`: Headless mode & slow motion config
- `base_url()`: Environment URL resolution
- `dev_server()`: Auto-starts Protocol Designer for local tests
- `page()`: Pre-configured Playwright Page fixture

**`pytest.ini`** - Test settings:
- Test discovery patterns
- Chromium browser configuration
- 300-second timeout per test
- Pytest markers (`slow`, `integration`)

**`pyproject.toml`** - Dependencies & tools:
- Core: `playwright`, `pytest`, `pytest-playwright`
- Linting: `ruff` (formatting & linting)
- Type checking: `mypy` (strict mode)
- Build: `hatchling` (package builder)

## Development Workflow

### Code Quality

Run all checks before committing:

```bash
make check                   # Run lint + typecheck
make format                  # Auto-format code
make lint                    # Check code style
make typecheck               # Run mypy type checking
```

### Test Organization

- **Fast tests**: Load verification (`test_protocol_designer_loads`)
- **Slow tests**: Full workflows (`@pytest.mark.slow` - `test_full_onboarding_flow`)

Run specific test markers:

```bash
uv run pytest -m slow        # Only slow tests
uv run pytest -m "not slow"  # Skip slow tests
```

### Test Reports and Artifacts

All tests automatically generate comprehensive reports and recordings:

**HTML Report** (`test-results/report.html`):

- Interactive test results with pass/fail status
- Test execution times and metadata
- Self-contained HTML file (includes all assets)
- Generated by pytest-html

**Video Recordings** (`test-results/videos/`):

- Videos saved for **all tests** (passing AND failing)
- Format: `<hash>.webm`
- Automatically linked in HTML report
- Useful for debugging test failures

**Screenshots on Failure** (`test-results/screenshots/`):

- Automatically captured when tests fail
- Full-page screenshots with test name
- Helpful for quick debugging without watching videos

**Artifacts in CI:**

- All test results uploaded to GitHub Actions artifacts
- Available in Actions UI for 7 days
- Named: `playwright-results-local` / `playwright-results-staging`
- **DO NOT** commit test-results/ to git (already in `.gitignore`)

## CI/CD Integration

### GitHub Actions

**Workflow:** `.github/workflows/pd-e2e-test.yaml`

**Jobs:**
1. **e2e-test-local**: Builds Protocol Designer, runs tests against local build
2. **e2e-test-staging**: Runs tests against staging deployment (edge/manual trigger only)

**Workflow:** `.github/workflows/e2e-test-checks.yaml`

**Job:** Runs linting and type checking (`make check`)

**Artifacts:**
- Test results and videos uploaded for all test runs
- Available in Actions UI for 7 days
- Named: `playwright-results-local` / `playwright-results-staging`

## Troubleshooting

**Server fails to start locally:**
- Ensure Protocol Designer builds successfully: `cd ../protocol-designer && make build`
- Check port 4173/4174/4175 availability: `lsof -ti:4173`
- Increase Node.js memory: Already configured to 8GB in PD Makefile

**Tests timeout:**
- Default timeout: 300 seconds per test
- Adjust in `pytest.ini`: `timeout = <seconds>`
- Use `make test-debug` for step-by-step execution

**Headless mode issues:**
- Some UI elements may behave differently in headless mode
- Use `make test-local` (headed) for debugging
- CI automatically uses headless mode

**Import errors:**
- Run `make setup` to sync dependencies
- Ensure package is installed: `uv run python -c "import automation"`

**Type check failures:**
- Run `make typecheck` locally before pushing
- Fix with proper type annotations (see `mypy` errors)
- Tests are exempted from strict typing (see `pyproject.toml`)

## Contributing

1. Write tests using Page Object Model pattern
2. Add new page objects to `automation/pd_pages/`
3. Run `make check` before committing
4. Ensure tests pass locally: `make test-local`
5. Keep page objects environment-aware (use `self.is_sandbox`)
6. Add type annotations (enforced by mypy)
7. Document complex test scenarios

## Migration from Cypress

### Cypress Test Suite Status

The Protocol Designer currently has 13 Cypress test files in `protocol-designer/cypress/e2e/`:

#### ✅ Ported Tests

**`home.cy.ts`** - Home page loading and navigation

- Status: **COMPLETE** (covered by `test_protocol_designer_loads`)
- Location: `tests/pd_sanity_test.py`

**`createNew.cy.ts`** - OT-2 onboarding flow validation

- Status: **PARTIAL** (onboarding flow ported)
- Location: `tests/pd_sanity_test.py::test_full_onboarding_flow`
- Missing: Robot type switching verification

**`urlNavigation.cy.ts`** - Direct URL navigation

- Status: **COMPLETE** (3 tests ported)
- Location: `tests/test_url_navigation.py`
- Tests: Settings, CreateNew, Overview direct navigation

**`settings.cy.ts`** - Settings page and toggle persistence

- Status: **COMPLETE** (toggle persistence test ported)
- Location: `tests/test_settings.py`
- Page Object: `automation/pd_pages/settings_page.py` (new)

**`createNewFlex.cy.ts`** - Flex onboarding and protocol creation

- Status: **COMPLETE** (basic onboarding flow ported and passing)
- Location: `tests/test_create_new_flex.py`
- Coverage: Robot selection, pipette config (1-Ch 50µL), gripper/thermocycler/waste chute questions, reaches Step 2
- Note: Full module placement workflow could be extended in future

**`import.cy.ts`** - Protocol file import testing

- Status: **COMPLETE** (2 tests ported and passing)
- Location: `tests/test_import.py`
- Coverage: Import v7 protocol with migration modal, import v8 protocol without migration modal
- Tests: `test_import_v7_protocol_shows_migration_modal`, `test_import_v8_protocol_no_migration_modal`

#### 🔄 Planned Ports (Remaining Cypress Tests)

**`transferSettings.cy.ts`** - Single-channel transfer step testing

- Priority: **HIGH**
- Complexity: High
- Features: Complete onboarding, labware placement, liquid definition, transfer step
- Dependencies: Extend ProtocolEditorPage with step configuration methods

**`mixSettings.cy.ts`** - Mix step configuration testing

- Priority: **MEDIUM**
- Complexity: Medium
- Features: Mix step creation, volume settings, well selection
- Dependencies: Protocol editor step configuration methods

**`modules.cy.ts`** - Module configuration workflow

- Priority: **HIGH**
- Complexity: Medium
- Features: Thermocycler, Heater-Shaker, Magnetic Block, Temperature Module
- Dependencies: Module step configuration page objects

**`thermocycler.cy.ts`** - Thermocycler step configuration

- Priority: **LOW**
- Complexity: High
- Features: Thermocycler module setup, profile steps, temperature control
- Dependencies: Thermocycler-specific page objects (not created)

**`plateReaderTest.cy.ts`** - Plate reader module testing

- Priority: **LOW**
- Complexity: Medium
- Features: Absorbance plate reader setup, wavelength configuration
- Dependencies: Plate reader page objects (not created)

**`batchEdit.cy.ts`** - Batch edit transformation

- Priority: **LOW**
- Complexity: High
- Features: Multi-step selection, batch editing, transformation operations
- Dependencies: Timeline page objects (not created)

**`testfiles.cy.ts`** - Validate test protocol files

- Priority: **LOW**
- Complexity: Low
- Features: Validates test protocol fixtures are importable
- Dependencies: Import functionality

### Migration Progress

**Total Cypress Test Files:** 13  
**Ported & Passing:** 7 files (54%)  
**Remaining:** 6 files (46%)

#### ✅ **Completed Ports:**

1. **`home.cy.ts`** → `tests/test_home.py` (1 test)
   - Verifies home page loads with all expected elements

2. **`urlNavigation.cy.ts`** → `tests/test_url_navigation.py` (3 tests)
   - Direct URL navigation to /settings, /createNew, /overview

3. **`settings.cy.ts`** → `tests/test_settings.py` (1 test)
   - Settings toggle persistence across navigation

4. **`createNewFlex.cy.ts`** → `tests/test_create_new_flex.py` (1 test)
   - Flex robot protocol creation onboarding workflow

5. **`import.cy.ts`** → `tests/test_import.py` (2 tests)
   - Protocol import with v7 migration modal
   - Protocol import v8 without migration modal

6. **`testfiles.cy.ts`** → `tests/test_testfiles.py` (36 tests)
   - Validates all protocol fixture files (v1-v8) exist and have proper structure

7. **`pd_sanity_test.py`** (Original, not ported from Cypress) (2 tests)
   - Basic smoke tests for page load and onboarding flow

**Total Passing Tests:** 46 tests across 7 files

#### ⏭️ **Skipped / Not Applicable:**

- **`batchEdit.cy.ts`** - Entirely commented out in Cypress (TODO: refactor for new batch edit)

#### 🔄 **Remaining to Port (5 files):**

The remaining Cypress tests use the complex `StepExecutor` pattern which requires significant infrastructure:

1. **`createNew.cy.ts`** - OT-2 onboarding flow
   - Requires: StepExecutor, SetupSteps, SetupVerifications
   - Complexity: Medium (uses step builder pattern)

2. **`transferSettings.cy.ts`** - Single-channel transfer step testing
   - Requires: Full protocol setup + transfer step configuration
   - Complexity: High (end-to-end workflow)

3. **`mixSettings.cy.ts`** - Mix step configuration
   - Requires: Full protocol setup + mix step configuration
   - Complexity: High (similar to transferSettings)

4. **`modules.cy.ts`** - Module configuration workflow
   - Requires: Full protocol setup + module configuration
   - Complexity: High (thermocycler, heater-shaker, mag block, temp module)

5. **`thermocycler.cy.ts`** - Thermocycler detailed configuration
   - Requires: Thermocycler profile steps, state management
   - Complexity: Very High (complex module-specific testing)

6. **`plateReaderTest.cy.ts`** - Plate reader module testing
   - Requires: Plate reader module setup, wavelength config
   - Complexity: High (module-specific testing)

### Next Steps for Porting

To port the remaining tests, we would need to either:

**Option A:** Port the StepExecutor pattern infrastructure
- Port `support/StepBuilder.ts` → Python equivalent
- Port step configuration classes (SetupSteps, ModuleSteps, etc.)
- Port verification classes (SetupVerifications, ModuleVerifications, etc.)
- ~1000-2000 lines of support code

**Option B:** Rewrite tests using direct Playwright API
- Simpler, more maintainable
- Better aligned with existing ported tests
- Each test would be 50-100 lines instead of 10-20 StepExecutor calls
- More readable and easier to debug

### Porting Guidelines

When porting Cypress tests to Playwright:

1. **Review the Cypress test structure:**
   - Identify `describe` blocks (test suites)
   - Identify `it` blocks (individual tests)
   - Note `beforeEach` setup steps
   - Understand custom commands used

2. **Map Cypress commands to Playwright:**
   - `cy.visit()` → `page.goto(base_url)`
   - `cy.get()` → `page.locator()` or `page.get_by_*`
   - `cy.should()` → `expect()` from playwright
   - Custom commands → Page object methods

3. **Create/update page objects:**
   - Add new page objects for missing pages
   - Add methods for new interactions
   - Use environment-aware selectors
   - Add type annotations

4. **Write Playwright test:**
   - Use `def test_<name>(page: Page, base_url: str) -> None:`
   - Import necessary page objects
   - Add `@pytest.mark.slow` if needed
   - Follow POM pattern strictly

5. **Verify equivalence:**
   - Run both Cypress and Playwright versions
   - Compare coverage and assertions
   - Ensure no regressions

### Cypress vs Playwright Patterns

| Cypress Pattern | Playwright Pattern | Page Object Method |
|----------------|-------------------|-------------------|
| `cy.getByTestId('name')` | `page.get_by_test_id('name')` | `self.page.get_by_test_id('name')` |
| `cy.contains('text')` | `page.get_by_text('text')` | `self.page.get_by_text('text')` |
| `cy.should('be.visible')` | `expect(element).to_be_visible()` | `self.wait_for_visible(element)` |
| `cy.click()` | `element.click()` | `self.click_button('name')` |
| `cy.type('text')` | `element.fill('text')` | `self.fill_input('name', 'text')` |
| `cy.closeAnalyticsModal()` | Custom logic | `landing.confirm_welcome_modal()` |

### Test Fixtures & Data

Cypress tests use fixtures in `protocol-designer/cypress/fixtures/`:

- `garbage.txt` - Invalid file test
- `generic_96_tiprack_200ul.json` - Labware definition
- `invalid_json.txt` - Malformed JSON test
- `invalid_labware.json` - Invalid labware test
- Test protocol files (referenced in `TestFiles.ts`)

**TODO:** Migrate necessary fixtures to `e2e-testing/fixtures/` when porting import tests.
