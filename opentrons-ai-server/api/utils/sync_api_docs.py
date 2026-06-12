"""Sync Python API documentation from a pinned mkdocs release tag into ai-server storage."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
from dataclasses import dataclass
from datetime import datetime
from io import BytesIO
from pathlib import Path

from api.utils.api_docs_struct_curated import (
    audit_curation_coverage,
    format_curation_coverage_issues,
    load_curated_about,
)

AI_SERVER_ROOT: Path = Path(__file__).resolve().parent.parent.parent
REPO_ROOT: Path = AI_SERVER_ROOT.parent
DOCS_SOURCE_PREFIX: Path = Path("docs/python-api/docs")
MKDOCS_YML_PATH: Path = Path("docs/python-api/mkdocs.yml")
DOCS_DEST_DIR: Path = AI_SERVER_ROOT / "api" / "storage" / "api_docs" / "docs" / "v2"
STRUCT_OUTPUT_PATH: Path = AI_SERVER_ROOT / "api" / "storage" / "api_docs" / "api_docs_struct.md"
TAG_MANIFEST_PATH: Path = AI_SERVER_ROOT / "api" / "storage" / "api_docs" / ".docs-tag"
API_LEVEL_MANIFEST_PATH: Path = AI_SERVER_ROOT / "api" / "storage" / "api_docs" / ".api-level"
DEFAULT_REMOTE_URL: str = "https://github.com/Opentrons/opentrons.git"

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
HEADING_RE = re.compile(r"^#\s+(.+)$", re.MULTILINE)


@dataclass(frozen=True)
class DocSummary:
    relative_path: str
    title: str
    about: str


def _run_git_archive(repo_root: Path, tag: str, source_path: Path) -> bytes:
    result = subprocess.run(
        ["git", "-C", str(repo_root), "archive", tag, str(source_path)],
        check=True,
        capture_output=True,
    )
    return result.stdout


def fetch_repo_file_at_tag(tag: str, repo_root: Path, remote_url: str, file_path: Path) -> str:
    """Read a single file from a git tag."""
    if repo_root.is_dir() and (repo_root / ".git").is_dir():
        _ensure_tag_available(repo_root, tag, remote_url)
        result = subprocess.run(
            ["git", "-C", str(repo_root), "show", f"{tag}:{file_path.as_posix()}"],
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout

    temp_dir = Path(tempfile.mkdtemp(prefix="opentrons-api-docs-file-"))
    try:
        clone = subprocess.run(
            [
                "git",
                "clone",
                "--depth",
                "1",
                "--filter=blob:none",
                "--sparse",
                "--branch",
                tag,
                remote_url,
                str(temp_dir),
            ],
            capture_output=True,
            text=True,
        )
        if clone.returncode != 0:
            raise RuntimeError(f"Failed to sparse clone tag {tag!r} from {remote_url}: {clone.stderr.strip()}")

        sparse = subprocess.run(
            ["git", "-C", str(temp_dir), "sparse-checkout", "set", file_path.parent.as_posix()],
            capture_output=True,
            text=True,
        )
        if sparse.returncode != 0:
            raise RuntimeError(f"Failed to sparse checkout {file_path.parent}: {sparse.stderr.strip()}")

        file_on_disk = temp_dir / file_path
        if not file_on_disk.is_file():
            msg = f"Expected file {file_path} was not found at tag {tag!r}."
            raise RuntimeError(msg)
        return file_on_disk.read_text(encoding="utf-8")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def parse_api_level_from_mkdocs_yml(content: str) -> str:
    """Extract extra.apiLevel from docs/python-api/mkdocs.yml."""
    in_extra = False
    for line in content.splitlines():
        if line.strip() == "extra:":
            in_extra = True
            continue
        if in_extra:
            if line and not line.startswith(" "):
                break
            match = re.match(r"\s*apiLevel:\s*([\d.]+)\s*$", line)
            if match:
                return match.group(1)

    raise RuntimeError("Could not find extra.apiLevel in docs/python-api/mkdocs.yml")


def fetch_default_api_level(tag: str, repo_root: Path, remote_url: str) -> str:
    mkdocs_yml = fetch_repo_file_at_tag(tag, repo_root, remote_url, MKDOCS_YML_PATH)
    return parse_api_level_from_mkdocs_yml(mkdocs_yml)


def _ensure_tag_available(repo_root: Path, tag: str, remote_url: str) -> None:
    verify = subprocess.run(
        ["git", "-C", str(repo_root), "rev-parse", tag],
        capture_output=True,
        text=True,
    )
    if verify.returncode == 0:
        return

    fetch = subprocess.run(
        ["git", "-C", str(repo_root), "fetch", "--depth", "1", "origin", f"refs/tags/{tag}:refs/tags/{tag}"],
        capture_output=True,
        text=True,
    )
    if fetch.returncode != 0:
        msg = f"Tag {tag!r} is not available locally and could not be fetched from origin."
        raise RuntimeError(msg)


def _sparse_clone_docs(tag: str, remote_url: str, source_prefix: Path) -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="opentrons-api-docs-"))
    clone = subprocess.run(
        [
            "git",
            "clone",
            "--depth",
            "1",
            "--filter=blob:none",
            "--sparse",
            "--branch",
            tag,
            remote_url,
            str(temp_dir),
        ],
        capture_output=True,
        text=True,
    )
    if clone.returncode != 0:
        raise RuntimeError(f"Failed to sparse clone docs for tag {tag!r} from {remote_url}: {clone.stderr.strip()}")

    sparse = subprocess.run(
        ["git", "-C", str(temp_dir), "sparse-checkout", "set", str(source_prefix)],
        capture_output=True,
        text=True,
    )
    if sparse.returncode != 0:
        raise RuntimeError(f"Failed to configure sparse checkout for {source_prefix}: {sparse.stderr.strip()}")

    return temp_dir / source_prefix


def extract_docs_from_archive(archive_bytes: bytes, source_prefix: Path) -> Path:
    """Extract docs/python-api/docs from a git archive tarball into a temp directory."""
    temp_dir = Path(tempfile.mkdtemp(prefix="opentrons-api-docs-archive-"))

    with tarfile.open(fileobj=BytesIO(archive_bytes), mode="r:*") as archive:
        if hasattr(tarfile, "data_filter"):
            archive.extractall(temp_dir, filter="data")
        else:
            archive.extractall(temp_dir)

    extracted = temp_dir / source_prefix
    if not extracted.is_dir():
        msg = f"Expected documentation directory {source_prefix} was not found in archive."
        raise RuntimeError(msg)
    return extracted


def fetch_docs_tree(
    tag: str,
    repo_root: Path,
    remote_url: str,
    source_prefix: Path = DOCS_SOURCE_PREFIX,
) -> tuple[Path, Path | None]:
    """
    Fetch documentation files for a tag.

    Returns the docs directory and an optional temp directory that must be cleaned up.
    """
    if repo_root.is_dir() and (repo_root / ".git").is_dir():
        _ensure_tag_available(repo_root, tag, remote_url)
        archive_bytes = _run_git_archive(repo_root, tag, source_prefix)
        temp_dir = Path(tempfile.mkdtemp(prefix="opentrons-api-docs-archive-"))
        return extract_docs_from_archive(archive_bytes, source_prefix), temp_dir

    sparse_root = _sparse_clone_docs(tag, remote_url, source_prefix)
    return sparse_root, sparse_root.parent


def copy_docs_tree(source_dir: Path, dest_dir: Path) -> None:
    """Replace dest_dir with a copy of source_dir."""
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    dest_dir.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source_dir, dest_dir)


def _parse_frontmatter(content: str) -> dict[str, str]:
    match = FRONTMATTER_RE.match(content)
    if not match:
        return {}

    metadata: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"')
    return metadata


def _extract_about_text(content: str) -> str:
    body = FRONTMATTER_RE.sub("", content, count=1).strip()
    paragraphs: list[str] = []
    for block in re.split(r"\n\s*\n", body):
        stripped = block.strip()
        if not stripped or stripped.startswith("#"):
            continue
        cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", stripped)
        cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
        paragraphs.append(cleaned)
        if len(" ".join(paragraphs)) >= 400:
            break

    about = " ".join(paragraphs)
    if len(about) > 600:
        about = about[:597].rstrip() + "..."
    return about


def summarize_markdown_file(path: Path, docs_root: Path) -> DocSummary:
    content = path.read_text(encoding="utf-8")
    metadata = _parse_frontmatter(content)
    heading_match = HEADING_RE.search(FRONTMATTER_RE.sub("", content, count=1))
    title = metadata.get("title") or (heading_match.group(1).strip() if heading_match else path.stem.replace("-", " ").title())
    about = metadata.get("description") or _extract_about_text(content)
    if not about:
        about = f"Documentation page for {title}."

    relative_path = path.relative_to(docs_root).as_posix()
    return DocSummary(relative_path=relative_path, title=title, about=about)


def generate_api_docs_struct(
    docs_root: Path,
    output_path: Path,
    tag: str,
    api_level: str,
    curated_about: dict[str, str] | None = None,
) -> None:
    """Generate the LLM documentation structure file from synced markdown docs.

    Curated <about> text comes from api_docs_struct_about.json (see docs/API_DOCS_CURATION.md).
    """
    markdown_files = sorted(path for path in docs_root.rglob("*.md") if path.is_file())
    curated = curated_about if curated_about is not None else load_curated_about()
    generated_at = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")

    lines = [
        "# Opentrons API Documentation Structure",
        "",
        "This file provides detailed analysis of key files in the Opentrons Python API v2 documentation for LLM context understanding.",
        "",
        f"Generated on: {generated_at}",
        f"Documentation tag: {tag}",
        f"Default apiLevel: {api_level}",
        "",
        "## Overview",
        "",
        "This documentation covers the Opentrons Python API v2, used to write protocols for Opentrons robots (OT-2 and Flex/OT-3). "
        "The API allows users to control pipettes, modules, labware, and execute automated laboratory protocols.",
        "",
        "Each entry below includes an `<about>` section describing what the file covers, which robot types it applies to, "
        "and which concepts (pipettes, modules, labware, liquids, runtime parameters, etc.) it addresses. "
        "Use these descriptions to match user queries to the most relevant documentation files.",
        "",
        "## File-by-File Analysis",
        "",
        "The following files are analyzed in a structured order: first all root-level markdown files, "
        "then files within each subdirectory (processed alphabetically by subdirectory name). "
        "When selecting relevant docs, use the exact relative paths shown below (for example `modules/index.md`).",
        "",
    ]

    for index, path in enumerate(markdown_files, start=1):
        summary = summarize_markdown_file(path, docs_root)
        about = curated.get(summary.relative_path, summary.about)
        lines.extend(
            [
                f"### {index}. {summary.relative_path}",
                "",
                "<about>",
                about,
                "</about>",
                "",
                "---",
                "",
            ]
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")

    coverage = audit_curation_coverage(docs_root, curated)
    if coverage.has_gaps:
        print(
            "warning: API docs curation coverage gaps detected:\n"
            f"{format_curation_coverage_issues(coverage)}\n"
            "Run make check-api-docs-curation after adding entries to api_docs_struct_about.json.",
            file=sys.stderr,
        )


def write_api_level_manifest(api_level: str, manifest_path: Path | None = None) -> None:
    resolved_manifest_path = manifest_path or API_LEVEL_MANIFEST_PATH
    resolved_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    resolved_manifest_path.write_text(f"{api_level}\n", encoding="utf-8")


def write_tag_manifest(tag: str, manifest_path: Path | None = None) -> None:
    resolved_manifest_path = manifest_path or TAG_MANIFEST_PATH
    resolved_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    resolved_manifest_path.write_text(f"{tag}\n{datetime.now().astimezone().isoformat()}\n", encoding="utf-8")


def sync_api_docs(
    tag: str,
    repo_root: Path = REPO_ROOT,
    dest_dir: Path = DOCS_DEST_DIR,
    struct_output_path: Path = STRUCT_OUTPUT_PATH,
    remote_url: str = DEFAULT_REMOTE_URL,
) -> str:
    """Sync Python API docs from a mkdocs tag into ai-server storage."""
    source_dir, cleanup_dir = fetch_docs_tree(tag, repo_root, remote_url)
    api_level = fetch_default_api_level(tag, repo_root, remote_url)

    try:
        copy_docs_tree(source_dir, dest_dir)
        generate_api_docs_struct(dest_dir, struct_output_path, tag, api_level)
        write_tag_manifest(tag)
        write_api_level_manifest(api_level)
    finally:
        if cleanup_dir is not None and cleanup_dir.exists():
            shutil.rmtree(cleanup_dir, ignore_errors=True)

    return tag


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Sync Opentrons Python API docs from a mkdocs release tag.")
    parser.add_argument(
        "--tag",
        required=True,
        help="MkDocs release tag to sync (for example mkdocs-2026-06-02).",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=REPO_ROOT,
        help="Path to the opentrons monorepo root used for git archive/tag lookup.",
    )
    parser.add_argument(
        "--remote-url",
        default=DEFAULT_REMOTE_URL,
        help="Git remote used for sparse clone fallback when repo-root is unavailable.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        synced_tag = sync_api_docs(tag=args.tag, repo_root=args.repo_root, remote_url=args.remote_url)
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    print(f"Synced Python API docs from {synced_tag} to {DOCS_DEST_DIR}")
    print(f"Default apiLevel: {API_LEVEL_MANIFEST_PATH.read_text(encoding='utf-8').strip()}")
    print(f"Generated documentation structure at {STRUCT_OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
