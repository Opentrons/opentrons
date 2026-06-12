# Python API documentation curation

The Anthropic protocol-generation flow uses a helper model to pick relevant Python API docs before reading file contents. That routing depends on rich `<about>` descriptions in a structure file, not on raw markdown frontmatter alone.

This document explains how synced mkdocs markdown, legacy RST-era curation, and new pages fit together.

## Runtime flow

```text
User query
    │
    ▼
get_relevant_api_docs (helper model)
    reads api_docs_struct.md
    matches query concepts to <about> blocks
    returns paths like modules/index.md
    │
    ▼
parse_relevant_files_and_get_content
    resolves each path to api/storage/api_docs/docs/v2/<path>
    loads markdown file contents into the main model context
```

Prompt text for the helper model lives in `api/domain/config_anthropic.py` (`PROMPT_FIND_RELEVANT_DOCS`). It instructs the model to use exact relative markdown paths from the structure file.

## Files and responsibilities

| File                                              | Committed?      | Role                                                                             |
| ------------------------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `api/storage/api_docs/docs/v2/`                   | No (gitignored) | Synced Python API markdown from pinned `DOCS_TAG`                                |
| `api/storage/api_docs/.docs-tag`                  | No              | Records which mkdocs tag was synced                                              |
| `api/storage/api_docs/.api-level`                 | No              | Default `apiLevel` from synced `mkdocs.yml`                                      |
| `api/storage/api_docs/api_docs_struct.md`         | Yes             | **Generated** structure fed to the helper model at runtime                       |
| `api/storage/api_docs/api_docs_struct_about.json` | Yes             | **Source of truth** for curated `<about>` text keyed by markdown path            |
| `api/storage/api_docs/api_docs_struct_v2.25.md`   | Yes             | **Legacy archive** of RST-path curation (historical reference + bootstrap input) |

Do **not** hand-edit `api_docs_struct.md`. It is regenerated on every `make sync-api-docs`. Edit curation in `api_docs_struct_about.json` or the override dicts in `api/utils/api_docs_struct_curated.py`.

## Sync pipeline

`make sync-api-docs` (also run by `make setup`, `make local-run`, `make build`, deploy targets):

1. Fetch `docs/python-api/docs` from git tag `DOCS_TAG` (default in Makefile).
2. Copy markdown into `api/storage/api_docs/docs/v2/`.
3. Read `extra.apiLevel` from `docs/python-api/mkdocs.yml`.
4. Regenerate `api_docs_struct.md`:
   - List every `*.md` under the synced tree.
   - For each file, look up `<about>` in `api_docs_struct_about.json`.
   - If no curated entry exists, fall back to frontmatter `description` or the first body paragraph (auto-summary).

Implementation: `api/utils/sync_api_docs.py` (`generate_api_docs_struct`) and `api/utils/api_docs_struct_curated.py` (`load_curated_about`).

## Legacy curation migration

Before mkdocs sync, curation lived in `api_docs_struct_v2.25.md` with paths like `docs/v2/new_modules.rst`. The new docs use markdown paths like `modules/index.md`.

### Step 1: Parse legacy struct

`parse_legacy_struct_entries()` reads `api_docs_struct_v2.25.md` and extracts each:

```markdown
### N. docs/v2/some_file.rst

<about>
...curated LLM description...
</about>
```

### Step 2: Map legacy RST path to markdown path

Mapping is implemented in `legacy_rst_path_to_md_path()` in `api/utils/api_docs_struct_curated.py`. Three cases:

**A. Explicit renames** (`LEGACY_RST_TO_MD`)

Used when mkdocs reorganized or renamed files. Examples:

| Legacy RST path                              | Synced markdown path                      |
| -------------------------------------------- | ----------------------------------------- |
| `docs/v2/new_modules.rst`                    | `modules/index.md`                        |
| `docs/v2/new_atomic_commands.rst`            | `building-block-commands/index.md`        |
| `docs/v2/new_protocol_api.rst`               | `reference/protocols.md`                  |
| `docs/v2/basic_commands/pipette_tips.rst`    | `building-block-commands/pipette-tips.md` |
| `docs/v2/advanced_control/motor_control.rst` | `advanced-control/robot-motors.md`        |
| `docs/v2/modules/stacker.rst`                | `modules/flex-stacker.md`                 |
| `docs/v2/parameters/use_case_dry_run.rst`    | `runtime-parameters/use-case-dry-run.md`  |

The full map is in `LEGACY_RST_TO_MD` in `api/utils/api_docs_struct_curated.py`. The same map is used at runtime when resolving legacy RST paths returned by older prompts or tests (`AnthropicPredict._api_doc_resolve_path`).

**B. Mechanical conversion** (default for unlisted RST paths)

For paths under `docs/v2/` not in the explicit map:

- Strip the `docs/v2/` prefix.
- Replace `_` with `-` in the filename stem.
- Change `.rst` to `.md`.
- Example: `docs/v2/deck_slots.rst` → `deck-slots.md`
- Example: `docs/v2/modules/heater_shaker.rst` → `modules/heater-shaker.md`

