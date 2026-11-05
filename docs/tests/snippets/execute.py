"""Turn discovered snippets into runnable test cases and execute the tiers.

Tiers (independently selectable via the ``--tier`` pytest option):

* **1 — syntax:** ``compile()`` every snippet.
* **2 — complete protocols:** run ``def run()`` protocols through
  ``opentrons.simulate.simulate`` (robotType/apiLevel come from the snippet).
* **3 — fragments:** exec each fragment on top of a fresh context seeded from
  the Flex/OT-2 base template in ``templates.py``, plus any registry object
  seeds the fragment (or its ``continue-previous`` chain) actually references
  (:func:`_object_setup_for`) and a preemptive ``pick_up_tip()`` for any
  pipette it uses tip-less (:func:`_tip_setup_for`). A ``continue-previous``
  fragment reuses the prior fragment's namespace, so its case replays the
  whole chain in one context. Every fragment also gets a throwaway
  ``parameters`` object (a real ``ParameterContext``), so a snippet written
  for ``add_parameters()`` scope can run standalone; a page's own
  ``params-template`` snippet additionally gets replayed against a *separate*
  ``ParameterContext`` whose export becomes that page's ``protocol.params``,
  so fragments written for ``run()`` scope see real parameter values.

Every simulated context created here (Tier 2's OT-2 branch and all of Tier 3)
is torn down with :func:`_release_simulated_context` right after use. Nothing
about ``opentrons.simulate.get_protocol_api`` cleans itself up automatically —
each call leaves a hardware-simulator thread and a Protocol Engine thread
running (see the module docstring on ``simulate._LIVE_PROTOCOL_ENGINE_CONTEXTS``),
and this suite calls it once per test case. Skipping the teardown doesn't just
cost a fixed amount of memory per leaked thread — every additional live event
loop adds scheduling overhead for the whole process, so tests run later in the
suite get progressively slower as the thread count grows. Flex's Tier 2 path
(``simulate.simulate``) already cleans up on its own, since it owns its
hardware simulator via a local context manager rather than through
``get_protocol_api``.
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
from tests.snippets.templates import BASE_BODY_BY_TRACK, OBJECT_SEEDS


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
    params_seed: str | None = (
        None  # params-template add_parameters() code exec'd against a real ParameterContext
    )
    object_seed: str | None = (
        None  # registry object setup for names the chain references
    )
    tip_seed: str | None = None  # pick_up_tip() for pipettes the chain uses tip-less


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


def _params_seed_code(rendered: str) -> str:
    """The ``add_parameters()``-scope code a params-template snippet contributes.

    Mirrors :func:`_seed_code` for page-template: a snippet written as a full
    ``def add_parameters(parameters):`` function contributes its dedented body
    (so the ``add_*`` calls land at ``add_parameters()`` scope, matching how
    the docs actually call them); the more common bare-statement style
    (already written as if inside the function) contributes as-is.
    """
    if "def add_parameters(" not in rendered:
        return rendered
    lines = rendered.splitlines()
    for idx, line in enumerate(lines):
        if line.lstrip().startswith("def add_parameters("):
            return textwrap.dedent("\n".join(lines[idx + 1 :]))
    return rendered


_OBJECT_NAME_RE = {name: re.compile(rf"\b{name}\b") for name in OBJECT_SEEDS}
_OBJECT_ASSIGN_RE = {name: re.compile(rf"(?m)^\s*{name}\s*=") for name in OBJECT_SEEDS}

# Methods that raise TipNotAttachedError/UnexpectedTipRemovalError without a
# tip already picked up.
_TIP_REQUIRED_METHODS = (
    "aspirate",
    "dispense",
    "mix",
    "dynamic_mix",
    "touch_tip",
    "air_gap",
    "blow_out",
    "drop_tip",
    "return_tip",
)
_TIP_CALL_RE = re.compile(rf"\b(\w+)\.(?:{'|'.join(_TIP_REQUIRED_METHODS)})\(")


def _tip_setup_for(chain_code: str) -> str | None:
    """Preemptive tip + liquid setup for any pipette the chain uses tip-less.

    Many building-block examples show a bare liquid-handling call (aspirate,
    mix, touch_tip, drop_tip, ...) that assumes state from an earlier, unmarked
    example on the same page — the single largest source of otherwise-genuine
    "needs prior context" xfails. For any name the chain calls a tip-requiring
    method on, inject (each skipped if the chain already does its own):

    * ``pick_up_tip()`` — without it, everything below raises
      ``TipNotAttachedError``/``UnexpectedTipRemovalError``.
    * ``aspirate(<max_volume> / 2, plate["A1"])`` — a location-less
      ``dispense()``, ``mix()``, or ``touch_tip()`` operates at the pipette's
      "current well," which a bare ``pick_up_tip()`` doesn't set (it leaves
      the pipette over the tip rack); and a bare ``dispense()`` needs volume
      in the tip to dispense in the first place. One aspirate fixes both.
      Half of ``max_volume`` (rather than all of it) leaves headroom for a
      fragment that itself does another aspirate or an ``air_gap()`` on top.
    """
    names = dict.fromkeys(_TIP_CALL_RE.findall(chain_code))
    pieces = []
    for name in names:
        needs_pick_up = f"{name}.pick_up_tip(" not in chain_code
        if needs_pick_up:
            pieces.append(f"{name}.pick_up_tip()\n")
        # Only add the aspirate half of the precondition alongside our own
        # pick_up_tip(): if the chain calls pick_up_tip() itself (even later,
        # e.g. after some setup), a tip isn't attached yet at the very start
        # of the chain, so aspirating here first would itself be invalid.
        if needs_pick_up and f"{name}.aspirate(" not in chain_code:
            pieces.append(f'{name}.aspirate({name}.max_volume / 2, plate["A1"])\n')
    return "".join(pieces) if pieces else None


def _object_setup_for(
    chain_code: str, page_seed: str | None, track: Track
) -> str | None:
    """Setup code for any registry object the chain references but doesn't define.

    A name only needs injecting if it's actually referenced somewhere in the
    fragment/chain *and* nothing in the page-template seed or the chain itself
    already assigns it (e.g. a page whose own first fragment loads ``hs_mod``
    locally shouldn't also get one injected out from under it). Assignment is
    detected with a simple ``^name =`` line scan, matching the plain
    assignment style used throughout the docs.
    """
    already_defined = f"{page_seed or ''}\n{chain_code}"
    pieces: list[str] = []
    for name, seed in OBJECT_SEEDS.items():
        track_seed = seed.flex if track is Track.FLEX else seed.ot2
        if track_seed is None:
            continue
        if not _OBJECT_NAME_RE[name].search(chain_code):
            continue
        if _OBJECT_ASSIGN_RE[name].search(already_defined):
            continue
        code = track_seed.load
        if track_seed.ready and not (
            track_seed.ready_marker and track_seed.ready_marker in chain_code
        ):
            code += track_seed.ready
        pieces.append(code)
    return "".join(pieces) if pieces else None


def build_cases(roots: list[Path], docs_root: Path) -> list[SnippetCase]:
    """Discover, render, classify, and chain snippets into test cases."""
    snippets = discover_snippets(roots, docs_root)

    # First pass: collect page-template setup code per file (in document order),
    # keyed by the defining snippet's line so a template isn't seeded onto itself.
    page_seeds: dict[str, list[tuple[int, str]]] = {}
    # Same idea for params-template: a page's real add_parameters() code, kept
    # separate from page_seeds since it's replayed against a ParameterContext
    # rather than exec'd directly into the fragment namespace (see run_fragment).
    params_seeds: dict[str, list[tuple[int, str]]] = {}
    for snippet in snippets:
        directives = parse_directives(snippet)
        if directives.page_template:
            rendered = render(snippet.code, macro_context(snippet.path, docs_root))
            page_seeds.setdefault(snippet.rel_path, []).append(
                (snippet.start_line, _seed_code(rendered))
            )
        if directives.params_template:
            rendered = render(snippet.code, macro_context(snippet.path, docs_root))
            params_seeds.setdefault(snippet.rel_path, []).append(
                (snippet.start_line, _params_seed_code(rendered))
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

        p_seeds = [
            code
            for line, code in params_seeds.get(snippet.rel_path, [])
            if line != snippet.start_line
        ]
        params_seed = "\n".join(p_seeds) if p_seeds else None

        if category is Category.FRAGMENT:
            key = (snippet.rel_path, track)
            if directives.continue_previous and key in open_chain:
                chain = open_chain[key] + [rendered]
            else:
                chain = [rendered]
            open_chain[key] = chain
        else:
            chain = [rendered]

        chain_text = "\n".join(chain)
        object_seed = (
            _object_setup_for(chain_text, page_seed, track)
            if category is Category.FRAGMENT
            else None
        )
        tip_seed = _tip_setup_for(chain_text) if category is Category.FRAGMENT else None

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
                params_seed=params_seed,
                object_seed=object_seed,
                tip_seed=tip_seed,
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
    """Return the Flex/OT-2 base templates and API version.

    Returns ``{track: (body, api_version)}``. The bodies are the minimal
    synthetic templates in ``templates.py`` (not derived from any doc page);
    the API version is still read from the python-api docs' macro config,
    since the templates target that same ``apiLevel``.
    """
    examples = docs_root / "python-api" / "docs" / "examples.md"
    version = str(macro_context(examples, docs_root)["apiLevel"])
    return {track: (body, version) for track, body in BASE_BODY_BY_TRACK.items()}


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


def _release_simulated_context(context: object) -> None:
    """Tear down a ``get_protocol_api()`` context's background resources.

    ``get_protocol_api`` has no way to know when a caller is done with the
    context it returns, so it deliberately leaks a hardware-simulator thread
    and (for apiLevel >= ``ENGINE_CORE_API_VERSION``) a Protocol Engine thread
    per call, keeping them alive on the module-global
    ``simulate._LIVE_PROTOCOL_ENGINE_CONTEXTS`` stack. Calling this after every
    simulated context releases both: ``context.cleanup()`` unsubscribes
    command callbacks and (pre-Protocol-Engine apiLevels) cleans up the
    hardware simulator directly; closing the live-contexts stack stops the
    Protocol Engine thread and cleans up the hardware simulator for
    Protocol-Engine apiLevels. Without this, hundreds of per-test contexts
    accumulate threads and event loops over a single pytest run, making later
    tests progressively slower rather than costing a fixed amount per test.
    """
    from opentrons import simulate

    cleanup = getattr(context, "cleanup", None)
    if cleanup is not None:
        cleanup()
    simulate._LIVE_PROTOCOL_ENGINE_CONTEXTS.close()


def run_complete(case: SnippetCase) -> None:
    """Tier 2: run a ``def run()`` protocol against a simulated context.

    Docs often show a ``run()`` body without the ``requirements``/``metadata``
    header (the tutorial builds a protocol up section by section); when the
    snippet declares no ``apiLevel`` we synthesize the standard header so the
    body itself is exercised.

    Flex protocols go through the full ``simulate.simulate`` engine (which also
    runs any ``add_parameters``); it manages its own hardware simulator via a
    local context manager, so it cleans itself up without help. OT-2 protocols
    are rejected by that top-level entrypoint in this build (OT-2 moved to a
    separate app), so they run via ``get_protocol_api`` + calling ``run()``
    directly, which we do need to release afterward.
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
        try:
            namespace["run"](context)
        finally:
            _release_simulated_context(context)


def run_fragment(case: SnippetCase, docs_root: Path) -> None:
    """Tier 3: exec the fragment (and any continue-previous chain) on a seeded context."""
    from opentrons import simulate
    from opentrons.protocol_api import ParameterContext
    from opentrons.protocols.api_support.types import APIVersion

    body, version = load_templates(docs_root)[case.track]
    namespace: dict = {}
    context = simulate.get_protocol_api(
        version=version, robot_type=case.track.robot_type
    )
    namespace["protocol"] = context
    # Every fragment can assume `parameters`, just like `protocol` — a snippet
    # written for add_parameters() scope (`parameters.add_bool(...)`) can then
    # run standalone. It's a throwaway: registering into it has no effect on
    # `protocol.params` unless the page also has a params-template (below).
    namespace["parameters"] = ParameterContext(
        api_version=APIVersion.from_string(version)
    )
    try:
        exec(compile(body, f"<template:{case.track.value}>", "exec"), namespace)
        if case.params_seed:
            # Replay the page's real add_parameters() definitions against a
            # *separate*, fresh ParameterContext, then attach the export to
            # `protocol.params` — exactly what a real run does before run()
            # ever executes — so fragments written for run() scope see real
            # parameter values instead of an empty Parameters().
            parameter_context = ParameterContext(
                api_version=APIVersion.from_string(version)
            )
            exec(
                compile(
                    case.params_seed,
                    f"<params-seed:{case.snippet.rel_path}>",
                    "exec",
                ),
                {"parameters": parameter_context},
            )
            context._params = parameter_context.export_parameters_for_protocol()
        if case.page_seed:
            exec(
                compile(
                    case.page_seed, f"<page-template:{case.snippet.rel_path}>", "exec"
                ),
                namespace,
            )
        if case.object_seed:
            exec(
                compile(
                    case.object_seed, f"<object-seed:{case.snippet.rel_path}>", "exec"
                ),
                namespace,
            )
        if case.tip_seed:
            exec(
                compile(case.tip_seed, f"<tip-seed:{case.snippet.rel_path}>", "exec"),
                namespace,
            )
        for code in case.chain:
            exec(compile(code, case.snippet.location, "exec"), namespace)
    finally:
        _release_simulated_context(context)


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
    "labware latch has not been set to closed",  # needs the latch closed by a prior snippet
    "with its lid closed",  # needs the Thermocycler lid opened by a prior snippet
    "without calling `.initialize(...)` first",  # needs the reader initialized by a prior snippet
    "before specifying WellOrigin.MENISCUS",  # needs LiquidProbe/load_liquid from a prior snippet
    "cannot probe for liquid when the tip has liquid in it",  # needs an empty tip from a prior snippet
    "only supported on 96-Channel pipettes",  # needs a 96-channel pipette instead of the base template's
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
