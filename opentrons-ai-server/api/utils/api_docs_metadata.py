"""Read synced Python API documentation metadata for runtime LLM configuration."""

from __future__ import annotations

import re
from pathlib import Path

AI_SERVER_ROOT: Path = Path(__file__).resolve().parent.parent.parent
API_DOCS_ROOT: Path = AI_SERVER_ROOT / "api" / "storage" / "api_docs"
API_LEVEL_MANIFEST_PATH: Path = API_DOCS_ROOT / ".api-level"
API_DOCS_STRUCT_PATH: Path = API_DOCS_ROOT / "api_docs_struct.md"
DEFAULT_API_LEVEL_FROM_STRUCT_RE = re.compile(r"^Default apiLevel:\s*([\d.]+)\s*$", re.MULTILINE)


def get_default_api_level() -> str:
    """
    Return the default apiLevel from synced API docs metadata.

    Prefer the `.api-level` manifest written during `make sync-api-docs`.
    Fall back to the generated `api_docs_struct.md` header when the manifest is absent.
    """
    if API_LEVEL_MANIFEST_PATH.is_file():
        first_line = API_LEVEL_MANIFEST_PATH.read_text(encoding="utf-8").splitlines()[0].strip()
        if first_line:
            return first_line

    if API_DOCS_STRUCT_PATH.is_file():
        match = DEFAULT_API_LEVEL_FROM_STRUCT_RE.search(API_DOCS_STRUCT_PATH.read_text(encoding="utf-8"))
        if match:
            return match.group(1)

    msg = "Default apiLevel is unavailable. Run `make sync-api-docs` to sync Python API docs and write api/storage/api_docs/.api-level."
    raise RuntimeError(msg)