**C. Special skips and merges**

| Legacy path pattern              | Result                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `docs/v2/conf.py`                | Skipped (not documentation)                                                                                   |
| `docs/v2/example_protocols/*.py` | Mapped to `examples.md` (legacy struct had separate entries; curation uses the `new_examples.rst` about text) |
| Duplicate targets                | First legacy entry wins                                                                                       |

### Step 3: Apply post-migration overrides

After legacy migration, two override dicts in `api_docs_struct_curated.py` patch gaps:

- **`REFERENCE_ABOUT_OVERRIDES`**: The old monolithic `new_protocol_api.rst` entry became many `reference/*.md` pages. Each reference page gets its own curated `<about>`.
- **`NEW_DOCS_ABOUT_OVERRIDES`**: Pages that did not exist in v2.25 (for example `modules/concurrent.md`, `liquid-class-tables/*.md`).

### Step 4: Write committed JSON

```shell
cd opentrons-ai-server
uv run --python 3.12 python -m api.utils.api_docs_struct_curated
```

Writes `api_docs_struct_about.json`. Commit this file when curation changes.

## Setting curation for new or changed docs

When mkdocs adds or renames pages after a tag bump:

### 1. Doc existed in legacy struct under a new path

Add or update an entry in `LEGACY_RST_TO_MD`, then regenerate JSON:

```shell
uv run --python 3.12 python -m api.utils.api_docs_struct_curated
make sync-api-docs
```

### 2. Brand-new page (no legacy RST equivalent)

Preferred: edit `api_docs_struct_about.json` directly:

```json
{
  "some/new-page.md": "Curated description for the helper model: topics covered, robot types, related concepts."
}
```

Or add to `NEW_DOCS_ABOUT_OVERRIDES` in `api_docs_struct_curated.py` and regenerate JSON.

Guidelines for `<about>` text (match legacy v2.25 style):

- State whether the file is documentation vs an example protocol.
- Mention OT-2, Flex, or both when relevant.
- List concepts covered (modules, pipettes, labware, liquids, runtime parameters, etc.).
- Note API version constraints when important.
- Write for routing: help the helper model pick this file for the right user questions.

### 3. No curated entry yet

`make sync-api-docs` still works. The struct file uses auto-summary from frontmatter or the first paragraph. Auto-summary is weaker for routing; add curation before relying on new pages in production.

## How you get alerted

There is no silent success when curation drifts. Three layers catch gaps:

### 1. Warnings during sync (local feedback)

Every `make sync-api-docs` (including `make setup`) compares synced markdown paths to `api_docs_struct_about.json`. If anything is missing or stale, sync **still completes** but prints a warning to stderr listing:

- **Missing curation:** synced `.md` files with no JSON entry (common after bumping `DOCS_TAG` when mkdocs added pages)
- **Orphan curation:** JSON entries with no matching synced file (common after renames/removals)

### 2. Hard check before merge (`make check-api-docs-curation`)

Exits non-zero on any gap:

```shell
make check-api-docs-curation
```

This runs in CI after `make setup` and is part of `make prep`. Fix gaps by editing `api_docs_struct_about.json` (or override dicts in `api_docs_struct_curated.py`), then re-run sync.

Implementation: `python -m api.utils.api_docs_struct_curated --check`

### 3. Unit test against synced docs

`test_synced_api_docs_have_full_curation_coverage` in `tests/test_sync_api_docs.py` asserts full coverage when `api/storage/api_docs/docs/v2/` exists (true after `make setup` in CI).

### Typical trigger: bumping `DOCS_TAG`

When mkdocs publishes a new tag and you update `DOCS_TAG` in the Makefile:

1. `make setup` syncs the new doc tree.
2. Sync warns about any new `.md` files lacking curation.
3. CI fails on `make check-api-docs-curation` until you add `<about>` entries and commit `api_docs_struct_about.json`.

Renames may also require new `LEGACY_RST_TO_MD` entries if the helper model or tests still reference old RST paths.

## Verification checklist

After changing curation or bumping `DOCS_TAG`:

```shell
make sync-api-docs
```

Confirm:

1. Every synced `*.md` appears in `api_docs_struct.md` with a non-empty `<about>`.
2. Key pages (for example `modules/index.md`, `building-block-commands/liquids.md`) still have long curated descriptions, not one-line frontmatter.
3. `grep -c '<about>' api/storage/api_docs/api_docs_struct.md` matches the number of markdown files synced.

Run unit tests and the coverage check:

```shell
make unit-test
make check-api-docs-curation
```

## Related code

| Module                                 | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `api/utils/sync_api_docs.py`           | Sync docs from git tag; generate `api_docs_struct.md`     |
| `api/utils/api_docs_struct_curated.py` | Legacy mapping, overrides, JSON load/save                 |
| `api/utils/api_docs_metadata.py`       | Read default `apiLevel` from sync manifests               |
| `api/domain/anthropic_predict.py`      | `get_relevant_api_docs`, path resolution, content loading |
| `api/domain/config_anthropic.py`       | `PROMPT_FIND_RELEVANT_DOCS`                               |
