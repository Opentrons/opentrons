# Analyses Snapshot Testing Instructions

## Overview

The `analyses-snapshot-testing` directory is a dedicated testing framework for **snapshot testing of Opentrons protocol analyses**. It validates that protocol analysis output remains consistent across code changes by comparing JSON analysis results against committed snapshots.

## Purpose

- **Regression Testing**: Detect unintended changes in protocol analysis behavior
- **Protocol Validation**: Ensure protocols analyze correctly across different robot types (OT-2 and Flex)
- **CI/CD Integration**: Automated testing in GitHub Actions with matrix-based parallel execution
- **Snapshot Management**: Track expected analysis output and flag deviations

## Architecture

### Core Components

1. **Protocol Files** (`files/protocols/`)
   - Testing protocols organized by source:
     - Standard protocols
     - Protocol Designer exports (`protocol_designer/`)
     - Protocol Library imports (`protocol_library/`, `manual_protocol_library/`)
     - Generated protocols with overrides (`generators/`, `generated_protocols/`)

2. **Analysis Engine** (`automation/analyze.py`)
   - Runs protocol analysis using local Opentrons code
   - Executes in subprocess for isolation
   - Generates JSON analysis results
   - 120-second timeout per protocol

3. **Snapshot Storage** (`tests/__snapshots__/`)
   - Committed JSON snapshots of expected analysis output
   - Managed by `syrupy` pytest plugin
   - Custom JSON extension for normalized comparisons

4. **Test Suite** (`tests/`)
   - `analyses_snapshot_test.py`: Main snapshot comparison tests
   - `audit_snapshot_test.py`: Validates analysis outcomes match test intentions
   - `custom_json_snapshot_extension.py`: Custom snapshot serialization logic

5. **Protocol Registry** (`automation/data/`)
   - `protocols.py`: Auto-generated registry of standard protocols
   - `protocols_with_overrides.py`: Manual registry of override protocols
   - `protocol_registry.py`: Combines both registries for test execution

6. **CI/CD Infrastructure** (`citools/`, `.github/workflows/`)
   - Matrix-based parallel execution via GitHub Actions
   - Chunk-based protocol distribution for performance
   - Docker-based analysis for consistent environments

## Protocol Naming Convention

Protocol files follow a strict naming pattern (in order):

```
{Robot}_{Status}_{Version}_{Source}_{Pipettes}_{Modules}_{Overrides}_{Description}
```

### Components:

- **Robot**: `OT2` or `Flex`
- **Status**: `S` (Success) or `X` (Failure/Error expected)
- **Version**: API version (e.g., `v2_19`) or `PD` (Protocol Designer)
- **Source** (optional):
  - `PL_` = Protocol Library (auto-imported)
  - `MPL_` = Manual Protocol Library
- **Pipettes**: Pipette types used (e.g., `P1000M_P50M`)
- **Modules**: Module abbreviations:
  - `GRIP` = Gripper
  - `HS` = Heater-Shaker
  - `MM` = Magnetic Module
  - `MB` = Magnetic Block
  - `TC` = Thermocycler
  - `TM` = Temperature Module
- **Overrides**: `Overrides` if protocol has parameter overrides
- **Description**: Max 25 characters

### Example:

```
Flex_S_v2_19_P1000M_GRIP_HS_TM_MB_KAPALibraryQuant.py
OT2_X_v2_18_NO_PIPETTES_Overrides_BadTypesInRTP.py
```

## Development Workflow

### Adding New Protocols

1. **Create protocol file** in appropriate `files/protocols/` subfolder following naming convention
2. **Run** `make prep`:
   - Auto-updates `automation/data/protocols.py`
   - Displays command to generate snapshots for new protocols
3. **Generate snapshots** using displayed command:
   ```bash
   make snapshot-test-update PROTOCOL_NAMES=YourProtocolName OVERRIDE_PROTOCOL_NAMES=none
   ```
4. **Commit** protocol file + snapshot + updated `protocols.py`

### Adding Override Protocols

1. **Create generator** in `files/protocols/generators/`
2. **Manually add** entry to `automation/data/protocols_with_overrides.py`
3. **Generate snapshots**:
   ```bash
   make snapshot-test-update PROTOCOL_NAMES=none OVERRIDE_PROTOCOL_NAMES=YourOverrideProtocol
   ```
4. **Commit** generator + snapshot + updated registry

### Updating Snapshots

When analysis behavior legitimately changes:

