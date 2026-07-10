"""Turn discovered snippets into runnable test cases and execute the tiers.

Tiers (independently selectable via the ``--tier`` pytest option):

* **1 — syntax:** ``compile()`` every snippet.
* **2 — complete protocols:** run ``def run()`` protocols through
  ``opentrons.simulate.simulate`` (robotType/apiLevel come from the snippet).
* **3 — fragments:** exec each fragment on top of a fresh context seeded from
  the Flex/OT-2 base template in ``examples.md``. A ``continue-previous`` fragment
  reuses the prior fragment's namespace, so its case replays the whole chain in
  one context.
"""

from __future__ import annotations

import functools
import io
import re
import textwrap
from dataclasses import dataclass, field
from pathlib import Path

from tests.snippets.classify import (
    Category,
    Directives,
    Track,
    categorize,
    parse_directives,
    resolve_track,
)
from tests.snippets.extract import Snippet, discover_snippets
from tests.snippets.render import macro_context, render


@dataclass
class SnippetCase:
    """A discovered snippet plus everything needed to test it."""

    snippet: Snippet
    category: Category
    directives: Directives
    track: Track
    rendered: str
    chain: list[str]  # rendered code of chain members, ending with this snippet
    test_id: str
    api_version: str  # macro apiLevel of the snippet's page, for header synthesis
    page_seed: str | None = None  # page-template setup exec'd after the base template


def _slug(text: str | None) -> str:
    if not text:
        return "_"
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "_"


def _seed_code(rendered: str) -> str:
    """The setup code a page-template snippet contributes to its page's seed.

    A complete protocol contributes its ``run()`` body (so the labware/module
    variables land at namespace scope); a setup fragment contributes as-is.
    """
    if "def run(" in rendered:
        return _template_body(rendered)
    return rendered


def build_cases(roots: list[Path], docs_root: Path) -> list[SnippetCase]:
    """Discover, render, classify, and chain snippets into test cases."""
    snippets = discover_snippets(roots, docs_root)

    # First pass: collect page-template setup code per file (in document order),
    # keyed by the defining snippet's line so a template isn't seeded onto itself.
    page_seeds: dict[str, list[tuple[int, str]]] = {}
    for snippet in snippets:
        if parse_directives(snippet).page_template:
            rendered = render(snippet.code, macro_context(snippet.path, docs_root))
            page_seeds.setdefault(snippet.rel_path, []).append(
                (snippet.start_line, _seed_code(rendered))
            )

    cases: list[SnippetCase] = []
    # Per (file, track) running chain of rendered fragment code for continue-previous.
    open_chain: dict[tuple[str, Track], list[str]] = {}

    for snippet in snippets:
        directives = parse_directives(snippet)
        category = categorize(snippet)
        ctx = macro_context(snippet.path, docs_root)
        rendered = render(snippet.code, ctx)
        track = resolve_track(snippet, directives)
        api_version = str(ctx.get("apiLevel", ""))

        seeds = [
            code
            for line, code in page_seeds.get(snippet.rel_path, [])
            if line != snippet.start_line
        ]
        page_seed = "\n".join(seeds) if seeds else None

        if category is Category.FRAGMENT:
            key = (snippet.rel_path, track)
            if directives.continue_previous and key in open_chain:
                chain = open_chain[key] + [rendered]
            else:
                chain = [rendered]
            open_chain[key] = chain
        else:
            chain = [rendered]

        test_id = f"{snippet.rel_path}::{snippet.tab or '_'}::{_slug(snippet.heading)}::L{snippet.start_line}"
        cases.append(
            SnippetCase(
                snippet=snippet,
                category=category,
                directives=directives,
                track=track,
                rendered=rendered,
                chain=chain,
                test_id=test_id,
                api_version=api_version,
                page_seed=page_seed,
            )
        )
    return cases


# --- Base templates (seed context for fragments) ---------------------------


def _template_body(full_src: str) -> str:
    """Return the statements inside a protocol template's ``def run(...):``.

    The body still references ``protocol`` (the function parameter); we exec it
    in a namespace where ``protocol`` is pre-bound to a simulated context.
    """
    lines = full_src.splitlines()
    for idx, line in enumerate(lines):
        if line.lstrip().startswith("def run("):
            body = "\n".join(lines[idx + 1 :])
            return textwrap.dedent(body)
    raise ValueError("template snippet has no `def run(` line")


@functools.lru_cache(maxsize=None)
def load_templates(docs_root: Path) -> dict[Track, tuple[str, str]]:
    """Extract the Flex/OT-2 base templates and API version from examples.md.

    Returns ``{track: (rendered_body, api_version)}``. The templates are the
    two blocks under the "Protocol template" heading — themselves subject to
    the same extraction/rendering, so they are never duplicated in Python.
    """
    examples = docs_root / "python-api" / "docs" / "examples.md"
    snippets = discover_snippets([examples], docs_root)
    ctx = macro_context(examples, docs_root)
    version = str(ctx["apiLevel"])

    templates: dict[Track, tuple[str, str]] = {}
    for snippet in snippets:
        if (snippet.heading or "").strip() != "Protocol template":
            continue
        label = (snippet.tab or "").lower()
        track = Track.FLEX if "flex" in label else Track.OT2 if "ot-2" in label or "ot2" in label else None
        if track is None or track in templates:
            continue
        body = _template_body(render(snippet.code, ctx))
        templates[track] = (body, version)

    missing = {t for t in Track} - set(templates)
    if missing:
        raise RuntimeError(f"missing base template(s) in examples.md: {missing}")
    return templates


