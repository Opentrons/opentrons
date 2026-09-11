#!/usr/bin/env python3
"""
chore-release - Automated multi-repo alpha release tagging script

Usage:
    ./chore-release [--dry-run] [--clean-dir CLEAN_DIR]

Examples:
    ./chore-release
    ./chore-release --dry-run

Behavior:
- Creates a fresh 'clean-repos' directory.
- Clones ot3-firmware, buildroot, oe-core, opentrons into that directory.
- Detects the latest `chore_release-X.Y.Z` branch from the opentrons repo.
- Asks you to confirm using that branch for all repos.
- Clones each repo directly on that branch (single-branch, shallow clone for speed).
- For each repo, in this order:
    1. ot3-firmware
    2. buildroot
    3. oe-core
    4. opentrons
  - Finds the last tag matching the configured tag pattern.
  - If there are new commits since that tag, increments the tag and (unless dry-run) pushes it.
- Removes the 'clean-repos' directory after completion.

Tag increment logic:
- ot3-firmware: v67       → v68       (numeric bump)
- buildroot:    v1.19.6   → v1.19.7   (patch bump)
- oe-core:      v0.9.7    → v0.9.8    (patch bump)
- opentrons:
    - v8.8.0-alpha.6 → v8.8.0-alpha.7
    - v8.8.0         → v8.9.0-alpha.0
"""

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional, Tuple, List


# Default root directory where clean clones will live (overridable via CLI)
DEFAULT_CLEAN_ROOT = Path("./clean-repos")

# Configuration: repo info, tag patterns, and clone URLs
# Branch will be determined dynamically as the latest chore_release-X.Y.Z from opentrons
REPOS = [
    {
        "name": "ot3-firmware",
        "dir_name": "ot3-firmware",
        "clone_url": "git@github.com:opentrons/ot3-firmware.git",
        "tag_pattern": "v[0-9]*",
        "tag_type": "numeric",  # v67 → v68
    },
    {
        "name": "buildroot",
        "dir_name": "buildroot",
        "clone_url": "git@github.com:opentrons/buildroot.git",
        "tag_pattern": "v[0-9]*",
        "tag_type": "semver",  # v1.19.6 → v1.19.7
    },
    {
        "name": "oe-core",
        "dir_name": "oe-core",
        "clone_url": "git@github.com:opentrons/oe-core.git",
        "tag_pattern": "v[0-9]*",
        "tag_type": "semver",  # v0.9.7 → v0.9.8
    },
    {
        "name": "opentrons",
        "dir_name": "opentrons",
        "clone_url": "git@github.com:opentrons/opentrons.git",
        "tag_pattern": "v[0-9]*.[0-9]*",   # Semver robot-stack tags (v9.1.0, v9.1.0-alpha.1, ...)
        "tag_type": "alpha",   # alpha logic described below
    },
]


