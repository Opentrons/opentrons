---
name: static-deploy
description: Conventions for static deploy automation Python CLIs in scripts/static-deploy/. Use when working with deployment scripts, AWS S3/CloudFront automation, or Python CLIs in the static-deploy directory.
---

# Static Deploy — Python CLI Conventions

## Language & Style

- Use `typing` everywhere (arg/return types, `TypedDict`/`Protocol`/`Enum` where helpful)
- **Google-style docstrings** on all public functions/classes
- Keep functions small and pure; isolate I/O and side-effects
- Prefer frozen `dataclasses` for config/value objects; avoid global state
- Use `pathlib.Path`, not `os.path` strings
- Use `subprocess.run(..., check=True, text=True)` for shelling out; return structured results
- Raise custom exceptions (`ValueError` for validation, `RuntimeError` for runtime failures)
- Use a single `rich.console.Console()` instance — create once and reuse

## Tooling

- **Ruff** handles formatting + linting (per `pyproject.toml`)
- **uv** manages Python/venv and runs scripts (e.g., `uv run python deploy.py ...`)
- Provide **Makefile** entry points (`.PHONY` targets) calling `uv run ...`
- **pytest** for testing with descriptive function names (not test classes unless needed)
- **boto3** for AWS; isolate AWS calls from business logic for testability

## CLI Shape

- Use `argparse` from stdlib with clear help text and argument validation
- Support a `--dry-run` flag for safe testing
- Accept `--aws-profile` for local runs; in CI accept env and required inputs via args
- Exit with explicit codes; return `int` from `main()` and call `raise SystemExit(main())`
- If in CI, write markdown summaries to `GITHUB_OUTPUT` when the env var is set
- **Separate parsing/validation logic from execution** — create testable config objects

### Environment Parity

Same code path runs locally and in CI. Only entry points differ:

- **Local**: dev sets flags manually (`--aws-profile`, etc.)
- **CI**: wrapper or Make target builds the same args from CI env

Configuration should be static and deterministic — avoid runtime environment detection.

### Rich Console UX

Use `rich.console.Console` for all human output:

- `style="red"` for errors
- `style="yellow"` for warnings
- `style="green"` for success
- `style="blue"` for info
- `style="green bold"` for major success
- Use `console.rule`, `Status` spinners for long-running steps, `Table` for summaries
- Test console output by mocking `console.print` calls

### Testing Strategy

- Test parsing and configuration logic without mocking tightly-coupled external deps
- Use real configuration objects in tests rather than mocks for integration between components
- Isolate external service calls (AWS) from business logic
- Write focused unit tests for individual functions
- Use descriptive test function names explaining the scenario

### Structure

- Layout: `./` for library code, `./tests/` for tests
- Separate concerns: parsing/validation, configuration resolution, external service operations
- CLI composes these steps, handles args, Rich output, and error mapping
- Keep deployment-specific logic (AWS) separate from configuration and parsing
- Make functions testable by avoiding tight coupling to external services
