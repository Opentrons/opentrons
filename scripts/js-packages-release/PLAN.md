---
name: GitHub Packages release + component testing
overview: Unified GitHub Packages release prep for four scoped packages via `scripts/js-packages-release/` (uv + small stdlib Python CLIs), tag `js-packages-release@*`, registry preflight, manifest rewrites, ordered builds. Old `shared-data@` / `components@` NPM jobs to be removed from legacy workflows. Extend `components-testing` for step-generation and protocol-visualization.
todos:
  - id: scaffold-cli
    content: 'scripts/js-packages-release uv project: preflight (registry + semver), manifest rewrite, build orchestration. Remaining: npm publish orchestration in CLI or workflow, optional dry-run.'
    status: in_progress
  - id: step-gen-shippable
    content: 'step-generation publishable (private removed, lib exports/files, Makefile build-ts lib pack).'
    status: completed
  - id: ci-unify
    content: 'Remove NPM publish jobs from shared-data and components workflows; point tag releases at js-packages-release workflow only; adjust notify needs. Partially done: js-packages-release.yaml exists for tag + PR.'
    status: in_progress
  - id: components-testing-pv
    content: 'Extend components-testing to pack/link step-generation and protocol-visualization; paths and SKILL.'
    status: pending
  - id: tests-docs
    content: 'pytest for version parsing/validation rules; document tag and local workflow. Partially done: tests under scripts/js-packages-release/tests; README and Cursor skill added.'
    status: in_progress
---

# Unified GitHub Packages release and components-testing for protocol-visualization

## Implementation status (snapshot)

**Delivered in repo (ongoing work):**

- **`scripts/js-packages-release/`** (not `npm-release`): `publish_core.py`, `publish.py`, `build_packages.py`, `manifests.py`, Makefile, pytest.
- **Tag:** `js-packages-release@<semver>` for workflow and version parsing.
- **Preflight:** non-interactive stdlib Python CLI; rejects invalid semver and wrong tag prefixes; queries GitHub Packages and treats partial and full “already on registry” cases as **errors**.
- **Build chain:** `build_packages.py` runs `make build-ts`, `shared-data lib-js`, `step-generation lib`, components `build-ts` + `lib`, protocol-visualization `build-ts` + `lib`, then optional manifest rewrite.
- **Workflow** [`.github/workflows/js-packages-release.yaml`](../../.github/workflows/js-packages-release.yaml): PR path filters run lint + test; tag push runs **publish** preflight only (no lint or unit tests on the tag).
- **step-generation:** npm-oriented `package.json` and `Makefile` targets (`build-ts`, `lib`, `pack`).

**Not done yet:**

- **`npm publish` to GitHub Packages** for all four packages from CI or from this CLI.
- **Removing** `publish-to-npm` / `publish-components` (and related notify wiring) from legacy workflows.
- **components-testing** parity for four packages.
- Optional **dry-run** and any “resume partial publish” flag (current policy is fail on partial).

---

## Current behavior (pain points), historical

- Versioning and NPM manifest edits lived in CI in [components-test-build-deploy.yaml](../../.github/workflows/components-test-build-deploy.yaml) (`publish-components` on `components@*` tags) and [shared-data-test-lint-deploy.yaml](../../.github/workflows/shared-data-test-lint-deploy.yaml) (`publish-to-npm` gated by `publish-switch` for `shared-data@*` / `components@*` tags).
- NPM publishing was **split across two workflows** and could **race** (ordering not guaranteed).

## Target behavior

- **One Python-oriented toolkit** for local and CI: version resolution, **GitHub Packages registry checks**, manifest rewrites, ordered builds, then **`npm publish`** (publish step still to be wired).
- **Four JS packages**, same semver per release: `@opentrons/shared-data`, `@opentrons/step-generation`, `@opentrons/components`, `@opentrons/protocol-visualization`.
- **GitHub Packages publishing** should eventually **not** run inside shared-data or components test-and-deploy workflows; use the dedicated **`js-packages-release@*`** workflow (and local scripts) as the single entry point.

### Dependency graph

```mermaid
flowchart TD
  sd[@opentrons/shared-data]
  sg[@opentrons/step-generation]
  co[@opentrons/components]
  pv[@opentrons/protocol-visualization]
  sd --> sg
  sd --> co
  sg --> co
  sd --> pv
  sg --> pv
  co --> pv
```

**Publish order:** `shared-data` → `step-generation` → `components` → `protocol-visualization`.

---

## Sections 1–7 (original plan detail)

The sections below are the **original** design notes. Treat the **Implementation status** block at the top as the source of truth for what is merged today. Path names in older bullets may say `scripts/npm-release/`; the actual directory is **`scripts/js-packages-release/`**.

### 1. CLI package (uv + stdlib argparse)

Mirror [scripts/static-deploy/](../static-deploy/): `pyproject.toml`, `Makefile`, README.

Registry checks use `npm view` against GitHub Packages. Manifest rewrite keeps **step-generation** as a dependency of **components** (no deletion of that dependency).

### 2. CI: one workflow + tag

**Still to do:** remove NPM publish from legacy workflows; rely on `js-packages-release.yaml` for the four-package line.

**Done:** dedicated workflow on `js-packages-release@*`, PR checks for this script tree.

### 3. `step-generation`

**Done:** publish-oriented `package.json`, `lib` build via `tsc --build`, Makefile **pack** path.

### 4. `protocol-visualization`

In the build train after components; pins come from `manifests.apply_release_versions` and `PACKAGES` order in `publish_core.py`.

### 5. `components-testing`

**Pending:** pack/link step-generation and protocol-visualization; workflow paths; skill update there.

### 6. Local developer workflow

Use **`publish.py`** with `--version` or `--current`; **`build_packages.py`** with or without `--version`; **`make build-packages`** from `scripts/js-packages-release`.

### 7. Testing and verification

**Ongoing:** keep tests focused on parsing and validation helpers; run **`make -C components-testing test`** after components-testing Makefile changes.

When legacy NPM jobs are removed, **`components@`** / **`shared-data@`** tag pushes should **not** drive the four-package NPM release (migration to **`js-packages-release@`**).