def run_command(cmd: List[str], check: bool = True) -> str:
    """Run a shell command and return stdout (stripped)."""
    result = subprocess.run(
        cmd,
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

def git(repo_path: Path, args: List[str], check: bool = True) -> str:
    """Run a git command scoped to a repo via `git -C <path> ...`."""
    return run_command(["git", "-C", str(repo_path), *args], check=check)


def get_last_tag(repo_path: Path, tag_pattern: str) -> Optional[str]:
    """Get the most recent tag matching the pattern."""
    try:
        tags = git(repo_path, ["tag", "-l", tag_pattern, "--sort=-version:refname"])
        if tags:
            return tags.split("\n")[0]
        return None
    except subprocess.CalledProcessError:
        return None


def count_commits_since_tag(repo_path: Path, tag: str) -> int:
    """Count commits between tag and HEAD."""
    try:
        count = git(repo_path, ["rev-list", f"{tag}..HEAD", "--count"])
        return int(count)
    except (subprocess.CalledProcessError, ValueError):
        return 0


def increment_tag(last_tag: str, tag_type: str) -> str:
    """
    Increment a tag based on its type.

    - semver:  v1.19.6 → v1.19.7 (increments patch)
    - alpha:
        - v8.8.0-alpha.6 → v8.8.0-alpha.7 (increments alpha number)
        - v8.8.0         → v8.9.0-alpha.0 (increments minor, starts alpha series)
    - numeric:
        - v67 → v68 (increments the integer after 'v')
    """
    if tag_type == "semver":
        match = re.match(r"^v(\d+)\.(\d+)\.(\d+)$", last_tag)
        if not match:
            raise ValueError(f"Cannot parse semver tag: {last_tag}")
        major, minor, patch = match.groups()
        new_patch = int(patch) + 1
        return f"v{major}.{minor}.{new_patch}"

    elif tag_type == "alpha":
        alpha_match = re.match(r"^(v\d+\.\d+\.\d+-alpha\.)(\d+)$", last_tag)
        if alpha_match:
            prefix, alpha_num = alpha_match.groups()
            new_alpha_num = int(alpha_num) + 1
            return f"{prefix}{new_alpha_num}"

        semver_match = re.match(r"^v(\d+)\.(\d+)\.(\d+)$", last_tag)
        if semver_match:
            major, minor, _patch = semver_match.groups()
            new_minor = int(minor) + 1
            return f"v{major}.{new_minor}.0-alpha.0"

        raise ValueError(f"Cannot parse tag for alpha increment: {last_tag}")

    elif tag_type == "numeric":
        m = re.match(r"^v(\d+)$", last_tag)
        if not m:
            raise ValueError(f"Cannot parse numeric tag: {last_tag}")
        n = int(m.group(1)) + 1
        return f"v{n}"

    else:
        raise ValueError(f"Unknown tag_type: {tag_type}")


def parse_chore_release_branch(name: str) -> Optional[Tuple[int, int, int]]:
    """Parse 'chore_release-X.Y.Z' → (X, Y, Z) as ints, or None if no match."""
    m = re.match(r"^chore_release-(\d+)\.(\d+)\.(\d+)$", name)
    if not m:
        return None
    major, minor, patch = map(int, m.groups())
    return major, minor, patch


def find_latest_chore_release_branch(clone_url: str) -> str:
    """
    List all remote chore_release-* branches from the opentrons repo and return
    the one with the highest X.Y.Z version.
    """
    print("Finding latest chore_release-* branch from opentrons...")

    # Output lines look like:
    # <sha>\trefs/heads/chore_release-8.8.0
    refs = run_command(["git", "ls-remote", "--heads", clone_url, "chore_release-*"])
    branches: List[str] = []
    for line in refs.splitlines():
        parts = line.split()
        if len(parts) != 2:
            continue
        _sha, ref = parts
        prefix = "refs/heads/"
        if ref.startswith(prefix):
            branches.append(ref[len(prefix) :])

    if not branches:
        print("❌ No remote chore_release-* branches found in opentrons.")
        sys.exit(1)

    best_branch = None
    best_version: Optional[Tuple[int, int, int]] = None

    for name in branches:
        ver = parse_chore_release_branch(name)
        if ver is None:
            continue
        if best_version is None or ver > best_version:
            best_version = ver
            best_branch = name

    if best_branch is None:
        print("❌ No valid chore_release-X.Y.Z branches found in opentrons.")
        sys.exit(1)

    print(f"Detected latest chore release branch: {best_branch}")
    return best_branch


def clone_clean_repos(branch_name: str, clean_root: Path) -> None:
    """Delete existing clean-repos dir (if any) and clone all repos fresh on the given branch."""
    if clean_root.exists():
        print(f"Removing existing directory: {clean_root}")
        shutil.rmtree(clean_root)

    clean_root.mkdir(parents=True, exist_ok=True)
    print(f"Created clean root directory: {clean_root}")
    print(f"Using branch: {branch_name}")
    print()

    for repo in REPOS:
        target_dir = clean_root / repo["dir_name"]
        print("=" * 60)
        print(f"Cloning {repo['name']} into {target_dir}")
        print("=" * 60)

        try:
            # Fast clone: single branch, shallow history.
            run_command(
                [
                    "git",
                    "clone",
                    "-b",
                    branch_name,
                    "--single-branch",
                    "--depth",
                    "1",
                    repo["clone_url"],
                    str(target_dir),
                ]
            )
        except subprocess.CalledProcessError:
            print(f"❌ Branch '{branch_name}' not found in {repo['name']}.")
            sys.exit(1)


def cleanup_repos(clean_root: Path) -> None:
    """Remove the clean-repos directory."""
    if clean_root.exists():
        print()
        print("=" * 60)
        print(f"Cleaning up: Removing {clean_root}")
        print("=" * 60)
        shutil.rmtree(clean_root)
        print(f"✅ Removed {clean_root}")


def tag_repo_if_updated(
    repo_name: str,
    repo_path: Path,
    tag_pattern: str,
    tag_type: str,
    dry_run: bool,
) -> None:
    """Tag a repo if there are new commits since the last matching tag."""
    print("=" * 60)
    print(f"Processing: {repo_name}")
    print(f"Path: {repo_path}")
    print(f"Dry run: {dry_run}")
    print("=" * 60)

    if not repo_path.exists():
        print(f"❌ Error: Repository path {repo_path} does not exist.")
        sys.exit(1)

    print("Fetching tags...")
    git(repo_path, ["fetch", "--tags", "origin"])

    last_tag = get_last_tag(repo_path, tag_pattern)

    if not last_tag:
        print(f"❌ No previous tag found matching '{tag_pattern}' in {repo_name}.")
        print("Cannot auto-increment. Please create an initial tag manually.")
        sys.exit(1)

    print(f"Last tag: {last_tag}")
    commits_since = count_commits_since_tag(repo_path, last_tag)

    if commits_since > 0:
        print(f"Found {commits_since} new commit(s) since {last_tag}.")

        try:
            new_tag = increment_tag(last_tag, tag_type)
        except ValueError as e:
            print(f"❌ Error incrementing tag: {e}")
            sys.exit(1)

        print(f"New tag would be: {new_tag}")
        if dry_run:
            print("[DRY RUN] Would run:")
            print(f"  git tag {new_tag}")
            print(f"  git push origin {new_tag}")
        else:
            print(f"Tagging HEAD as {new_tag}...")
            git(repo_path, ["tag", new_tag])
            git(repo_path, ["push", "origin", new_tag])
            print(f"✅ Tagged and pushed {new_tag} for {repo_name}")
    else:
        print(f"No new commits since {last_tag}. Skipping tag for {repo_name}.")

    print()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Automated multi-repo alpha release tagging script."
    )
    parser.add_argument(
        "-n",
        "--dry-run",
        action="store_true",
        help="Show what would be tagged/pushed without making changes.",
    )
    parser.add_argument(
        "--clean-dir",
        default=str(DEFAULT_CLEAN_ROOT),
        help=(
            "Directory where clean clones will be created. "
            f"Default: {DEFAULT_CLEAN_ROOT}"
        ),
    )
    return parser.parse_args()


