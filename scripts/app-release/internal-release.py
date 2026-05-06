#!/usr/bin/env python3
"""
internal-release - Automated multi-repo internal release tagging script

Usage:
    ./internal-release <version> [--dry-run]

Examples:
    ./internal-release 8.8.0
    ./internal-release 8.8.0 --dry-run

Behavior:
- Takes a version argument like '8.8.0' which maps to internal version '2.8.0'
  (subtracts 6 from the major version).
- In dry-run mode: Only fetches tags from remote (no cloning).
- In normal mode: Creates a fresh 'clean-repos' directory and clones all repos.
- Checks out the default branch for each repo:
    - ot3-firmware: main
    - buildroot: opentrons-develop
    - oe-core: main
    - opentrons: edge
- Determines the alpha version from the buildroot repo's last tag for this version.
- Uses that alpha version + 1 for buildroot and oe-core.
- Tags opentrons with internal@yy.m.d (UTC), or internal@yy.m.d.N for extra same-day builds.

Tag logic:
- ot3-firmware: internal@v23 → internal@v24 (always increments, ignores version arg)
- If buildroot last tag is internal@2.8.0-alpha.5, buildroot and oe-core get alpha.6:
  - buildroot:  internal@2.8.0-alpha.6
  - oe-core:    internal@2.8.0-alpha.6
  - opentrons:  internal@26.4.23 or internal@26.4.23.1 (calendar; see allocate_next_opentrons_internal_tag)
"""

import argparse
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Tuple


# Root directory where clean clones will live
CLEAN_ROOT = Path("./clean-repos")

# Calendar internal tags on opentrons (excludes internal@v*, internal@*.*.*-alpha*, etc.)
OPENTRONS_CALENDAR_TAG_RE = re.compile(
    r'^internal@\d{2}\.[1-9]\d?\.[1-9]\d?(?:\.(\d+))?$'
)

# Configuration: repo info, tag patterns, clone URLs, and branches
REPOS = [
    {
        "name": "ot3-firmware",
        "dir_name": "ot3-firmware",
        "clone_url": "git@github.com:opentrons/ot3-firmware.git",
        "branch": "main",
        "tag_pattern": "internal@v*",
        "tag_type": "internal_numeric",  # internal@v23 → internal@v24
    },
    {
        "name": "buildroot",
        "dir_name": "buildroot",
        "clone_url": "git@github.com:opentrons/buildroot.git",
        "branch": "opentrons-develop",
        "tag_pattern": "internal@*",
        "tag_type": "internal_alpha",  # internal@2.8.0-alpha.6
    },
    {
        "name": "oe-core",
        "dir_name": "oe-core",
        "clone_url": "git@github.com:opentrons/oe-core.git",
        "branch": "main",
        "tag_pattern": "internal@*",
        "tag_type": "internal_alpha",  # internal@2.8.0-alpha.6
    },
    {
        "name": "opentrons",
        "dir_name": "opentrons",
        "clone_url": "git@github.com:opentrons/opentrons.git",
        "branch": "edge",
        "tag_pattern": "internal@*",
        "tag_type": "opentrons_internal",
    },
]


def run_command(cmd: List[str], cwd: Optional[Path] = None, check: bool = True) -> str:
    """Run a shell command and return stdout (stripped)."""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    if check and result.returncode != 0:
        print(f"❌ Command failed: {' '.join(cmd)}")
        print(f"stdout:\n{result.stdout}")
        print(f"stderr:\n{result.stderr}")
        raise subprocess.CalledProcessError(
            result.returncode, cmd, output=result.stdout, stderr=result.stderr
        )
    return result.stdout.strip()


def parse_version(version_str: str) -> Tuple[int, int, int]:
    """Parse version string like '8.8.0' into (major, minor, patch)."""
    m = re.match(r"^(\d+)\.(\d+)\.(\d+)$", version_str)
    if not m:
        raise ValueError(f"Invalid version format: {version_str}. Expected X.Y.Z")
    major, minor, patch = map(int, m.groups())
    return major, minor, patch


