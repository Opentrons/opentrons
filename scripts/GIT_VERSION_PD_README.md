# Git Version Protocol Designer - Semantic Version Resolution

## Summary

`scripts/git-version-protocol-designer.mjs` provides semantic version-based tag resolution and build information generation for Protocol Designer.

### Key Features

1. **Semantic version resolution**: Finds the highest semantic version among all tags reachable from `HEAD` for both production (`protocol-designer@`) and staging (`staging-protocol-designer@`) prefixes.
2. **Prerelease support**: Properly handles prerelease versions like `-alpha.0`, `-beta.1`, etc., following semver precedence rules.
3. **Prefix priority**: When production and staging tags have identical versions, production tags win.
4. **Simple version output**: Always returns the portion to the right of `@`.
5. **Build info HTML**: Generates an info page at `dist/info/index.html` that records branch, timestamp, run metadata, and other diagnostics.

### Tag Priority and Semver Rules

For the `protocol-designer` project:

- **Version comparison**: Tags are compared using semantic versioning (semver) rules
  - Stable releases take precedence over prerelease versions of the same version (e.g., `8.6.0` > `8.6.0-beta.1`)
  - Higher version numbers always win (e.g., `8.7.0-alpha.1` > `8.6.0`)
  - Prerelease ordering: `alpha` < `beta` < `rc` < stable
  - Prerelease numbers are compared numerically (e.g., `alpha.2` > `alpha.1`)

- **Prefix priority** (tie-breaker when versions are identical):
  1. `protocol-designer@*` (production)
  2. `staging-protocol-designer@*` (staging)

When production and staging tags have the exact same version, the production prefix wins.

### Version Resolution Logic

1. **Collect all reachable tags**
   - Execute `git tag --merged HEAD --list <prefix>*` for each prefix.
   - This returns all tags reachable from the current `HEAD` that match the prefix.
   - Ignore prefixes with no reachable tags in the current history.

2. **Parse and validate versions**
   - Extract the version string from each tag (the part after `@`).
   - Parse each version using semver to validate it's a valid semantic version.
   - Skip any tags that don't have valid semver.

3. **Determine the highest version**
   - Sort all valid tags by semantic version using `semver.rcompare()` (highest first).
   - If multiple tags have the same version, use prefix priority as a tie-breaker.
   - Select the first tag from the sorted list (highest version with highest priority prefix).

4. **Format the version**
   - Return the substring after `@`.
   - Examples:
     - `protocol-designer@8.6.0` → `8.6.0`
     - `staging-protocol-designer@8.7.0-alpha.1` → `8.7.0-alpha.1`
     - `protocol-designer@8.6.0-beta.2` → `8.6.0-beta.2`

5. **No tags available**
   - If no matching tags are found, log an error and return `0.0.0-dev`.

## Build Info HTML Generation

The script automatically generates a comprehensive build information page at `dist/info/index.html` during the build process. This page can be accessed at `/info/` on deployed sites.

### What's Included

- **Build Details**: Version, timestamp, build date, Node version, platform
- **Git Information**: Branch, commit SHA, author, message, tags at `HEAD`
- **GitHub Actions Info** (CI builds only):
  - Quick links to workflow run, PR, compare view, branch/tag
  - Run details (ID, number, attempt, job name)
  - Workflow information
  - Actor/triggering user
  - Reference information
  - Repository details
- **Environment Details**: Timestamp and GitHub run IDs remain on the info page even though they no longer appear in the version string.

### Accessing Build Info

- Local deployment: `http://localhost:5178/info/` — available during `make serve`
- Production: `https://designer.opentrons.com/info/` (or your deployed URL)

## Testing Results

- **Case 1: Highest semantic version selection**
  - Available tags: `protocol-designer@8.5.0`, `protocol-designer@8.6.0`, `protocol-designer@8.7.0`
  - Result: ✅ Returns `8.7.0` (highest version)

- **Case 2: Staging tag with higher version beats production tag**
  - Available tags: `protocol-designer@8.6.0`, `staging-protocol-designer@8.7.0-alpha.1`
  - Result: ✅ Returns `8.7.0-alpha.1` (higher semver)

- **Case 3: Production prefix priority with identical versions**
  - Available tags: `protocol-designer@8.6.0-alpha.1`, `staging-protocol-designer@8.6.0-alpha.1`
  - Result: ✅ Returns `8.6.0-alpha.1` from production prefix

- **Case 4: Stable release preferred over prerelease of same version**
  - Available tags: `protocol-designer@8.6.0-beta.5`, `protocol-designer@8.6.0`
  - Result: ✅ Returns `8.6.0` (stable > prerelease)

- **Case 5: Prerelease ordering**
  - Available tags: `protocol-designer@8.6.0-alpha.1`, `protocol-designer@8.6.0-beta.1`
  - Result: ✅ Returns `8.6.0-beta.1` (beta > alpha)

- **Case 6: No matching tags**
  - History: No `protocol-designer@` or `staging-protocol-designer@` tags
  - Result: ✅ Falls back to `0.0.0-dev`

## Implementation Notes

- **Semantic versioning**: Uses the `semver` package to properly compare versions according to semver rules.
- **All reachable tags**: Considers all tags reachable from `HEAD`, not just the nearest one, ensuring the highest version is always selected.
- **Prerelease handling**: Correctly handles prerelease identifiers (`alpha`, `beta`, `rc`) with proper ordering and numeric comparison.
- **Prefix priority**: Production tags outrank staging tags when versions are identical, maintaining backward compatibility.
- **Build info HTML**: Continues to surface branch, timestamp, run ID, and other metadata for debugging.

## Integration

The script is integrated into Protocol Designer's build process via a Vite plugin in `vite.config.mts`, ensuring the build info page is generated after every build.