# --- Tier runners ----------------------------------------------------------


def check_syntax(case: SnippetCase) -> None:
    """Tier 1: compile the rendered snippet; raises SyntaxError on failure."""
    compile(case.rendered, case.snippet.location, "exec")


def _declared_target(case: SnippetCase) -> tuple[str, str]:
    """Robot type and API version a complete protocol targets.

    Read from the snippet's own ``requirements``/``metadata`` when declared,
    else fall back to the enclosing tab (track) and the page's macro apiLevel.
    """
    rendered = case.rendered
    match = re.search(r'robotType["\s:]+([A-Za-z0-9-]+)', rendered)
    if match:
        robot_type = "OT-2" if match.group(1).upper().startswith("OT") else "Flex"
    elif re.search(r"\bmetadata\s*=", rendered) and "requirements" not in rendered:
        robot_type = "OT-2"
    else:
        robot_type = case.track.robot_type
    version_match = re.search(r'apiLevel["\s:]+([0-9.]+)', rendered)
    version = version_match.group(1) if version_match else case.api_version
    return robot_type, version


def run_complete(case: SnippetCase) -> None:
    """Tier 2: run a ``def run()`` protocol against a simulated context.

    Docs often show a ``run()`` body without the ``requirements``/``metadata``
    header (the tutorial builds a protocol up section by section); when the
    snippet declares no ``apiLevel`` we synthesize the standard header so the
    body itself is exercised.

    Flex protocols go through the full ``simulate.simulate`` engine (which also
    runs any ``add_parameters``). OT-2 protocols are rejected by that top-level
    entrypoint in this build (OT-2 moved to a separate app), so they run via
    ``get_protocol_api`` + calling ``run()`` directly.
    """
    from opentrons import simulate

    robot_type, version = _declared_target(case)
    src = case.rendered
    if "apiLevel" not in src:
        src = (
            "from opentrons import protocol_api\n"
            f'requirements = {{"robotType": "{robot_type}", "apiLevel": "{version}"}}\n\n'
        ) + src

    if robot_type == "Flex":
        file_name = re.sub(r"[^A-Za-z0-9]+", "_", case.snippet.location) + ".py"
        simulate.simulate(io.StringIO(src), file_name=file_name)
    else:
        namespace: dict = {}
        exec("from opentrons import protocol_api", namespace)
        exec(compile(src, case.snippet.location, "exec"), namespace)
        context = simulate.get_protocol_api(version=version, robot_type="OT-2")
        namespace["run"](context)


def run_fragment(case: SnippetCase, docs_root: Path) -> None:
    """Tier 3: exec the fragment (and any continue-previous chain) on a seeded context."""
    from opentrons import simulate

    body, version = load_templates(docs_root)[case.track]
    namespace: dict = {}
    namespace["protocol"] = simulate.get_protocol_api(
        version=version, robot_type=case.track.robot_type
    )
    exec(compile(body, f"<template:{case.track.value}>", "exec"), namespace)
    if case.page_seed:
        exec(compile(case.page_seed, f"<page-template:{case.snippet.rel_path}>", "exec"), namespace)
    for code in case.chain:
        exec(compile(code, case.snippet.location, "exec"), namespace)


# A fragment fails to simulate for one of two reasons. Either it needs prior
# protocol *context* an earlier snippet (or a full protocol) would have set up —
# a name, an attached tip, an open module, a loaded pipette, a runtime parameter —
# in which case it simply can't run standalone and we report it as xfail. Or it
# has a genuine *defect* — a wrong keyword, unknown labware, bad argument order —
# which must fail the suite. These signatures identify the first kind; everything
# else is treated as a real defect.
_CONTEXT_FAILURE_NAMES = frozenset(
    {
        "NameError",  # references a variable defined earlier on the page
        "TipNotAttachedError",  # needs a tip picked up by a prior snippet
        "TipAttachedError",  # a prior snippet already picked up a tip
        "UnexpectedTipRemovalError",
        "OutOfTipsError",
        "LocationIsOccupiedError",  # labware loaded by a prior snippet/template
        "DeckConflictError",
        "IncompatibleAddressableAreaError",
        "RuntimeParameterRequired",  # needs a runtime parameter value
        "ThermocyclerNotOpenError",  # needs the lid opened by a prior snippet
        "PipetteNotReadyToAspirateError",
        "ThreadManagerException",  # opentrons.execute example — needs real hardware
    }
)
_CONTEXT_FAILURE_MESSAGES = (
    "already present on",  # pipette already loaded (by the base template)
    "has no lid",  # lid not loaded by a prior snippet
    "blow out is called without an explicit location",  # needs prior positioning
    "Last tip location should be a Well but it is: None",  # needs a prior pickup
)


def is_context_failure(exc: BaseException) -> bool:
    """Whether a fragment failed only for lack of prior protocol context/state.

    ``ProtocolCommandFailedError`` wraps the underlying cause in its message, so
    the class-name set is matched against the message too.
    """
    name = type(exc).__name__
    message = str(exc)
    if name in _CONTEXT_FAILURE_NAMES:
        return True
    if any(n in message for n in _CONTEXT_FAILURE_NAMES):
        return True
    if any(s in message for s in _CONTEXT_FAILURE_MESSAGES):
        return True
    if name == "AttributeError" and ("Parameters" in message or "params" in message):
        return True
    return False