```bash
# Update all snapshots
make snapshot-test-update

# Update specific protocol snapshots
make snapshot-test-update PROTOCOL_NAMES="Protocol1,Protocol2" OVERRIDE_PROTOCOL_NAMES=none
```

### Running Tests Locally

```bash
# All tests (runs with reduced verbosity, shows only failures)
make snapshot-test

# Specific protocols
make snapshot-test PROTOCOL_NAMES=Flex_S_v2_19_Example OVERRIDE_PROTOCOL_NAMES=none

# Multiple protocols
make snapshot-test PROTOCOL_NAMES="Protocol1,Protocol2" OVERRIDE_PROTOCOL_NAMES=Override1

# For more verbose output during debugging, add pytest flags
uv run python -m pytest -k analyses_snapshot_test -vv --tb=short
```

## Code Modification Guidelines

### When Modifying Analysis Logic (`api/`, `shared-data/`)

1. **Run snapshot tests** to detect changes in analysis output
2. **Review diffs carefully** - understand why output changed
3. **Update snapshots** only if changes are intentional and correct
4. **Document** breaking changes in commit messages

### When Modifying Test Infrastructure

#### Protocol Registry (`automation/data/protocols.py`)

- **DO NOT** manually edit - auto-generated by `make prep`
- Regenerate after adding/removing protocols
- Commit changes with protocol additions

#### Snapshot Extension (`tests/custom_json_snapshot_extension.py`)

- Normalizes timestamps, IDs, file paths for stable comparisons
- Add new normalization rules to `replacement_patterns`
- Add new ID-like fields to `id_keys_to_replace`
- Test changes thoroughly - affects all snapshots

#### Analysis Engine (`automation/analyze.py`)

- Runs in subprocess for isolation
- Maintain 120-second timeout
- Preserve JSON output format
- Handle custom labware from `files/labware/`

### When Adding Dependencies

1. **Add to** `pyproject.toml` dependencies
2. **Run** `make setup` to sync environment
3. **Test** locally before committing
4. **Document** if dependency affects analysis behavior

## CI/CD Integration

### GitHub Actions Workflow

The workflow (`analyses-snapshot-test.yaml`) runs on:

- **Pull Requests** affecting `api/`, `shared-data/`, or this directory
- **Scheduled** daily at 7:26 AM UTC
- **Manual dispatch** with option to auto-open PR on failure

### Execution Flow

1. **collect-chunks**: Splits protocols into ~25-protocol chunks for parallelization
2. **process-chunk**: Matrix job analyzes each chunk in parallel
3. **execute-tests**: Consolidates results and runs snapshot comparisons
4. **Optional PR**: Auto-opens PR with updated snapshots if labeled or requested

### PR Label: `gen-analyses-snapshot-pr`

Add this label to a PR to automatically:

- Generate updated snapshots on test failure
- Open a new PR with snapshot updates
- Streamline snapshot update workflow

## Environment Setup

### Prerequisites

