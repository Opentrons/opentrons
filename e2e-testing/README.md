# E2E Testing

> We are keeping this generic and marking tests as unit and PD specific as we will also incorporate in this set of tools:
>
> - HTTP API tests (allows upgrade/downgrade and access testing)
> - App UI tests
> - Labware Library tests

## For PD

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

## Running Tests

### Local Testing

Tests against a local production build (automatically built and served on `http://localhost:4173`):

```bash
make test-pd-local              # Headless by default
```

**Note:** Local tests automatically:

- Look at localhost:4173 to see if a server is running
- Build and serve Protocol Designer with `make -C ../protocol-designer serve` if it's not running
- Wait for the server to be ready
- Clean up the server after tests complete if it was started by the test suite

### Remote Environment Testing

Test against deployed environments:

```bash
make test-pd-staging
make test-pd-prod
```

**Sandbox testing:** Not yet implemented (requires branch-specific URL configuration)

### Custom Environment

Set `TEST_ENV` variable directly:

```bash
make test-pd TEST_ENV=staging   # Equivalent to make test-pd-staging
```

### Debug & Development

**Debug mode** - Slow motion (1000ms), visible browser, verbose output:

```bash
make test-pd-debug
make test-pd-debug TEST_ENV=staging
```

**Test recorder** - Generate test code interactively with Playwright Inspector:

```bash
make codegen                          # Opens localhost:4173
make codegen URL=https://staging.designer.opentrons.com
```

## Architecture

### Page Object Model (POM)

Tests use the **Page Object Model** pattern for maintainability:

> We are not super strict on POM adherence in this age of LLMs, and we might do better with other patterns like Screenplay in some situations.
> Screenplay is a design pattern that focuses on user interactions and goals rather than page structure.

**Page Objects** (`automation/pd_pages/`):

- Encapsulate page structure and element locators
- Provide high-level methods for user interactions
- Inherit from `BasePage` for common functionality

**Tests** (`tests/`):

- Focus on test scenarios and assertions
- Use page objects for all UI interactions
- Marked with `@pytest.mark.slow` for long-running tests

### Key Components

**`conftest.py`** - Pytest configuration:
**`pytest.ini`** - Test settings:
**`pyproject.toml`** - Dependencies & tools:

## Development Workflow

### Code Quality

Run all checks before committing:

```bash
make format typecheck check
```

### Test Organization

- **Fast tests**: Load verification (`test_protocol_designer_loads`)
- **Slow tests**: Full workflows (`@pytest.mark.slow` - `test_full_onboarding_flow`)

### Test Reports and Artifacts

All tests automatically generate comprehensive reports and recordings:

**HTML Report** (`test-results/report.html`):

**Video Recordings** (`test-results/videos/`):

- Videos saved for **all tests** (passing AND failing)
- Format: `<hash>.webm`
- Useful for debugging test failures

**Artifacts in CI:**

- All test results uploaded to GitHub Actions artifacts
- Available in Actions UI for 7 days
- Named: `playwright-results-local` / `playwright-results-staging`
- **DO NOT** commit test-results/ to git (already in `.gitignore`)

## Contributing

1. Write tests using Page Object Model pattern
2. Add new page objects to `automation/pd_pages/`
3. Run `make check` before committing
4. Ensure tests pass locally: `make test-pd-local`
5. Keep page objects environment-aware (use `self.is_sandbox`)
6. Add type annotations (enforced by mypy)
7. Document with comments and print statements the steps the test is trying to take in the UI. With this additional documentation agents are much more effective at maintaining and extending tests.