def convert_to_internal_version(version_str: str) -> str:
    """Convert '8.8.0' to '2.8.0' (subtract 6 from major version)."""
    major, minor, patch = parse_version(version_str)
    internal_major = major - 6
    if internal_major < 0:
        raise ValueError(f"Version {version_str} results in negative internal major version")
    return f"{internal_major}.{minor}.{patch}"


def get_remote_tags(clone_url: str, tag_pattern: str) -> List[str]:
    """Fetch tags from remote without cloning."""
    try:
        output = run_command(["git", "ls-remote", "--tags", clone_url, tag_pattern])
        if not output:
            return []
        
        tags = []
        for line in output.split("\n"):
            if line.strip():
                # Format: <hash>\trefs/tags/<tag>
                parts = line.split("\t")
                if len(parts) == 2:
                    tag_ref = parts[1]
                    # Extract tag name from refs/tags/<tag>
                    if tag_ref.startswith("refs/tags/"):
                        tag = tag_ref.replace("refs/tags/", "")
                        # Skip ^{} annotations
                        if not tag.endswith("^{}"):
                            tags.append(tag)
        return tags
    except subprocess.CalledProcessError:
        return []


def extract_internal_numeric_version(tag: str) -> int:
    """Extract numeric version from internal@vN tag."""
    m = re.match(r"^internal@v(\d+)$", tag)
    return int(m.group(1)) if m else -1


def get_last_tag_from_list(tags: List[str], tag_type: str, internal_version: str) -> Optional[str]:
    """Get the most recent tag from a list for the given internal version."""
    if not tags:
        return None
    
    # For internal_numeric (ot3-firmware), sort by numeric version
    if tag_type == "internal_numeric":
        numeric_tags = [(t, extract_internal_numeric_version(t)) for t in tags]
        numeric_tags = [(t, n) for t, n in numeric_tags if n >= 0]
        if not numeric_tags:
            return None
        numeric_tags.sort(key=lambda x: x[1], reverse=True)
        return numeric_tags[0][0]
    
    # Sort tags by version for alpha tags
    tags_sorted = sorted(tags, key=lambda t: t, reverse=True)
    
    # For alpha tags, filter to matching version and sort by alpha number
    if tag_type == "internal_alpha":
        prefix = f"internal@{internal_version}-alpha."
    else:
        return None
    
    matching_tags = [t for t in tags if t.startswith(prefix)]
    if not matching_tags:
        return None
    
    def alpha_key(tag: str) -> int:
        # Extract the number after "alpha."
        suffix = tag[len(prefix):]
        try:
            return int(suffix)
        except ValueError:
            return -1
    
    matching_sorted = sorted(matching_tags, key=alpha_key, reverse=True)
    return matching_sorted[0] if matching_sorted else None


def get_last_tag_for_version(repo_path: Path, tag_pattern: str, tag_type: str, internal_version: str) -> Optional[str]:
    """Get the most recent tag matching the pattern for the given internal version."""
    try:
        if tag_type == "opentrons_internal":
            all_tags = run_command(
                ["git", "tag", "-l", tag_pattern, "--merged", "HEAD", "--sort=-creatordate"],
                cwd=repo_path,
            )
            if not all_tags:
                return None
            for tag in all_tags.split("\n"):
                if tag and OPENTRONS_CALENDAR_TAG_RE.match(tag):
                    return tag
            return None

        all_tags = run_command(
            ["git", "tag", "-l", tag_pattern, "--sort=-version:refname"],
            cwd=repo_path,
        )
        if not all_tags:
            return None

        tags = all_tags.split("\n")

        # For internal_numeric (ot3-firmware), just return the latest
        if tag_type == "internal_numeric":
            return tags[0] if tags else None

        # For alpha tags, find the latest tag matching this specific version
        for tag in tags:
            if tag_type == "internal_alpha":
                # internal@2.8.0-alpha.X
                if tag.startswith(f"internal@{internal_version}-alpha."):
                    return tag

        return None
    except subprocess.CalledProcessError:
        return None


