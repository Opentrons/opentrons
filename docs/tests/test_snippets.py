"""Tiered tests over every Python snippet discovered in the docs.

A single collector (:func:`build_cases`) discovers and classifies snippets; the
tests below parametrize over the result. No test names a block by index — adding
a snippet automatically adds a case. Per-snippet behavior (skip / expect-raise /
continue-previous) comes from ``<!-- test: ... -->`` markers in the Markdown, not
from code here.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from tests.snippets.classify import Category
from tests.snippets.execute import (
    SnippetCase,
    build_cases,
    check_syntax,
    is_context_failure,
    run_complete,
    run_fragment,
)

# docs/tests/test_snippets.py -> docs/
DOCS_ROOT = Path(__file__).resolve().parent.parent
# v1 scope: the Python Protocol API manual only.
ROOTS = [DOCS_ROOT / "python-api" / "docs"]

CASES: list[SnippetCase] = build_cases(ROOTS, DOCS_ROOT)

_SYNTAX = [c for c in CASES if not c.directives.skip]
_COMPLETE = [
    c
    for c in CASES
    if c.category is Category.COMPLETE and not c.directives.skip and not c.directives.syntax_only
]
_FRAGMENT = [
    c
    for c in CASES
    if c.category is Category.FRAGMENT and not c.directives.skip and not c.directives.syntax_only
]


def _ids(cases: list[SnippetCase]) -> list[str]:
    return [c.test_id for c in cases]


@pytest.mark.tier1
@pytest.mark.parametrize("case", _SYNTAX, ids=_ids(_SYNTAX))
def test_snippet_syntax(case: SnippetCase) -> None:
    """Every snippet must be syntactically valid Python after macro rendering."""
    check_syntax(case)


@pytest.mark.tier2
@pytest.mark.parametrize("case", _COMPLETE, ids=_ids(_COMPLETE))
def test_complete_protocol_simulates(case: SnippetCase) -> None:
    """Complete protocols must simulate cleanly (or raise, if so marked)."""
    if case.directives.raises:
        with pytest.raises(Exception):
            run_complete(case)
    else:
        run_complete(case)


@pytest.mark.tier3
@pytest.mark.parametrize("case", _FRAGMENT, ids=_ids(_FRAGMENT))
def test_fragment_simulates(case: SnippetCase) -> None:
    """Run each fragment against the seeded (base + page-template) context.

    A fragment that fails only for lack of prior protocol context — an undefined
    name, an attached tip, an open module, a runtime parameter — can't simulate
    standalone, so it's reported as ``xfail`` (non-blocking). Any *other* failure
    (a wrong keyword, unknown labware, bad argument order) is a real defect and
    **fails** the suite. So the many fragments that genuinely run against the
    template give real, blocking API-misuse coverage, while the ones that can't
    run stand aside gracefully. See ``is_context_failure``.
    """
    try:
        if case.directives.raises:
            with pytest.raises(Exception):
                run_fragment(case, DOCS_ROOT)
        else:
            run_fragment(case, DOCS_ROOT)
    except Exception as exc:
        if is_context_failure(exc):
            pytest.xfail(f"needs prior protocol context: {type(exc).__name__}")
        raise
