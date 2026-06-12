# Python API documentation curation

The Anthropic protocol-generation flow uses a helper model to pick relevant Python API docs before reading file contents. That routing depends on rich `<about>` descriptions in a structure file, not on raw markdown frontmatter alone.

This document explains how synced mkdocs markdown and curated descriptions fit together.

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

| File                                            | Committed?      | Role                                                                  |
| ----------------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `api/storage/api_docs/docs/v2/`                 | No (gitignored) | Synced Python API markdown from pinned `DOCS_TAG`                     |
| `api/storage/api_docs/.docs-tag`                | No              | Records which mkdocs tag was synced                                   |
| `api/storage/api_docs/.api-level`               | No              | Default `apiLevel` from synced `mkdocs.yml`                           |
| `api/storage/api_docs/api_docs_struct.md`       | Yes             | **Generated** structure fed to the helper model at runtime            |
| `api/storage/api_docs/api_docs_struct_about.md` | Yes             | **Source of truth** for curated `<about>` text keyed by markdown path |

Do **not** hand-edit `api_docs_struct.md`. It is regenerated on every `make sync-api-docs`. Edit curation in `api_docs_struct_about.md`.

## Sync pipeline

`make sync-api-docs` (also run by `make setup`, `make local-run`, `make build`, deploy targets):

1. Fetch `docs/python-api/docs` from git tag `DOCS_TAG` (default in Makefile).
2. Copy markdown into `api/storage/api_docs/docs/v2/`.
3. Read `extra.apiLevel` from `docs/python-api/mkdocs.yml`.
4. Regenerate `api_docs_struct.md`:
   - List every `*.md` under the synced tree.
   - For each file, look up `<about>` in `api_docs_struct_about.md`.
   - Fail if any synced doc is missing a curated entry.

Implementation: `api/utils/sync_api_docs.py` (`generate_api_docs_struct`) and `api/utils/api_docs_struct_curated.py` (`load_curated_about`).

## Curated about file format

Edit `api/storage/api_docs/api_docs_struct_about.md` directly. Each entry uses markdown paths (not legacy RST paths):

```markdown
### modules/index.md

<about>
This file is the main index page for the Hardware Modules section...
</about>
```

Guidelines for `<about>` text:

- State whether the file is documentation vs an example protocol.
- Mention OT-2, Flex, or both when relevant.
- List concepts covered (modules, pipettes, labware, liquids, runtime parameters, etc.).
- Note API version constraints when important.
- Write for routing: help the helper model pick this file for the right user questions.

## Setting curation for new or changed docs

When mkdocs adds or renames pages after a tag bump, add or update the matching entry in `api_docs_struct_about.md`, then run:

```shell
cd opentrons-ai-server
make sync-api-docs
make check-api-docs-curation
```

Commit `api_docs_struct_about.md` when `<about>` text changes.

## How you get alerted

There is no silent success when curation drifts. Three layers catch gaps:

### 1. Failure during sync (local feedback)

Every `make sync-api-docs` requires a curated entry for every synced markdown file. Sync fails immediately if anything is missing.

If coverage gaps remain after a partial edit, sync also prints a warning listing orphan curated entries.

### 2. Hard check before merge (`make check-api-docs-curation`)

Exits non-zero on any gap:

```shell
make check-api-docs-curation
```

This runs in CI after `make setup` and is part of `make prep`.

Implementation: `python -m api.utils.api_docs_struct_curated --check`

### 3. Unit test against synced docs

`test_synced_api_docs_have_full_curation_coverage` in `tests/test_sync_api_docs.py` asserts full coverage when `api/storage/api_docs/docs/v2/` exists (true after `make setup` in CI).

### Typical trigger: bumping `DOCS_TAG`

When mkdocs publishes a new tag and you update `DOCS_TAG` in the Makefile:

1. `make setup` syncs the new doc tree.
2. Sync fails until you add `<about>` entries for any new pages.
3. CI fails on `make check-api-docs-curation` until you commit updated `api_docs_struct_about.md`.

## Verification checklist

After changing curation or bumping `DOCS_TAG`:

```shell
make sync-api-docs
```

Confirm:

1. Every synced `*.md` appears in `api_docs_struct.md` with a non-empty `<about>`.
2. Key pages (for example `modules/index.md`, `building-block-commands/liquids.md`) still have long curated descriptions.
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
| `api/utils/api_docs_struct_curated.py` | Load curated about text; coverage checks                  |
| `api/utils/api_docs_metadata.py`       | Read default `apiLevel` from sync manifests               |
| `api/domain/anthropic_predict.py`      | `get_relevant_api_docs`, path resolution, content loading |
| `api/domain/config_anthropic.py`       | `PROMPT_FIND_RELEVANT_DOCS`                               |