def extract_alpha_number(tag: str, tag_type: str) -> Optional[int]:
    """Extract the alpha number from a tag."""
    if tag_type == "internal_alpha":
        m = re.match(r"^internal@\d+\.\d+\.\d+-alpha\.(\d+)$", tag)
        if m:
            return int(m.group(1))
    return None


def determine_next_alpha_number_remote(internal_version: str) -> int:
    """
    Determine the next alpha number by fetching tags from the buildroot repo remotely.
    Returns the next alpha number to use for buildroot and oe-core.
    """
    buildroot_repo = next(r for r in REPOS if r["name"] == "buildroot")

    print("Determining next alpha number from buildroot repo (remote)...")

    tags = get_remote_tags(buildroot_repo["clone_url"], buildroot_repo["tag_pattern"])
    last_tag = get_last_tag_from_list(tags, buildroot_repo["tag_type"], internal_version)
    
    if last_tag:
        alpha_num = extract_alpha_number(last_tag, buildroot_repo["tag_type"])
        if alpha_num is not None:
            next_alpha = alpha_num + 1
            print(f"Found buildroot tag: {last_tag} (alpha.{alpha_num})")
            print(f"Next alpha number will be: {next_alpha}")
            return next_alpha

    print(f"No previous alpha tag found for version {internal_version}")
    print("Starting with alpha.0")
    return 0


def determine_next_alpha_number_local(internal_version: str) -> int:
    """
    Determine the next alpha number by checking the buildroot repo locally.
    Returns the next alpha number to use for buildroot and oe-core.
    """
    buildroot_repo = next(r for r in REPOS if r["name"] == "buildroot")
    buildroot_path = CLEAN_ROOT / buildroot_repo["dir_name"]

    print("Determining next alpha number from buildroot repo...")

    last_tag = get_last_tag_for_version(
        buildroot_path,
        buildroot_repo["tag_pattern"],
        buildroot_repo["tag_type"],
        internal_version,
    )

    if last_tag:
        alpha_num = extract_alpha_number(last_tag, buildroot_repo["tag_type"])
        if alpha_num is not None:
            next_alpha = alpha_num + 1
            print(f"Found buildroot tag: {last_tag} (alpha.{alpha_num})")
            print(f"Next alpha number will be: {next_alpha}")
            return next_alpha

    print(f"No previous alpha tag found for version {internal_version}")
    print("Starting with alpha.0")
    return 0


def count_commits_since_tag(repo_path: Path, tag: str) -> int:
    """Count commits between tag and HEAD."""
    try:
        count = run_command(
            ["git", "rev-list", f"{tag}..HEAD", "--count"],
            cwd=repo_path,
        )
        return int(count)
    except (subprocess.CalledProcessError, ValueError):
        return 0


def _utc_date_parts() -> Tuple[int, int, int]:
    t = datetime.now(timezone.utc)
    return t.year % 100, t.month, t.day


def allocate_next_opentrons_internal_tag(repo_path: Path) -> str:
    """Pick internal@yy.m.d or internal@yy.m.d.N (UTC) not already present in this clone."""
    yy, mm, dd = _utc_date_parts()
    root = f"internal@{yy:02d}.{mm}.{dd}"
    n = 0
    while True:
        candidate = root if n == 0 else f"{root}.{n}"
        check = subprocess.run(
            ["git", "-C", str(repo_path), "rev-parse", candidate],
            capture_output=True,
        )
        if check.returncode != 0:
            return candidate
        n += 1


def allocate_next_opentrons_internal_tag_remote(clone_url: str) -> str:
    """Pick next internal@yy.m.d[.N] from remote tag names (UTC)."""
    tags = {
        t
        for t in get_remote_tags(clone_url, "internal@*")
        if OPENTRONS_CALENDAR_TAG_RE.match(t)
    }
    yy, mm, dd = _utc_date_parts()
    root = f"internal@{yy:02d}.{mm}.{dd}"
    n = 0
    while True:
        candidate = root if n == 0 else f"{root}.{n}"
        if candidate not in tags:
            return candidate
        n += 1