def main():
    args = parse_args()
    clean_root = Path(args.clean_dir)

    print("Starting alpha release process")
    print(f"Dry run: {args.dry_run}")
    print(f"Clean dir: {clean_root}")
    print()

    try:
        # 1) Determine latest chore_release-* branch from opentrons
        opentrons_clone_url = next(r["clone_url"] for r in REPOS if r["name"] == "opentrons")
        latest_branch = find_latest_chore_release_branch(opentrons_clone_url)

        # 2) Confirm with user
        answer = input(f"Use branch '{latest_branch}' for all repos? [Y/n]: ").strip().lower()
        if answer not in ("", "y", "yes"):
            print("Aborting by user request.")
            sys.exit(0)

        # 3) Prepare clean clones on that branch
        clone_clean_repos(branch_name=latest_branch, clean_root=clean_root)

        # 4) Tag each repo if updated (in the configured order:
        #    ot3-firmware → buildroot → oe-core → opentrons)
        for repo in REPOS:
            repo_path = clean_root / repo["dir_name"]
            tag_repo_if_updated(
                repo_name=repo["name"],
                repo_path=repo_path,
                tag_pattern=repo["tag_pattern"],
                tag_type=repo["tag_type"],
                dry_run=args.dry_run,
            )

        print("=" * 60)
        print("Alpha release process complete!")
        print("=" * 60)

    finally:
        # 5) Always cleanup the repos directory
        cleanup_repos(clean_root=clean_root)


if __name__ == "__main__":
    main()