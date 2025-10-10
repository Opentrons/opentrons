# Git Version 2 - Enhanced Tag Resolution

## Summary

`git-version2.mjs` is an enhanced version of the tag resolution logic with the following improvements:

### Key Changes

1. **Tags must be at HEAD**: Only returns tags that are pointing at the current commit (`git tag --points-at HEAD`)
2. **Branch name fallback**: If no tag exists at HEAD, uses the branch name + short SHA to derive a version
3. **Prefix priority**: When multiple tags exist on the same commit, prefers `protocol-designer@` over `staging-protocol-designer@`
4. **Semver selection**: When multiple tags with the same prefix exist, selects the highest semantic version

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

   - If multiple tags exist, prefer non-staging tags
   - Return the **full tag** as the version:
     - `protocol-designer@8.6.0-alpha.1` → `protocol-designer@8.6.0-alpha.1`
     - `staging-protocol-designer@8.6.0-alpha.4` → `staging-protocol-designer@8.6.0-alpha.4`

2. **Fallback to branch name** if no tags at HEAD

   - Constructs a synthetic tag using the full branch name + short SHA:
     - `chore_release-pd-8.6.0` (at commit `a1b2c3d`) → `protocol-designer@chore_release-pd-8.6.0-a1b2c3d`
     - `edge` (at commit `abc123f`) → `protocol-designer@edge-abc123f`
     - `feature-branch` (at commit `def456a`) → `protocol-designer@feature-branch-def456a`

3. **Error fallback**: Returns `0.0.0-dev` if nothing works

## Testing Results

### Test Case 1: Commit with staging tag only

- Commit: `staging-protocol-designer@8.6.0-alpha.4`
- Result: ✅ Returns full tag `staging-protocol-designer@8.6.0-alpha.4`

### Test Case 2: Commit with both tags

- Commit: Has both `protocol-designer@8.6.0-alpha.1` and `staging-protocol-designer@8.6.0-alpha.2`
- Result: ✅ Prefers `protocol-designer@8.6.0-alpha.1` (returns full tag `protocol-designer@8.6.0-alpha.1`)

### Test Case 3: Branch build with no tag

- Branch: `chore_release-pd-8.6.0` at commit `5c1ad1a883`
- Result: ✅ Returns synthetic tag `protocol-designer@chore_release-pd-8.6.0-5c1ad1a883`

### Test Case 4: Edge branch build

- Branch: `edge` at commit `abc123def4`
- Result: ✅ Returns synthetic tag `protocol-designer@edge-abc123def4`

### Test Case 5: Multiple staging tags (semver selection)

- Tags at HEAD: `staging-protocol-designer@1.1.1`, `staging-protocol-designer@1.1.2`, `staging-protocol-designer@8.6.0-alpha.2`
- Result: ✅ Returns `staging-protocol-designer@8.6.0-alpha.2` (highest semver: 8.6.0 > 1.1.2 > 1.1.1)

### Test Case 6: Prefix priority with semver

- Tags at HEAD: `protocol-designer@8.6.0-alpha.1`, `staging-protocol-designer@8.6.0-alpha.2`
- Result: ✅ Returns `protocol-designer@8.6.0-alpha.1` (prefix priority wins over higher staging version)
