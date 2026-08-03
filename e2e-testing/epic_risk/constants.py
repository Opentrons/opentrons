"""Shared limits and defaults for the epic risk analyzer (GitHub + table UI)."""

# Must match pagination limits in github.count_commits_touching_path()
GH_COMMIT_PER_PAGE = 100
GH_COMMIT_MAX_PAGES = 100
GH_COMMIT_CAP = GH_COMMIT_PER_PAGE * GH_COMMIT_MAX_PAGES

# Lower bound for GitHub PR search (`merged:>=…`) so we still find older bug-fix PRs;
# the analysis window for commits is derived from actual PR merge dates.
PR_SEARCH_MERGED_SINCE_YEARS = 15

IGNORED_DOMAINS = frozenset({"🎨 Styling/Assets", "📝 Config/Docs"})

# Compact table column: icon only (full Domain kept for logic)
DOMAIN_KIND_ICON: dict[str, str] = {
    "🖥️ UI / React": "⚛️",
    "⚙️ API / Python": "🐍",
    "🦾 Firmware / C++": "🦾",
    "🐧 OS / Bitbake": "🐧",
    "🎨 Styling/Assets": "🎨",
    "📝 Config/Docs": "📝",
    "📁 Other": "📁",
}

DEFAULT_TICKETS_TEXT = "EXEC-2187, EXEC-2188, EXEC-2189, EXEC-2190"
DEFAULT_REPOS_OPTIONS = [
    "Opentrons/opentrons",
    "Opentrons/ot3-firmware",
    "Opentrons/oe-core",
]
DEFAULT_REPOS_SELECTED = ["Opentrons/opentrons", "Opentrons/ot3-firmware"]

# PR search / view
PR_QUERY_CHUNK_SIZE = 5
