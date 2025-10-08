---
applyTo: 'scripts/static-deploy/**'
---

# Prompt to use with Copilot/Cursor

**You are writing idiomatic Python 3.10 CLIs for static deploy automation. Follow these rules strictly:**

## Language & style

- Python 3.10
- Use `typing` everywhere (arg/return types, `TypedDict`/`Protocol`/`Enum` where helpful).
- Use **Google-style docstrings** on all public functions/classes.
- Keep functions small and pure; isolate I/O and side-effects.
- Prefer `dataclasses` frozen for config/value objects; avoid global state.
- Use `pathlib.Path`, not `os.path` strings.
- Use `subprocess.run(..., check=True, text=True)` for shelling out; return structured results.
- Raise custom exceptions (derive from `ValueError` for validation errors, `RuntimeError` for runtime failures) for predictable failures.
- Use `rich.console.Console()` instance consistently - create once and reuse.

## Tooling

- Assume **Ruff** handles formatting + linting (per `pyproject.toml`).
- **uv** is used to manage Python/venv and to run scripts (e.g., `uv run python deploy.py ...`).
- Provide a **Makefile** entry point (`.PHONY` targets) that calls `uv run ...` with args.
- Use `pytest` for testing with clear, descriptive test function names (not test classes unless needed).
- Use boto3 for AWS interactions; isolate AWS calls from business logic for easier testing.

## CLI shape

- Use `argparse` from stdlib with clear help text and argument validation.
- Support a `--dry-run` flag for safe testing.
- Accept a `--aws-profile` for local runs; in CI accept env (`AWS_PROFILE` optional) and required inputs via args.
- Exit with explicit codes; return `int` from `main()` and call `raise SystemExit(main())`.
- If in CI write markdown formatted summaries to GITHUB_OUTPUT file if `GITHUB_OUTPUT` env var is set.
- **Separate parsing/validation logic from execution** - create testable functions that parse args and return configuration objects.

### Environment parity

- The same code path runs in local and CI. Only **entry points differ**:
  - Local: dev sets flags/inputs manually. ENVIRONMENT, APPLICATION, ... (`--aws-profile`, etc.).
  - CI: a wrapper or Make target builds the exact same args from CI env and passes them to the same CLI.
- **Configuration should be static and deterministic** - avoid runtime environment detection when possible.

### Rich console UX

- Use `rich.console.Console` for all human output with consistent styling:
  - `style="red"` for errors (❌)
  - `style="yellow"` for warnings (⚠️)
  - `style="green"` for success (✅)
  - `style="blue"` for info messages
  - `style="green bold"` for major success messages
- Use `console.rule`, `Status` spinners for long-running steps, and `Table` for summaries.
- Keep messages action-oriented and short.
- **Test console output behavior** by mocking `console.print` calls in tests.

### Testing Strategy

- **Test parsing and configuration logic without mocking external dependencies** when those dependencies are tightly coupled.
- Use real configuration objects in tests rather than mocks when testing integration between components.
- **Isolate external service calls** (like AWS) from business logic for easier testing.
- Write focused unit tests for individual functions, not large integration tests.
- Use descriptive test function names that explain the scenario being tested.

### Structure

- Layout: `./` for library code, `./tests/` for tests.
- **Separate concerns**: parsing/validation, configuration resolution, and external service operations.
- CLI composes these steps, handles args, Rich output, and error mapping.
- Keep deployment-specific logic (AWS operations) separate from configuration and parsing logic.
- **Make functions testable** by avoiding tight coupling to external services in core logic.
