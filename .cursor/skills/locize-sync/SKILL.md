---
name: locize-sync
description: Locize i18n synchronization workflow for pushing and downloading translations in the Opentrons monorepo. Use when working with locize_sync.py, localization files in app/src/assets/localization/ or components/src/assets/localization/, or syncing translations.
---

# Locize Synchronization Instructions

## Overview

The Locize synchronization system manages internationalization (i18n) for the Opentrons monorepo. A unified Python script syncs localization files between the codebase and Locize cloud service.

**Dry-Run Mode**: All commands support `--dry-run` to preview actions without making changes.

## Architecture

### Core Components

1. **Sync Script** (`scripts/locize_sync.py`) — Python script executed via `uv run`, two actions:
   - `push-local`: Upload local English and Chinese translations to Locize
   - `download-remote`: Download English and Chinese translations from Locize

2. **Localization Files**
   - **Primary**: `app/src/assets/localization/` — main application translations
   - **Secondary**: `components/src/assets/localization/` — shared component translations
   - English (`en`) is the source of truth; Chinese (`zh`) is downloaded from Locize. Chinese (`zh`) files may be invisible to agents because of the repo's ignore rules.
   - The script consolidates files from `components/` into `app/` before syncing, then unconsolidates back

3. **Authentication** — `LOCIZE_API_KEY` and `LOCIZE_PROJECT_ID` env vars (local `.env` or GitHub Actions secrets)

## Commands

### Push Local Translations (Source of Truth)

```bash
uv run scripts/locize_sync.py push-local
```

Pushes English translations from repo to Locize. The script consolidates `components/` JSON into `app/`, runs `locize-cli sync`, then unconsolidates and formats with `make format-js`.

**When to use**: After updating local English/Chinese strings, before handing to translators, to resolve drift.

### Download Remote Translations (Overwrite Local)

```bash
uv run scripts/locize_sync.py download-remote
```

Downloads English and Chinese translations from Locize, overwriting local files. Consolidates, downloads, unconsolidates, and formats.

**When to use**: After translators finish work, prior to release, to align with remote content.

### Dry-Run Mode

```bash
uv run scripts/locize_sync.py push-local --dry-run
uv run scripts/locize_sync.py download-remote --dry-run
```

Performs consolidation/unconsolidation to validate workspace, displays exact commands, but makes no remote changes.

## Lint and Format the Script

```bash
uvx ruff check --fix scripts/locize_sync.py && uvx ruff format scripts/locize_sync.py
```

## CI/CD Integration

Store credentials in repository secrets: `LOCIZE_API_KEY`, `LOCIZE_PROJECT_ID`.

## References

- Locize CLI: https://github.com/locize/locize-cli
- Locize Web Interface: https://locize.app
- Script: `scripts/locize_sync.py`
