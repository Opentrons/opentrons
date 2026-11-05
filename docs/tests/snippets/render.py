"""Render MkDocs macro variables in snippets before checking them.

Snippets embed Jinja variables (``{{ apiLevel }}``, ``{{ robot_stack_version }}``)
that the ``mkdocs-macros-plugin`` substitutes at build time from each site's
``extra:`` config. We do the same substitution here so tests see exactly what
ships. Values are read from the governing ``mkdocs.yml`` — never hardcoded.
"""

from __future__ import annotations

import functools
from pathlib import Path

import jinja2
import yaml


@functools.lru_cache(maxsize=None)
def _extra_for_config(mkdocs_yml: Path) -> tuple[tuple[str, object], ...]:
    """Return the ``extra:`` mapping of one mkdocs.yml as a hashable tuple.

    Parsed with a loader that ignores MkDocs' ``!!python/name:`` and
    ``!ENV``/``!relative`` tags, which a plain ``safe_load`` would reject.
    """

    class _Loader(yaml.SafeLoader):
        pass

    def _ignore(loader, suffix, node):  # noqa: ANN001
        return None

    _Loader.add_multi_constructor("tag:yaml.org,2002:python/name:", _ignore)
    _Loader.add_multi_constructor("!", _ignore)

    with mkdocs_yml.open(encoding="utf-8") as fh:
        config = yaml.load(fh, Loader=_Loader) or {}
    extra = config.get("extra") or {}
    return tuple(sorted(extra.items()))


def _find_governing_config(md_path: Path, docs_root: Path) -> list[Path]:
    """mkdocs.yml files that apply to ``md_path``, base-first.

    The publication config (a ``mkdocs.yml`` beside a ``docs/`` dir, e.g.
    ``python-api/mkdocs.yml``) overlays the root ``docs/mkdocs.yml``. Returned
    base-first so later entries win on merge.
    """
    configs: list[Path] = []
    root_cfg = docs_root / "mkdocs.yml"
    if root_cfg.exists():
        configs.append(root_cfg)

    for parent in md_path.parents:
        candidate = parent / "mkdocs.yml"
        if candidate.exists() and candidate != root_cfg:
            configs.append(candidate)
        if parent == docs_root:
            break
    return configs


@functools.lru_cache(maxsize=None)
def macro_context(md_path: Path, docs_root: Path) -> dict:
    """Merged ``extra:`` macro variables applicable to a doc file."""
    context: dict = {}
    for cfg in _find_governing_config(md_path, docs_root):
        context.update(dict(_extra_for_config(cfg)))
    return context


def render(code: str, context: dict) -> str:
    """Substitute macro variables in a snippet.

    Only renders when the snippet actually contains a ``{{`` delimiter, so pure
    Python is returned untouched. Uses ``StrictUndefined`` so an unexpected
    macro variable fails loudly (surfacing it in the audit) rather than silently
    producing invalid Python.
    """
    if "{{" not in code:
        return code
    env = jinja2.Environment(undefined=jinja2.StrictUndefined, autoescape=False)
    return env.from_string(code).render(**context)
