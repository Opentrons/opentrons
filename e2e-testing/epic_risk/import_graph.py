"""Epic-local fan-out / fan-in from static imports (Python + TS heuristics)."""

from __future__ import annotations

import ast
import re
from collections.abc import Callable
from pathlib import Path

import pandas as pd


def norm_repo_path(path: str) -> str:
    return path.replace("\\", "/").strip()


def pure_norm_join(base_file: str, rel_import: str) -> str:
    """Resolve relative import path segments (POSIX), repo-relative."""
    base = Path(base_file).parent.as_posix()
    parts: list[str] = []
    for seg in (base + "/" + rel_import).split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if parts:
                parts.pop()
        else:
            parts.append(seg)
    return "/".join(parts)


_RE_TS_FROM = re.compile(
    r"""(?:import\s+(?:type\s+)?(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+|import\s+)['"]([^'"]+)['"]"""
)
_RE_TS_SIDE = re.compile(r"""import\s*\(\s*['"]([^'"]+)['"]\s*\)""")


def python_import_targets(content: str, current_file: str, epic_paths: set[str]) -> set[str]:
    """Resolve static imports to epic_paths entries (lite heuristic)."""
    found: set[str] = set()
    epic = epic_paths
    try:
        tree = ast.parse(content)
    except SyntaxError:
        return found

    def match_module(mod: str | None) -> None:
        if not mod:
            return
        slash = mod.replace(".", "/")
        for p in epic:
            if p.endswith(slash + ".py") or p.endswith("/" + slash + ".py"):
                found.add(p)
            if p.endswith("/" + slash + "/__init__.py"):
                found.add(p)

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                match_module(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.level == 0 and node.module:
                match_module(node.module)
            elif node.level and node.module:
                base = Path(current_file).parent
                for _ in range(node.level - 1):
                    base = base.parent
                mod_dot = node.module.replace(".", "/")
                cand_py = (base / f"{mod_dot}.py").as_posix()
                cand_pkg = (base / mod_dot / "__init__.py").as_posix()
                for c in (cand_py, cand_pkg):
                    if c in epic:
                        found.add(c)
            elif node.level and not node.module:
                base = Path(current_file).parent
                for _ in range(node.level - 1):
                    base = base.parent
                for alias in node.names:
                    if alias.name == "*":
                        continue
                    cand = (base / (alias.name + ".py")).as_posix()
                    if cand in epic:
                        found.add(cand)

    return found


def ts_import_targets(content: str, current_file: str, epic_paths: set[str]) -> set[str]:
    """Resolve explicit path imports to epic_paths (relative + loose path suffix match)."""
    found: set[str] = set()
    seen_specs: set[str] = set()
    exts = (".tsx", ".ts", ".jsx", ".js")
    for rx in (_RE_TS_FROM, _RE_TS_SIDE):
        for m in rx.finditer(content):
            spec = m.group(1)
            if spec in seen_specs:
                continue
            seen_specs.add(spec)
            if spec.startswith("."):
                joined = pure_norm_join(current_file, spec)
                trials = [joined]
                if not any(joined.endswith(e) for e in exts):
                    trials.extend(joined + e for e in exts)
                for cand in trials:
                    if cand in epic_paths:
                        found.add(cand)
            else:
                tail = spec.split("/")[-1].lstrip("@")
                for p in epic_paths:
                    if p.endswith("/" + tail) or p == tail:
                        found.add(p)
                    for ext in exts:
                        if p.endswith("/" + tail + ext) or p.endswith(tail + ext):
                            found.add(p)
    return found


def build_fan_metrics_df(
    summary_df: pd.DataFrame,
    fetch_raw_file: Callable[[str, str], str | None],
) -> pd.DataFrame:
    """
    Fan-out / fan-in among epic blast-radius files only (same repo).
    Import extraction for Python + TS/JS; other domains get 0 / 0.

    `fetch_raw_file` should return default-branch file contents (typically Streamlit-cached).
    """
    out_fo: list[int] = []
    out_fi: list[int] = []

    repos = summary_df["RepoFullName"].unique()
    imports_from: dict[tuple[str, str], set[str]] = {}

    for repo in repos:
        sub = summary_df[summary_df["RepoFullName"] == repo]
        epic_paths = set(sub["File"].astype(str).map(norm_repo_path))

        for row in sub.itertuples(index=False):
            repo_name = row.RepoFullName
            path = norm_repo_path(str(row.File))
            domain = row.Domain
            key = (repo_name, path)

            if domain == "⚙️ API / Python":
                raw = fetch_raw_file(repo_name, path)
                if raw:
                    imports_from[key] = python_import_targets(raw, path, epic_paths)
                else:
                    imports_from[key] = set()
            elif domain == "🖥️ UI / React":
                raw = fetch_raw_file(repo_name, path)
                if raw:
                    imports_from[key] = ts_import_targets(raw, path, epic_paths)
                else:
                    imports_from[key] = set()
            else:
                imports_from[key] = set()

            imports_from[key].discard(path)

    importers: dict[tuple[str, str], set[tuple[str, str]]] = {}
    for src_key, tgts in imports_from.items():
        for t in tgts:
            importers.setdefault((src_key[0], t), set()).add(src_key)

    for row in summary_df.itertuples(index=False):
        rk = (row.RepoFullName, norm_repo_path(str(row.File)))
        fo = len(imports_from.get(rk, set()))
        fi = len(importers.get(rk, set()))
        out_fo.append(fo)
        out_fi.append(fi)

    s = summary_df.copy()
    s["Fan-out"] = out_fo
    s["Fan-in"] = out_fi
    return s
