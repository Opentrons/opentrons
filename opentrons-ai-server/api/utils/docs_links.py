"""Map Opentrons Python API documentation hrefs to production URLs."""

from __future__ import annotations

import urllib.error
import urllib.request
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

OPENTRONS_DOCS_ORIGIN = "https://docs.opentrons.com"
OPENTRONS_PYTHON_API_DOCS_ORIGIN = f"{OPENTRONS_DOCS_ORIGIN}/python-api"
DOCS_LINK_CHECK_USER_AGENT = "opentrons-ai-docs-link-check/1.0"


def _strip_docs_extension(path_part: str) -> str:
    lowered = path_part.lower()
    if lowered.endswith(".md"):
        return path_part[:-3]
    if lowered.endswith(".html"):
        return path_part[:-5]
    return path_part


def _normalize_site_path(path_part: str) -> str:
    normalized_path = _strip_docs_extension(path_part)
    if normalized_path.endswith("/index"):
        normalized_path = normalized_path[: -len("/index")]
    if normalized_path == "index":
        return ""
    return normalized_path


def _resolve_relative_href(source_relpath: str, href: str) -> str:
    base = PurePosixPath(source_relpath).parent
    resolved_segments: list[str] = []
    for segment in (base / href).parts:
        if segment in (".", ""):
            continue
        if segment == "..":
            if resolved_segments:
                resolved_segments.pop()
            continue
        resolved_segments.append(segment)
    return "/".join(resolved_segments)


def _build_docs_site_url(site_path: str, fragment: str) -> str:
    normalized_path = _normalize_site_path(site_path)
    if normalized_path in ("", "."):
        return f"{OPENTRONS_DOCS_ORIGIN}/{fragment}"
    return f"{OPENTRONS_DOCS_ORIGIN}/{normalized_path}/{fragment}"


def _build_python_api_docs_url(path_part: str, fragment: str) -> str:
    normalized_path = _normalize_site_path(path_part)
    if normalized_path in ("", "."):
        return f"{OPENTRONS_PYTHON_API_DOCS_ORIGIN}/{fragment}"
    return f"{OPENTRONS_PYTHON_API_DOCS_ORIGIN}/{normalized_path}/{fragment}"


def _resolved_path_to_url(resolved_path: str, fragment: str) -> str:
    if resolved_path == "flex" or resolved_path.startswith("flex/"):
        return _build_docs_site_url(resolved_path, fragment)
    return _build_python_api_docs_url(resolved_path, fragment)


def doc_href_to_production_url(href: str, source_relpath: str = "") -> str | None:
    """Return a production docs URL when href points at synced API markdown."""
    if href.startswith(("mailto:", "#", "http://", "https://")):
        return None

    lowered_href = href.lower()
    if ".md" not in lowered_href and ".html" not in lowered_href:
        return None

    path_part, separator, fragment = href.partition("#")
    fragment_suffix = f"#{fragment}" if separator else ""

    if path_part == "../index.md":
        return f"{OPENTRONS_DOCS_ORIGIN}/{fragment_suffix}"

    resolved_path = _resolve_relative_href(source_relpath, path_part)
    return _resolved_path_to_url(resolved_path, fragment_suffix)


def synced_doc_path_to_production_url(source_relpath: str, fragment: str = "") -> str:
    """Return the production docs URL for a synced markdown relative path."""
    href = source_relpath if not fragment else f"{source_relpath}#{fragment}"
    url = doc_href_to_production_url(href, "")
    if url is None:
        raise ValueError(f"Cannot map synced doc path to production URL: {source_relpath!r}")
    return url


def rewrite_markdown_doc_links(text: str, source_relpath: str = "") -> str:
    """Rewrite markdown link targets that point at API docs."""
    pieces: list[str] = []
    cursor = 0

    while cursor < len(text):
        link_start = text.find("](", cursor)
        if link_start == -1:
            pieces.append(text[cursor:])
            break

        link_end = text.find(")", link_start + 2)
        if link_end == -1:
            pieces.append(text[cursor:])
            break

        href = text[link_start + 2 : link_end]
        resolved = doc_href_to_production_url(href, source_relpath)
        pieces.append(text[cursor : link_start + 2])
        pieces.append(resolved if resolved is not None else href)
        cursor = link_end

    return "".join(pieces)


def extract_markdown_link_hrefs(markdown: str) -> list[str]:
    """Return markdown link targets from `(url)` syntax."""
    hrefs: list[str] = []
    cursor = 0
    while cursor < len(markdown):
        link_start = markdown.find("](", cursor)
        if link_start == -1:
            break
        link_end = markdown.find(")", link_start + 2)
        if link_end == -1:
            break
        href = markdown[link_start + 2 : link_end].strip()
        if href:
            hrefs.append(href)
        cursor = link_end + 1
    return hrefs


def is_unrewritten_relative_doc_href(href: str) -> bool:
    """True when a markdown link still points at a relative doc file path."""
    if href.startswith(("mailto:", "#", "http://", "https://")):
        return False
    lowered_href = href.lower()
    return ".md" in lowered_href or ".html" in lowered_href


def is_invalid_production_docs_url(href: str) -> bool:
    """True when a rewritten python-api URL still looks like a source file path."""
    if not href.startswith(f"{OPENTRONS_PYTHON_API_DOCS_ORIGIN}/"):
        return False
    lowered_href = href.lower()
    return ".md" in lowered_href or ".html" in lowered_href


def iter_synced_doc_markdown_links(docs_root: Path) -> Iterator[tuple[str, str]]:
    """Yield `(source_relpath, href)` for every markdown link in synced docs."""
    for markdown_path in sorted(docs_root.rglob("*.md")):
        source_relpath = markdown_path.relative_to(docs_root).as_posix()
        for href in extract_markdown_link_hrefs(markdown_path.read_text(encoding="utf-8")):
            yield source_relpath, href


@dataclass(frozen=True)
class SyncedDocLinkAudit:
    unrewritten_relative_links: list[tuple[str, str]]
    invalid_production_doc_links: list[tuple[str, str]]
    production_doc_urls: list[str]


def audit_synced_doc_links(docs_root: Path) -> SyncedDocLinkAudit:
    """Audit synced docs for link rewriting issues."""
    unrewritten_relative_links: list[tuple[str, str]] = []
    invalid_production_doc_links: list[tuple[str, str]] = []
    production_doc_urls: set[str] = set()

    for source_relpath, href in iter_synced_doc_markdown_links(docs_root):
        if is_unrewritten_relative_doc_href(href):
            unrewritten_relative_links.append((source_relpath, href))
        if is_invalid_production_docs_url(href):
            invalid_production_doc_links.append((source_relpath, href))
        if href.startswith(f"{OPENTRONS_PYTHON_API_DOCS_ORIGIN}/") or href.startswith(f"{OPENTRONS_DOCS_ORIGIN}/flex/"):
            production_doc_urls.add(href)

    return SyncedDocLinkAudit(
        unrewritten_relative_links=unrewritten_relative_links,
        invalid_production_doc_links=invalid_production_doc_links,
        production_doc_urls=sorted(production_doc_urls),
    )


def check_production_docs_url(url: str, timeout: float = 20.0) -> int | None:
    """Return an HTTP status code for a production docs URL, if reachable."""
    headers = {"User-Agent": DOCS_LINK_CHECK_USER_AGENT}
    for method in ("HEAD", "GET"):
        request = urllib.request.Request(url, method=method, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return int(response.status)
        except urllib.error.HTTPError as exc:
            if method == "HEAD" and exc.code in (403, 405):
                continue
            return exc.code
        except urllib.error.URLError:
            return None
    return None
