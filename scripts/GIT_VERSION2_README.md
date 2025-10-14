# Git Version 2 - Enhanced Tag Resolution

## Summary

`git-version2.mjs` provides enhanced tag resolution and build information generation for Protocol Designer with the following features:

### Key Features

1. **Tags must be at HEAD**: Only returns tags that are pointing at the current commit (`git tag --points-at HEAD`)
2. **Branch name fallback**: If no tag exists at HEAD, uses branch name + timestamp + GitHub Run ID for unique versioning
3. **Prefix priority**: When multiple tags exist on the same commit, prefers `protocol-designer@` over `staging-protocol-designer@`
4. **Semver selection**: When multiple tags with the same prefix exist, selects the highest semantic version
5. **Build info HTML**: Automatically generates a detailed build information page at `dist/info/index.html` this is accessible at `/info/` on deployed sites.

### Tag Priority

For protocol-designer project:

1. **Prefix priority** (evaluated first):

   - `protocol-designer@*` (highest priority)
   - `staging-protocol-designer@*` (fallback)

2. **Semver selection** (within same prefix):
   - If multiple tags with same prefix: selects highest semantic version
   - Example: `staging-protocol-designer@1.1.2` wins over `staging-protocol-designer@1.1.1`
   - Example: `protocol-designer@8.6.0-alpha.2` wins over `protocol-designer@8.6.0-alpha.1`

### Version Resolution Logic

1. **Check for tags at HEAD** using `git tag --points-at HEAD`

   - If multiple tags exist, prefer non-staging tags based on prefix priority
   - Return the **full tag** as the version:
     - `protocol-designer@8.6.0-alpha.1` → `protocol-designer@8.6.0-alpha.1`
     - `staging-protocol-designer@8.6.0-alpha.4` → `staging-protocol-designer@8.6.0-alpha.4`

2. **Fallback to branch name** if no tags at HEAD

   - Constructs a synthetic version using: `branch-name` + `timestamp` + `GitHub Run ID` (in CI)
   - Format: `protocol-designer@{branch}-{YYYYMMDD-HHMMSS}-RUN_ID-{run_id}`
   - Examples:
     - Local build: `protocol-designer@edge-20251014-143022`
     - CI build: `protocol-designer@edge-20251014-143022-RUN_ID-12345678`
     - PR build: `protocol-designer@version-script-for-pd-20251014-150530-RUN_ID-87654321`

   **Why timestamp + run ID instead of SHA?**

   - In CI PR builds, the SHA is the ephemeral merge commit, not the actual branch commit
   - Timestamp provides chronological ordering
   - Run ID enables direct linking to the GitHub Actions workflow run

3. **Git describe fallback**: Uses `git describe --tags` if branch name unavailable

4. **Error fallback**: Returns `0.0.0-dev` if nothing works

## Build Info HTML Generation

The script automatically generates a comprehensive build information page at `dist/info/index.html` during the build process. This page can be accessed at `/info/` on deployed sites.

### What's Included

- **Build Details**: Version, timestamp, build date, Node version, platform
- **Git Information**: Branch, commit SHA, author, message, tags at HEAD
- **GitHub Actions Info** (CI builds only):
  - Quick links to workflow run, PR, compare view, branch/tag
  - Run details (ID, number, attempt, job name)
  - Workflow information
  - Actor/triggering user
  - Reference information
  - Repository details

### Accessing Build Info

- Local deployment: `http://localhost:5178/info/` - only available on `make serve`
- Production: `https://designer.opentrons.com/info/` (or your deployed URL)

## Testing Results

### Test Case 1: Commit with staging tag only

- Commit: `staging-protocol-designer@8.6.0-alpha.4`
- Result: ✅ Returns full tag `staging-protocol-designer@8.6.0-alpha.4`

### Test Case 2: Commit with 2 tags having different prefixes

- Commit: Has both `protocol-designer@8.6.0-alpha.1` and `staging-protocol-designer@8.6.0-alpha.2`
- Result: ✅ Prefers `protocol-designer@8.6.0-alpha.1` (returns full tag `protocol-designer@8.6.0-alpha.1`)

### Test Case 3: Branch build with no tag (local)

- Branch: `edge`
- Time: `2025-10-14 14:30:22 UTC`
- Result: ✅ Returns `protocol-designer@edge-20251014-143022`

### Test Case 4: Branch build with no tag (CI)

- Branch: `version-script-for-pd`
- Time: `2025-10-14 15:05:30 UTC`
- Run ID: `12345678`
- Result: ✅ Returns `protocol-designer@version-script-for-pd-20251014-150530-RUN_ID-12345678`

### Test Case 5: Multiple staging tags (semver selection)

- Tags at HEAD: `staging-protocol-designer@1.1.1`, `staging-protocol-designer@1.1.2`, `staging-protocol-designer@8.6.0-alpha.2`
- Result: ✅ Returns `staging-protocol-designer@8.6.0-alpha.2` (highest semver: 8.6.0 > 1.1.2 > 1.1.1)

### Test Case 6: Prefix priority with semver

- Tags at HEAD: `protocol-designer@8.6.0-alpha.1`, `staging-protocol-designer@8.6.0-alpha.2`
- Result: ✅ Returns `protocol-designer@8.6.0-alpha.1` (prefix priority wins over higher staging version)

## Implementation Notes

### Why Timestamp + Run ID Instead of SHA?

In GitHub Actions PR builds, the code is checked out in detached HEAD state at a merge commit. This merge commit's SHA is ephemeral and not meaningful for identifying the actual branch code. Instead:

- **Timestamp**: Provides chronological ordering of builds
- **Run ID**: Enables direct linking to the GitHub Actions workflow run for debugging
- **Branch name**: Identifies which branch was built

### Integration

The script is integrated into Protocol Designer's build process via a Vite plugin in `vite.config.mts`:

This ensures the build info page is automatically generated after every build.