- **Python 3.10+**
- **uv** package manager (https://github.com/astral-sh/uv)
- **Node.js/yarn** (for prettier formatting)

### Initial Setup

```bash
cd analyses-snapshot-testing
make setup  # Creates uv virtual environment and installs dependencies
```

### Environment Bootstrap (`bootstrap_uv_env.py`)

The setup script:

1. Creates/syncs uv virtual environment (Python 3.10)
2. Extracts exact pins from `../api/pyproject.toml` and `../shared-data/pyproject.toml`
3. Installs pinned dependencies
4. Installs `api` and `shared-data` as editable packages
5. Ensures analysis uses local code, not released versions

## File Organization

```
analyses-snapshot-testing/
├── files/
│   ├── protocols/          # Testing protocols
│   ├── labware/            # Custom labware definitions
│   └── csv/                # CSV data files for protocols
├── automation/
│   ├── analyze.py          # Core analysis engine
│   ├── data/
│   │   ├── protocols.py            # Auto-generated protocol registry
│   │   ├── protocols_with_overrides.py  # Manual override registry
│   │   └── protocol_registry.py    # Registry manager
│   └── analysis_matrix.py  # Matrix analysis utilities
├── tests/
│   ├── analyses_snapshot_test.py          # Main snapshot tests
│   ├── audit_snapshot_test.py             # Audit tests
│   ├── custom_json_snapshot_extension.py  # Snapshot serialization
│   └── __snapshots__/                     # Committed snapshots
├── citools/
│   ├── Dockerfile.analyze   # Analysis container
│   └── generate_analyses.py # CI analysis generation
├── analysis_results/         # Generated analysis JSON (gitignored)
├── chunks/                   # Test chunks for CI (gitignored)
├── pyproject.toml           # Dependencies and config
├── Makefile                 # Common commands
└── README.md                # User documentation
```

## Best Practices

### Protocol Development

1. **Follow naming convention** strictly - enables auto-discovery
2. **Test locally** before committing
3. **Include docstrings** explaining protocol purpose
4. **Use descriptive names** within 25-character limit
5. **Commit snapshots** with protocol files

### Snapshot Management

1. **Review diffs** before updating snapshots
2. **Understand changes** - don't blindly update
3. **Update atomically** - protocol + snapshot in same commit
4. **Document** breaking changes in commit/PR description
5. **Run audit tests** to validate snapshot intentions

### Performance

1. **Use specific protocol names** when testing locally
2. **Leverage chunks** for CI parallelization
3. **Keep protocols focused** - avoid overly complex test cases
4. **Monitor timeout** - keep protocols under 120 seconds
5. **Chunk size** currently 25 protocols - adjust in `automation/data/collect.py`

## Troubleshooting

### Snapshot Mismatch

```
AssertionError: assert snapshot == data
```

**Cause**: Analysis output changed
**Resolution**:

1. Review diff to understand change
2. If intentional: `make snapshot-test-update PROTOCOL_NAMES=FailingProtocol OVERRIDE_PROTOCOL_NAMES=none`
3. If unintentional: Fix analysis code

### Protocol Not Found

```
No protocols were resolved from the protocol names provided
```

**Cause**: Protocol not in registry or typo in name
**Resolution**:

1. Check `automation/data/protocols.py` for correct name
2. Run `make prep` to regenerate registry
3. Verify protocol file exists and follows naming convention

### Analysis Timeout

```
TimeoutError: Analysis exceeded 120 seconds
```

**Cause**: Protocol too complex or infinite loop
**Resolution**:

1. Simplify protocol or optimize code
2. Increase timeout in `automation/analyze.py` (line ~24)
3. Check for blocking operations

### Environment Issues

```
ModuleNotFoundError: No module named 'opentrons'
```

**Cause**: Environment not properly set up
**Resolution**:

1. Run `make setup` from `analyses-snapshot-testing/` directory
2. Ensure `uv` is installed
3. Check `bootstrap_uv_env.py` completed successfully

## Common Commands

```bash
# Setup
make setup                    # Initial environment setup
make teardown                # Remove virtual environment

# Testing
make snapshot-test            # Run all snapshot tests (reduced verbosity)
make snapshot-test-update     # Update all snapshots
make snapshot-audit-test      # Validate snapshot audit metadata

# Protocol Management
make prep                     # Regenerate protocol registry
make generate-protocols       # Generate override protocols

# Formatting
make format                   # Format Python + Markdown
make ruff                     # Format and lint Python
make ruff-check              # Check formatting without changes

# CI Simulation
make gen-chunks              # Generate protocol chunks
make analyze-chunk CHUNK=chunk_0.json  # Analyze specific chunk

# Auditing
make audit                   # Audit snapshot metadata

# Debugging (verbose output)
uv run python -m pytest -k analyses_snapshot_test -vv --tb=short  # Verbose test output
```

## Integration Points

### With `api/`

- Uses `opentrons.cli.analyze` for analysis execution
- Depends on protocol execution engine
- Validates API changes don't break existing protocols

### With `shared-data/`

- Loads labware definitions
- Validates deck configuration changes
- Tests module compatibility

### With CI/CD

- Triggered on `api/` or `shared-data/` changes
- Blocks merges if snapshots don't match (unless updated)
- Auto-updates snapshots via label or manual dispatch

## Maintenance

### Regular Tasks

- **Weekly**: Review scheduled test failures
- **Per PR**: Validate snapshot changes are intentional
- **Monthly**: Audit protocol coverage and remove obsolete protocols
- **Per release**: Verify all snapshots match release branch

### When Opentrons Version Bumps

1. Update `ANALYSIS_REF` in Makefile or workflow
2. Regenerate all snapshots for new version
3. Review breaking changes
4. Update documentation

### Deprecating Protocols

1. Remove protocol file from `files/protocols/`
2. Run `make prep` to update registry
3. Remove snapshot from `tests/__snapshots__/`
4. Commit all changes together

## Additional Resources

- Main README: `analyses-snapshot-testing/README.md`
- Syrupy docs: https://github.com/tophat/syrupy
- UV docs: https://github.com/astral-sh/uv
- Workflow: `.github/workflows/analyses-snapshot-test.yaml`