def get_next_tag(last_tag: Optional[str], tag_type: str, internal_version: str, alpha_number: int) -> str:
    """
    Get the next tag based on the tag type and alpha number.
    
    - internal_numeric: internal@v23 → internal@v24
    - internal_alpha:   internal@2.8.0-alpha.{alpha_number}
    """
    if tag_type == "internal_numeric":
        # internal@v23 → internal@v24
        if not last_tag:
            raise ValueError("No previous internal@v* tag found for ot3-firmware")
        m = re.match(r"^internal@v(\d+)$", last_tag)
        if not m:
            raise ValueError(f"Cannot parse internal numeric tag: {last_tag}")
        n = int(m.group(1)) + 1
        return f"internal@v{n}"

    elif tag_type == "internal_alpha":
        return f"internal@{internal_version}-alpha.{alpha_number}"

    else:
        raise ValueError(f"Unknown tag_type: {tag_type}")


def clone_clean_repos() -> None:
    """Delete existing clean-repos dir (if any) and clone all repos fresh on their configured branches."""
    if CLEAN_ROOT.exists():
        print(f"Removing existing directory: {CLEAN_ROOT}")
        shutil.rmtree(CLEAN_ROOT)

    CLEAN_ROOT.mkdir(parents=True, exist_ok=True)
    print(f"Created clean root directory: {CLEAN_ROOT}")
    print()

    for repo in REPOS:
        target_dir = CLEAN_ROOT / repo["dir_name"]
        branch_name = repo["branch"]
        
        print("=" * 60)
        print(f"Cloning {repo['name']} into {target_dir}")
        print("=" * 60)

        run_command(
            ["git", "clone", "--origin", "origin", repo["clone_url"], str(target_dir)]
        )

        print(f"Checking out branch '{branch_name}' for {repo['name']}...")
        run_command(["git", "fetch", "origin"], cwd=target_dir)
        try:
            run_command(["git", "checkout", branch_name], cwd=target_dir)
        except subprocess.CalledProcessError:
            print(f"❌ Branch '{branch_name}' not found in {repo['name']}.")
            sys.exit(1)
        run_command(["git", "pull", "origin", branch_name], cwd=target_dir)


def show_dry_run_info(
    repo_name: str,
    clone_url: str,
    tag_pattern: str,
    tag_type: str,
    internal_version: str,
    alpha_number: int,
) -> None:
    """Show what would be tagged in dry-run mode (remote only)."""
    print("=" * 60)
    print(f"Processing: {repo_name} [DRY RUN - REMOTE ONLY]")
    print(f"Internal version: {internal_version}")
    print("=" * 60)

    if tag_type == "opentrons_internal":
        new_tag = allocate_next_opentrons_internal_tag_remote(clone_url)
        last_tag = None
    else:
        print("Fetching remote tags...")
        tags = get_remote_tags(clone_url, tag_pattern)
        last_tag = get_last_tag_from_list(tags, tag_type, internal_version)
        try:
            new_tag = get_next_tag(last_tag, tag_type, internal_version, alpha_number)
        except ValueError as e:
            print(f"❌ Error determining next tag: {e}")
            print()
            return

    if last_tag:
        print(f"Last tag for this version: {last_tag}")
    elif tag_type != "opentrons_internal":
        print(f"No previous tag found for version {internal_version}.")

    print(f"[DRY RUN] Would create tag: {new_tag}")
    print(f"[DRY RUN] Would run:")
    print(f"  git tag {new_tag}")
    print(f"  git push origin {new_tag}")
    print()


