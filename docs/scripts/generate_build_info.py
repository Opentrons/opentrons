"""Generate a Designer-style /info/ build diagnostics page for the docs site.

The HTML layout matches ``scripts/git-version-v2.mjs`` ``generateBuildInfoHtml``.
Docs CI is Python-only, so this shells out to git instead of importing that
module.

Unlike Designer, docs releases are not semver. They are datestamp tags whose
format has changed over time (``mkdocs-2026-09-01``, ``mkdocs-20251210``,
``MKDOCS-202508210900``), so the newest tag is found by tag creation date and
reported verbatim rather than parsed into a version number.
"""

from __future__ import annotations

import argparse
import html
import os
import platform
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PROJECT = "docs"
PRODUCTION_TAG_PATTERNS: tuple[str, ...] = ("mkdocs-*", "MKDOCS-*")
STAGING_TAG_PATTERNS: tuple[str, ...] = ("staging-mkdocs-*", "staging-MKDOCS-*")
TAG_PATTERNS: tuple[str, ...] = PRODUCTION_TAG_PATTERNS + STAGING_TAG_PATTERNS
UNTAGGED_VERSION = "untagged"


def _git(*args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(REPO_ROOT), *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def _git_optional(*args: str) -> str:
    try:
        return _git(*args)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


def _env(name: str, default: str = "N/A") -> str:
    value = os.environ.get(name)
    return value if value else default


def _utc_timestamp(now: datetime) -> str:
    return now.strftime("%Y%m%d-%H%M%S")


def _current_branch() -> str:
    """Return the branch this build is from, preferring GitHub PR metadata.

    Detached CI checkouts report ``HEAD`` from git; ``GITHUB_HEAD_REF`` is the
    pull-request source branch and ``GITHUB_REF_NAME`` is the pushed branch.
    """
    head_ref = os.environ.get("GITHUB_HEAD_REF")
    if head_ref:
        return head_ref
    if os.environ.get("GITHUB_REF_TYPE") == "branch":
        ref_name = os.environ.get("GITHUB_REF_NAME")
        if ref_name:
            return ref_name
    local = _git_optional("rev-parse", "--abbrev-ref", "HEAD")
    if local and local != "HEAD":
        return local
    return "detached"


def _header_label(git_info: dict[str, object]) -> str:
    if "error" in git_info:
        return "unknown"
    branch = str(git_info.get("branch") or "").strip()
    if branch and branch != "detached":
        return branch
    short = str(git_info.get("shortSha") or "").strip()
    return short or "unknown"


def _tags_at_head() -> list[str]:
    output = _git_optional("tag", "--points-at", "HEAD", "--list", *TAG_PATTERNS)
    tags = [line for line in output.splitlines() if line] if output else []
    return tags or ["(none)"]


def _merged_docs_tags() -> list[str]:
    """Return docs tags reachable from HEAD, newest tag creation date first.

    Production tags sort ahead of staging tags created at the same time.
    """
    output = _git_optional(
        "tag",
        "--merged",
        "HEAD",
        "--list",
        *TAG_PATTERNS,
        "--format=%(creatordate:unix)%09%(refname:short)",
    )
    dated: list[tuple[int, int, str]] = []
    for line in output.splitlines():
        created, _, tag = line.partition("\t")
        if not tag or not created.isdigit():
            continue
        is_staging = tag.startswith("staging-")
        dated.append((int(created), -int(is_staging), tag))
    dated.sort(reverse=True)
    return [tag for _, _, tag in dated]


def resolve_docs_version() -> str:
    """Return the newest docs tag reachable from HEAD, or the untagged fallback."""
    tags = _merged_docs_tags()
    if not tags:
        print(
            f"Could not find a {PROJECT} tag reachable from HEAD"
            f" - using {UNTAGGED_VERSION}",
            file=sys.stderr,
        )
        return UNTAGGED_VERSION
    return tags[0]


def _esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def _info_item(label: str, value: str, *, href: str | None = None) -> str:
    if href:
        inner = f'<a href="{_esc(href)}" target="_blank">{_esc(value)}</a>'
    else:
        inner = _esc(value)
    return f"""
                    <div class="info-item">
                        <div class="info-label">{_esc(label)}</div>
                        <div class="info-value">{inner}</div>
                    </div>"""


def render_build_info_html(
    *,
    latest_docs_tag: str,
    now: datetime,
    is_ci: bool,
    git_info: dict[str, object],
    github_info: dict[str, str | None],
) -> str:
    """Render the diagnostics page HTML.

    Args:
        latest_docs_tag: Newest docs tag reachable from HEAD, or ``untagged``.
        now: Build clock (UTC).
        is_ci: Whether this is a CI build.
        git_info: Git metadata or ``{"error": ...}``.
        github_info: GitHub Actions fields (CI only).

    Returns:
        Complete HTML document.
    """
    timestamp = _utc_timestamp(now)
    build_date = now.isoformat()
    badge_class = "ci" if is_ci else "local"
    badge_label = "CI Build" if is_ci else "Local Build"
    runtime = sys.version.split()[0]
    header_label = _header_label(git_info)

    if "error" in git_info:
        git_section = f"""
                    <div class="info-item">
                        <div class="info-label">Error</div>
                        <div class="info-value">{_esc(git_info["error"])}</div>
                    </div>"""
    else:
        tags = git_info.get("tags") or ["(none)"]
        tag_html = "".join(f'<span class="tag">{_esc(tag)}</span>' for tag in tags)
        git_section = f"""
                    <div class="info-grid">
                        {_info_item("Branch", str(git_info.get("branch") or "N/A"))}
                        {_info_item("Commit SHA", str(git_info.get("commitSha", "")))}
                        {_info_item("Short SHA", str(git_info.get("shortSha", "")))}
                        {_info_item("Commit Author", str(git_info.get("commitAuthor", "")))}
                        {_info_item("Commit Date", str(git_info.get("commitDate", "")))}
                        <div class="info-item">
                            <div class="info-label">Tags at HEAD</div>
                            <div class="tag-list">{tag_html}</div>
                        </div>
                    </div>
                    <div class="info-item" style="margin-top: 1rem;">
                        <div class="info-label">Commit Message</div>
                        <div class="commit-message">{_esc(git_info.get("commitMessage", ""))}</div>
                    </div>"""

    github_section = ""
    if is_ci:
        links = []
        if github_info.get("runUrl"):
            links.append(
                _info_item(
                    "Workflow Run",
                    f"View Run #{github_info.get('runNumber')}",
                    href=github_info["runUrl"],
                )
            )
        if github_info.get("prUrl"):
            links.append(_info_item("Pull Request", "View PR", href=github_info["prUrl"]))
        if github_info.get("compareUrl"):
            links.append(
                _info_item(
                    "Compare Changes",
                    f"{github_info.get('baseRef')}...{github_info.get('headRef')}",
                    href=github_info["compareUrl"],
                )
            )
        if github_info.get("branchUrl"):
            links.append(
                _info_item("Branch", str(github_info.get("refName")), href=github_info["branchUrl"])
            )
        if github_info.get("tagUrl"):
            links.append(
                _info_item("Tag", str(github_info.get("refName")), href=github_info["tagUrl"])
            )

        workflow_sha = github_info.get("workflowSha") or "N/A"
        workflow_sha_short = workflow_sha[:7] if workflow_sha != "N/A" else "N/A"
        actor = github_info.get("actor") or "N/A"
        triggering = github_info.get("triggeringActor") or "N/A"
        repository = github_info.get("repository") or "N/A"
        owner = github_info.get("repositoryOwner") or "N/A"
        server = github_info.get("serverUrl") or "https://github.com"

        extra_refs = ""
        if github_info.get("headRef") and github_info["headRef"] != "N/A":
            extra_refs += _info_item("Head Ref (PR)", str(github_info["headRef"]))
        if github_info.get("baseRef") and github_info["baseRef"] != "N/A":
            extra_refs += _info_item("Base Ref (PR)", str(github_info["baseRef"]))

        github_section = f"""
            <div class="section">
                <h2>🚀 GitHub Actions Information</h2>
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">🔗 Quick Links</h3>
                <div class="info-grid">{"".join(links)}</div>
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">📊 Run Details</h3>
                <div class="info-grid">
                    {_info_item("Run ID", str(github_info.get("runId")))}
                    {_info_item("Run Number", str(github_info.get("runNumber")))}
                    {_info_item("Run Attempt", str(github_info.get("runAttempt")))}
                    {_info_item("Job", str(github_info.get("job")))}
                </div>
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">⚙️ Workflow Details</h3>
                <div class="info-grid">
                    {_info_item("Workflow Name", str(github_info.get("workflow")))}
                    {_info_item("Workflow Ref", str(github_info.get("workflowRef")))}
                    {_info_item("Workflow SHA", workflow_sha_short)}
                    {_info_item("Event", str(github_info.get("event")))}
                </div>
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">👤 Actor Information</h3>
                <div class="info-grid">
                    {_info_item("Actor", actor, href=None if actor == "N/A" else f"{server}/{actor}")}
                    {_info_item("Actor ID", str(github_info.get("actorId")))}
                    {_info_item("Triggering Actor", triggering, href=None if triggering == "N/A" else f"{server}/{triggering}")}
                </div>
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">📍 Reference Information</h3>
                <div class="info-grid">
                    {_info_item("Ref", str(github_info.get("ref")))}
                    {_info_item("Ref Name", str(github_info.get("refName")))}
                    {_info_item("Ref Type", str(github_info.get("refType")))}
                    {_info_item("Ref Protected", str(github_info.get("refProtected")))}
                    {extra_refs}
                </div>
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">🏢 Repository Information</h3>
                <div class="info-grid">
                    {_info_item("Repository", repository, href=None if repository == "N/A" else f"{server}/{repository}")}
                    {_info_item("Repository ID", str(github_info.get("repositoryId")))}
                    {_info_item("Repository Owner", owner, href=None if owner == "N/A" else f"{server}/{owner}")}
                    {_info_item("Owner ID", str(github_info.get("repositoryOwnerId")))}
                </div>
            </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Build Information - {_esc(PROJECT)}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }}
        .header h1 {{
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }}
        .version {{
            font-size: 1.5rem;
            font-weight: 600;
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            display: inline-block;
            margin-top: 1rem;
            font-family: 'Monaco', 'Courier New', monospace;
            max-width: 100%;
            overflow-wrap: anywhere;
        }}
        .content {{
            padding: 2rem;
        }}
        .section {{
            margin-bottom: 2rem;
        }}
        .section:last-child {{
            margin-bottom: 0;
        }}
        .section h2 {{
            color: #667eea;
            font-size: 1.3rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #667eea;
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }}
        .info-item {{
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }}
        .info-label {{
            font-weight: 600;
            color: #667eea;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }}
        .info-value {{
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
            color: #333;
            word-break: break-all;
        }}
        .info-value a {{
            color: #667eea;
            text-decoration: none;
        }}
        .info-value a:hover {{
            text-decoration: underline;
        }}
        .tag-list {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }}
        .tag {{
            background: #667eea;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-family: 'Monaco', 'Courier New', monospace;
        }}
        .badge {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
        }}
        .badge.ci {{
            background: #28a745;
            color: white;
        }}
        .badge.local {{
            background: #ffc107;
            color: #333;
        }}
        .commit-message {{
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
            white-space: pre-wrap;
            margin-top: 0.5rem;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 1rem 2rem;
            text-align: center;
            color: #666;
            font-size: 0.85rem;
        }}
        @media (max-width: 768px) {{
            body {{
                padding: 1rem;
            }}
            .header h1 {{
                font-size: 1.5rem;
            }}
            .version {{
                font-size: 1.2rem;
            }}
            .info-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Build Information</h1>
            <div class="version">{_esc(header_label)}</div>
            <div style="margin-top: 1rem;">
                <span class="badge {badge_class}">{badge_label}</span>
            </div>
        </div>
        <div class="content">
            <div class="section">
                <h2>📦 Build Details</h2>
                <div class="info-grid">
                    {_info_item("Project", PROJECT)}
                    {_info_item("Latest Docs Tag", latest_docs_tag)}
                    {_info_item("Build Timestamp", timestamp)}
                    {_info_item("Build Date (ISO)", build_date)}
                    {_info_item("Python Version", runtime)}
                    {_info_item("Platform", f"{sys.platform} ({platform.machine()})")}
                </div>
            </div>
            <div class="section">
                <h2>🌿 Git Information</h2>
                {git_section}
            </div>
            {github_section}
        </div>
        <div class="footer">
            Generated by docs/scripts/generate_build_info.py on {_esc(now.astimezone().strftime("%m/%d/%Y, %I:%M:%S %p"))}
        </div>
    </div>
</body>
</html>
"""


def collect_git_info() -> dict[str, object]:
    """Collect git metadata for the current HEAD."""
    try:
        commit_sha = _git("rev-parse", "HEAD")
        return {
            "branch": _current_branch(),
            "tags": _tags_at_head(),
            "commitSha": commit_sha,
            "shortSha": commit_sha[:7],
            "commitMessage": _git("log", "-1", "--pretty=%B"),
            "commitAuthor": _git("log", "-1", "--pretty=%an"),
            "commitDate": _git("log", "-1", "--pretty=%ci"),
        }
    except (subprocess.CalledProcessError, FileNotFoundError) as error:
        return {"error": str(error)}


def collect_github_info() -> dict[str, str | None]:
    """Collect GitHub Actions environment fields used by the info page."""
    server_url = _env("GITHUB_SERVER_URL", "https://github.com")
    repository = _env("GITHUB_REPOSITORY")
    run_id = os.environ.get("GITHUB_RUN_ID")
    head_ref = os.environ.get("GITHUB_HEAD_REF")
    base_ref = os.environ.get("GITHUB_BASE_REF")
    ref_name = _env("GITHUB_REF_NAME")
    ref_type = _env("GITHUB_REF_TYPE")
    event = _env("GITHUB_EVENT_NAME")

    run_url = None
    if run_id and repository != "N/A":
        run_url = f"{server_url}/{repository}/actions/runs/{run_id}"

    compare_url = None
    if head_ref and base_ref and repository != "N/A":
        compare_url = f"{server_url}/{repository}/compare/{base_ref}...{head_ref}"

    pr_url = None
    github_ref = os.environ.get("GITHUB_REF", "")
    if event == "pull_request" and github_ref.startswith("refs/pull/") and repository != "N/A":
        pr_number = github_ref.split("/")[2]
        pr_url = f"{server_url}/{repository}/pull/{pr_number}"

    branch_url = None
    if ref_type == "branch" and ref_name != "N/A" and repository != "N/A":
        branch_url = f"{server_url}/{repository}/tree/{ref_name}"

    tag_url = None
    if ref_type == "tag" and ref_name != "N/A" and repository != "N/A":
        tag_url = f"{server_url}/{repository}/releases/tag/{ref_name}"

    return {
        "runId": _env("GITHUB_RUN_ID"),
        "runNumber": _env("GITHUB_RUN_NUMBER"),
        "runAttempt": _env("GITHUB_RUN_ATTEMPT"),
        "job": _env("GITHUB_JOB"),
        "workflow": _env("GITHUB_WORKFLOW"),
        "workflowRef": _env("GITHUB_WORKFLOW_REF"),
        "workflowSha": _env("GITHUB_WORKFLOW_SHA"),
        "actor": _env("GITHUB_ACTOR"),
        "actorId": _env("GITHUB_ACTOR_ID"),
        "triggeringActor": _env("GITHUB_TRIGGERING_ACTOR"),
        "event": event,
        "ref": _env("GITHUB_REF"),
        "refName": ref_name,
        "refType": ref_type,
        "refProtected": _env("GITHUB_REF_PROTECTED"),
        "headRef": head_ref or "N/A",
        "baseRef": base_ref or "N/A",
        "repository": repository,
        "repositoryId": _env("GITHUB_REPOSITORY_ID"),
        "repositoryOwner": _env("GITHUB_REPOSITORY_OWNER"),
        "repositoryOwnerId": _env("GITHUB_REPOSITORY_OWNER_ID"),
        "serverUrl": server_url,
        "runUrl": run_url,
        "compareUrl": compare_url,
        "prUrl": pr_url,
        "branchUrl": branch_url,
        "tagUrl": tag_url,
    }


def write_build_info_html(output_path: Path) -> Path:
    """Write ``output_path`` with the current build diagnostics page.

    Args:
        output_path: Destination HTML file (created with parents).

    Returns:
        The path written.
    """
    now = datetime.now(timezone.utc)
    is_ci = os.environ.get("CI") == "true"
    html_document = render_build_info_html(
        latest_docs_tag=resolve_docs_version(),
        now=now,
        is_ci=is_ci,
        git_info=collect_git_info(),
        github_info=collect_github_info(),
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html_document, encoding="utf-8")
    print(f"Build info HTML generated: {output_path}")
    return output_path


def main() -> int:
    """CLI entry point for generating the docs info page."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "output",
        nargs="?",
        default=str(Path(__file__).resolve().parents[1] / "site" / "info" / "index.html"),
        help="HTML output path (default: docs/site/info/index.html)",
    )
    args = parser.parse_args()
    write_build_info_html(Path(args.output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
