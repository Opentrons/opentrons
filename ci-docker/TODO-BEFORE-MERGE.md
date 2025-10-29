# TODO: Before Merging to Edge

This file tracks temporary configurations that must be changed before merging this PR to the `edge` branch.

## Critical Changes Required

### 1. ✅ Container Tag Defaults

**Files to update:**

- `ci-docker/utils/actions.py` (line ~367)
- `.github/workflows/ci-docker-api.yaml` (line ~44)
- `.github/workflows/ci-docker-pd.yaml` (line ~44)

**Change:**

```yaml
# FROM:
DEFAULT_TAG: branch-ci-docker-init

# TO:
DEFAULT_TAG: edge
```

### 2. ✅ Build Workflow Tag Generation

**File:** `.github/workflows/ci-docker-build.yaml` (line ~71)

**Change:**
Remove the temporary tag line:

```yaml
# REMOVE THIS LINE:
type=raw,value=branch-ci-docker-init,enable=${{ github.ref_name == 'ci-docker/init' }}
```

### 3. ✅ Python Code Default

**File:** `ci-docker/utils/actions.py` (line ~367)

**Change:**

```python
# FROM:
tag_parser.add_argument("--default-tag", default="branch-ci-docker-init", help="...")

# TO:
tag_parser.add_argument("--default-tag", default="edge", help="...")
```

## Why These Changes Are Needed

Currently, the default tag points to `branch-ci-docker-init` because:

- The `ci-docker-init` branch is where this feature is being developed
- No container images exist on `edge` yet
- CI jobs need a valid container to pull

Once merged to `edge`:

- The `edge` container will be built and pushed automatically
- All PRs to `edge` will use the `edge` container by default
- Release branches will continue to use `branch-chore_release-*` tags

## Verification Before Merge

- [ ] Search for `ci-docker-init` in all workflow files - should only appear in branch triggers
- [ ] Search for `TODO` comments - all should be addressed
- [ ] Confirm `edge` container builds successfully after merge
- [ ] Test that PRs to `edge` correctly select the `edge` container tag

## Post-Merge Cleanup

After merging and confirming everything works:

- [ ] Delete this `TODO-BEFORE-MERGE.md` file
- [ ] Remove `ci-docker/init` from the build workflow triggers
- [ ] Consider deleting the `branch-ci-docker-init` container tag from GHCR
