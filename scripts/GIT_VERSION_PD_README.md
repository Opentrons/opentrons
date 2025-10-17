# Git Version 2 - Enhanced Tag Resolution

## Summary

`scripts/git-version-protocol-designer.mjs` provides deterministic tag resolution and build information generation for Protocol Designer.

### Key Features

1. **Nearest release tag**: Locates the closest tag reachable from `HEAD` for both production (`protocol-designer@`) and staging (`staging-protocol-designer@`) prefixes.
2. **Prefix priority**: When production and staging tags are equally close to `HEAD`, production tags win.
3. **Simple version output**: Always returns the portion to the right of `@` (or removes the leading `v` for robot-stack tags).
4. **Build info HTML**: Generates an info page at `dist/info/index.html` that records branch, timestamp, run metadata, and other diagnostics.

### Tag Priority

For the `protocol-designer` project:

- Prefix search order (from highest to lowest priority):
  1. `protocol-designer@*`
  2. `staging-protocol-designer@*`

Tags are compared by commit distance from `HEAD`; a lower distance signifies a more recent tag. If two prefixes have identical distances, the prefix defined earlier in the list wins.

### Version Resolution Logic

1. **Locate candidate tags**

   - Execute `git describe --tags --abbrev=0 --match=<prefix>*` for each prefix.
   - Ignore prefixes with no reachable tag in the current history.

2. **Determine the best tag**

   - For each candidate tag compute `git rev-list <tag>..HEAD --count`.
   - Pick the tag with the smallest commit count (nearest to `HEAD`).
   - Break ties using the prefix priority list.

3. **Format the version**

   - Return the substring after `@`.
   - Examples:
     - `protocol-designer@8.6.0` → `8.6.0`
     - `staging-protocol-designer@8.7.0-alpha.1` → `8.7.0-alpha.1`

4. **No tags available**

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

- **Case 1: Staging tag nearest to `HEAD`**

  - History: `HEAD` is one commit ahead of `staging-protocol-designer@8.6.0-alpha.4`
  - Result: ✅ Returns `8.6.0-alpha.4`

- **Case 2: Production and staging tags on same commit**

  - Tags: `protocol-designer@8.6.0-alpha.1`, `staging-protocol-designer@8.6.0-alpha.2`
  - Result: ✅ Prefers production prefix and returns `8.6.0-alpha.1`

- **Case 3: Commit ahead of production tag**

  - Tags in history: `protocol-designer@8.6.0`
  - Result: ✅ Returns `8.6.0`

- **Case 4: No matching tags**
  - History: No `protocol-designer@` or `staging-protocol-designer@` tags
  - Result: ✅ Falls back to `0.0.0-dev`

## Implementation Notes

- Commit distance ensures the selected tag always reflects the most recent release relative to `HEAD`.
- Prefix priority retains the previous rule that production tags outrank staging tags when both point to the same commit.
- The build info HTML continues to surface branch, timestamp, run ID, and other metadata for debugging even though the version string is simplified.

## Integration

The script is integrated into Protocol Designer's build process via a Vite plugin in `vite.config.mts`, ensuring the build info page is generated after every build.
