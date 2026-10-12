"""Classify a snippet into a test category and parse its directives.

Convention is the default (no annotation needed):

* a snippet containing ``def run(`` is a **complete protocol** — simulated as-is;
* anything else is a **fragment** — run against a template-seeded context.

The small set of exceptions is expressed by ``<!-- test: ... -->`` markers parsed
by :mod:`extract`. This module turns a :class:`~tests.snippets.extract.Snippet`'s
raw marker tokens into a structured :class:`Directives` plus a category.

``page-template`` and ``params-template`` both accumulate a page's setup code
for later fragments to run against (protocol-level and ``add_parameters()``-level,
respectively) — see the docstrings on :func:`tests.snippets.execute.build_cases`
and :func:`tests.snippets.execute.run_fragment`.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from tests.snippets.extract import Snippet


class Category(str, Enum):
    COMPLETE = "complete"
    FRAGMENT = "fragment"


class Track(str, Enum):
    FLEX = "flex"
    OT2 = "ot2"

    @property
    def robot_type(self) -> str:
        return "Flex" if self is Track.FLEX else "OT-2"


@dataclass(frozen=True)
class Directives:
    skip: bool = False
    syntax_only: bool = False
    raises: bool = False
    continue_previous: bool = False
    page_template: bool = False
    params_template: bool = False
    forced_track: Track | None = None


def parse_directives(snippet: Snippet) -> Directives:
    skip = syntax_only = raises = continue_previous = page_template = False
    params_template = False
    forced_track: Track | None = None
    for token in snippet.markers:
        if token == "skip":
            skip = True
        elif token == "syntax-only":
            syntax_only = True
        elif token == "raises":
            raises = True
        elif token == "continue-previous":
            continue_previous = True
        elif token == "page-template":
            page_template = True
        elif token == "params-template":
            params_template = True
        elif token.startswith("robot="):
            value = token.split("=", 1)[1].lower()
            if value in ("flex",):
                forced_track = Track.FLEX
            elif value in ("ot2", "ot-2"):
                forced_track = Track.OT2
            else:
                raise ValueError(f"{snippet.location}: unknown robot '{value}'")
        else:
            raise ValueError(f"{snippet.location}: unknown test marker '{token}'")
    return Directives(
        skip=skip,
        syntax_only=syntax_only,
        raises=raises,
        continue_previous=continue_previous,
        page_template=page_template,
        params_template=params_template,
        forced_track=forced_track,
    )


def categorize(snippet: Snippet) -> Category:
    return Category.COMPLETE if "def run(" in snippet.code else Category.FRAGMENT


def resolve_track(snippet: Snippet, directives: Directives) -> Track:
    """Which robot template a fragment seeds from.

    Precedence: an explicit ``robot=`` marker, then the enclosing tab label
    (matched by substring, since labels include ``"Updated Flex code"`` etc.),
    then a Flex default for untabbed / non-robot tabs (``Blocking``,
    ``Concurrent``).
    """
    if directives.forced_track is not None:
        return directives.forced_track
    label = (snippet.tab or "").lower()
    if "ot-2" in label or "ot2" in label:
        return Track.OT2
    if "flex" in label:
        return Track.FLEX
    return Track.FLEX
