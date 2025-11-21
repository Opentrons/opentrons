# Locize Synchronization Instructions

## Overview

The Locize synchronization system manages internationalization (i18n) for the Opentrons monorepo. It provides a unified Python script for syncing localization files between the local codebase and Locize cloud service, usable both locally and in CI/CD pipelines.

**Dry-Run Mode**: All commands support `--dry-run` flag to preview actions without making changes.

## Purpose

- **Centralized Localization**: Manage all translation files through Locize cloud service
- **Bidirectional Sync**: Push English source strings and download translated content
- **CI/CD Integration**: Automated synchronization via GitHub Actions
- **Version Control**: Track localization changes alongside code changes

## Architecture

### Core Components

1. **Sync Script** (`scripts/locize_sync.py`)
   - Python script executed via `uv run` for consistent dependency management
   - Two primary actions:
     - `push-local`: Upload local English and Chinese translations to Locize
     - `download-remote`: Download English and Chinese translations from Locize
   - **Consolidation Step**: Automatically copies localization files from `components/` to `app/` before syncing
   - Reads credentials from environment variables
   - Compatible with local development and CI environments

2. **Localization Files**
   - **Primary Location**: `app/src/assets/localization/` - Main application translations
   - **Secondary Location**: `components/src/assets/localization/` - Shared component translations
   - **Consolidation/Unconsolidation**: The script temporarily copies files from components to app before syncing (as Locize CLI requires all files in one directory), then copies downloaded translations back to components and removes them from app
   - Contains JSON translation files organized by language code (`en/`, `zh/`)
   - English (`en`) serves as the source of truth
   - Translated languages (currently `zh` for Chinese) are downloaded from Locize
   - **Note**: Future updates will reorganize localization files into a single centralized directory for simplified access

3. **Authentication**
   - `LOCIZE_API_KEY`: API key for Locize service (write access for push operations)
   - `LOCIZE_PROJECT_ID`: Project identifier for the Opentrons Locize project
   - Stored in:
     - Local: Environment variables or `.env` file
     - CI: GitHub Actions secrets

## Script Actions

### 1. Push Local Translations (Source of Truth)

Push English translations from the repo to Locize. This treats the local files as the canonical source when kicking off translation work or correcting remote drift.

```bash
uv run scripts/locize_sync.py push-local
```

**Equivalent npx command:**

```bash
npx -y locize-cli@latest sync \
  --api-key $LOCIZE_API_KEY \
  --project-id $LOCIZE_PROJECT_ID \
  -p ./app/src/assets/localization \
  --language en \
  --update-values true \
  --skip-delete false \
  --ver latest
```

**Behavior:**

- Consolidates: copies `components/src/assets/localization/{en,zh}` JSON into `app/src/assets/localization/{en,zh}` so Locize CLI can read a single tree
- Executes `locize-cli sync` with `--language en`, `--update-values true`, `--skip-delete false`, `--ver latest`
- Uses Locize's published translations as the server source (ensure the target version auto-publishes)
- Only the reference language (`en`) is pushed, overwriting Locize's published English content when `--update-values true` per the [locize-cli sync docs](https://github.com/locize/locize-cli?tab=readme-ov-file#synchronize-locize-with-your-repository-or-any-other-local-directory)
- Unconsolidates: copies JSON back to `components/` and removes the temporary duplicates under `app/`
- Formats all JavaScript/TypeScript files via `make format-js`; skipped in `--dry-run`

**When to use:**

- After updating local English or Chinese strings
- Before handing work to translators so Locize has the newest keys
- To resolve drift by making the repo the source of truth again

### 2. Download Remote Translations (Overwrite Local)

Download both English and Chinese translations from Locize, overwriting local files and then unconsolidating back into their original directories. Downloading English keeps ordering consistent even if no changes are expected.

```bash
uv run scripts/locize_sync.py download-remote
```

**Equivalent npx command:**

```bash
npx -y locize-cli@latest download \
  --api-key $LOCIZE_API_KEY \
  --project-id $LOCIZE_PROJECT_ID \
  --language en,zh \
  --path ./app/src/assets/localization \
  --ver latest
```

**Behavior:**

- Consolidates `components/` JSON into `app/` like the push command
- Executes `locize-cli download` with `--language en,zh` and `--ver latest`, overwriting the consolidated files with the published remote content
- Unconsolidates: copies downloaded JSON back to `components/` and deletes the consolidated copies under `app/`
- Formats all JavaScript/TypeScript files via `make format-js`; skipped in `--dry-run`

**When to use:**

- After translators finish work in Locize
- Prior to release to pull the final translations
- Any time you want to align local files with remote ordering/content

### Dry-Run Mode

Preview what would happen without making any changes:

```bash
uv run scripts/locize_sync.py push-local --dry-run
uv run scripts/locize_sync.py download-remote --dry-run
```

**Behavior:**

- Performs consolidation and unconsolidation exactly as a real run so the workspace structure is validated, but returns the repo to its original state at the end
- Displays the exact npx commands that would be executed
- Locize CLI is invoked with `--dry=true`, so no remote content is changed, and Prettier is skipped
- Useful for:
  - Verifying what files will be affected
  - Understanding the workflow before executing
  - Testing the script configuration
  - CI validation without side effects

## Lint and Format the script

```bash
uvx ruff check --fix scripts/locize_sync.py && uvx ruff format scripts/locize_sync.py
```

## CI/CD Integration

### GitHub Actions Setup

Store credentials in repository secrets:

- `LOCIZE_API_KEY`: Locize API key (Settings → Secrets → Actions)
- `LOCIZE_PROJECT_ID`: Locize project ID (Settings → Secrets → Actions)

## References

- Locize CLI Documentation: https://github.com/locize/locize-cli
- Locize Web Interface: https://locize.app
- Project Structure: `/scripts/locize_sync.py`