def tag_repo_if_updated(
    repo_name: str,
    repo_path: Path,
    tag_pattern: str,
    tag_type: str,
    internal_version: str,
    alpha_number: int,
    dry_run: bool,
) -> None:
    """Tag a repo if there are new commits since the last matching tag."""
    print("=" * 60)
    print(f"Processing: {repo_name}")
    print(f"Path: {repo_path}")
    print(f"Internal version: {internal_version}")
    print(f"Dry run: {dry_run}")
    print("=" * 60)

    if not repo_path.exists():
        print(f"❌ Error: Repository path {repo_path} does not exist.")
        sys.exit(1)

    print("Fetching tags...")
    run_command(["git", "fetch", "--tags", "origin"], cwd=repo_path)

    if tag_type == "opentrons_internal":
        last_tag = get_last_tag_for_version(repo_path, tag_pattern, tag_type, internal_version)
        new_tag = allocate_next_opentrons_internal_tag(repo_path)
    else:
        last_tag = get_last_tag_for_version(repo_path, tag_pattern, tag_type, internal_version)
        try:
            new_tag = get_next_tag(last_tag, tag_type, internal_version, alpha_number)
        except ValueError as e:
            print(f"❌ Error determining next tag: {e}")
            sys.exit(1)

    # Check if we need to create this tag
    if last_tag:
        print(f"Last tag for this version: {last_tag}")
        
        # If the new tag already exists, check for commits
        if last_tag == new_tag:
            commits_since = count_commits_since_tag(repo_path, last_tag)
            if commits_since == 0:
                print(f"Tag {new_tag} already exists with no new commits. Skipping {repo_name}.")
                print()
                return
            print(f"Found {commits_since} new commit(s) since {last_tag}.")
        else:
            # Different tag, so we're creating a new one
            print(f"Will create new tag: {new_tag}")
    else:
        print(f"No previous tag found for version {internal_version}.")

    print(f"New tag would be: {new_tag}")
    if dry_run:
        print("[DRY RUN] Would run:")
        print(f"  git tag {new_tag}")
        print(f"  git push origin {new_tag}")
    else:
        print(f"Tagging HEAD as {new_tag}...")
        run_command(["git", "tag", new_tag], cwd=repo_path)
        run_command(["git", "push", "origin", new_tag], cwd=repo_path)
        print(f"✅ Tagged and pushed {new_tag} for {repo_name}")

    print()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Automated multi-repo internal release tagging script."
    )
    parser.add_argument(
        "version",
        help="Release version (e.g., 8.8.0). Will be converted to internal version (e.g., 2.8.0).",
    )
    parser.add_argument(
        "-n",
        "--dry-run",
        action="store_true",
        help="Show what would be tagged/pushed without cloning repos (only fetches tags).",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    try:
        internal_version = convert_to_internal_version(args.version)
    except ValueError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

    print("Starting internal release process")
    print(f"Release version: {args.version}")
    print(f"Internal version: {internal_version}")
    print(f"Dry run: {args.dry_run}")
    print()

    if args.dry_run:
        # Dry run mode: only fetch tags remotely
        print("=" * 60)
        print("DRY RUN MODE: Only fetching remote tags (no cloning)")
        print("=" * 60)
        print()
        
        # Determine next alpha number from remote
        print("=" * 60)
        next_alpha = determine_next_alpha_number_remote(internal_version)
        print("=" * 60)
        print()
        
        # Show what would be tagged for each repo
        for repo in REPOS:
            show_dry_run_info(
                repo_name=repo["name"],
                clone_url=repo["clone_url"],
                tag_pattern=repo["tag_pattern"],
                tag_type=repo["tag_type"],
                internal_version=internal_version,
                alpha_number=next_alpha,
            )
    else:
        # Normal mode: clone repos and tag
        clone_clean_repos()

        # Determine the next alpha number from opentrons repo
        print()
        print("=" * 60)
        next_alpha = determine_next_alpha_number_local(internal_version)
        print("=" * 60)
        print()

        # Tag each repo if updated
        for repo in REPOS:
            repo_path = CLEAN_ROOT / repo["dir_name"]
            tag_repo_if_updated(
                repo_name=repo["name"],
                repo_path=repo_path,
                tag_pattern=repo["tag_pattern"],
                tag_type=repo["tag_type"],
                internal_version=internal_version,
                alpha_number=next_alpha,
                dry_run=args.dry_run,
            )

    print("=" * 60)
    print("Internal release process complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()