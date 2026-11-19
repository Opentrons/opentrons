"""Generate protocols from a Golden Studio catalog export by calling a running AI server.

Workflow:
    1. extract  - unpack a ``*.tar.zst`` Golden Studio export into ``tmp/golden-studio/catalogs/<group>``
    2. list     - show the prompts in an extracted catalog
    3. run      - POST each prompt to ``/api/chat/completion``, save the protocol, and analyze it
    4. analyze  - (re)analyze already generated protocols with the Protocol Analysis service

Generated protocols are written to ``golden-studio-outputs/<group>/<key>.py`` (tracked in git, so runs can be diffed),
with the Opentrons analysis JSON from the Protocol Analysis service (``tests/helpers/analysis_client.py``) beside it
as ``<key>.json``.
Raw replies, results, and summaries go to ``tmp/golden-studio/runs/<run-id>`` (gitignored). Python files bundled in
the export are ignored. Auth, base URL, and token caching come from ``tests/helpers/test.env`` via the live test ``Client``.

Examples:
    python -m tests.helpers.golden_harness extract
    python -m tests.helpers.golden_harness run --only 'PCR-*' --limit 2
    python -m tests.helpers.golden_harness run --resume tmp/golden-studio/runs/<run-id>
"""

import argparse
import ast
import fnmatch
import json
import re
import shutil
import subprocess
import tarfile
import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Literal

import yaml
from api.models.chat_request import ChatRequest, FakeKeys
from httpx import HTTPError
from rich.console import Console
from rich.table import Table

from tests.helpers.analysis_client import AnalysisClient, AnalysisTarget, get_analysis_config
from tests.helpers.client import Client
from tests.helpers.settings import get_settings

PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORK_ROOT = PROJECT_ROOT / "tmp" / "golden-studio"
CATALOGS_DIR = WORK_ROOT / "catalogs"
RUNS_DIR = WORK_ROOT / "runs"
OUTPUTS_DIR = PROJECT_ROOT / "golden-studio-outputs"
MANIFEST_NAME = "manifest.json"
RESULTS_NAME = "results.jsonl"

Pathway = Literal["client", "create"]

console = Console()
_results_lock = threading.Lock()


@dataclass
class Prompt:
    key: str
    group: str
    title: str
    prompt_text: str
    metadata: dict[str, Any]


@dataclass
class Result:
    key: str
    status: Literal["ok", "no_code", "http_error", "error"]
    elapsed_seconds: float
    http_status: int | None = None
    generated_path: str | None = None
    reply_path: str | None = None
    checks: dict[str, bool] = field(default_factory=dict)
    error: str | None = None
    analysis_path: str | None = None
    analysis_status: str | None = None
    analysis_result: str | None = None
    analysis_job_id: str | None = None
    analyzer: str | None = None
    analysis_error: str | None = None


# --------------------------------------------------------------------------- extract


def _find_default_archive() -> Path:
    archives = sorted(PROJECT_ROOT.glob("*.tar.zst"))
    if len(archives) != 1:
        found = ", ".join(a.name for a in archives) or "none"
        raise SystemExit(f"Pass --archive explicitly; expected exactly one *.tar.zst in {PROJECT_ROOT} (found: {found})")
    return archives[0]


def _read_manifest_from_archive(archive: Path) -> dict[str, Any]:
    with _open_zst_tar(archive) as tar:
        for member in tar:
            if Path(member.name).name == MANIFEST_NAME:
                extracted = tar.extractfile(member)
                if extracted is not None:
                    return dict(json.load(extracted))
    raise SystemExit(f"{MANIFEST_NAME} not found in {archive}")


class _open_zst_tar:
    """Stream a .tar.zst through the ``zstd`` CLI (Python 3.12 tarfile has no zstd support)."""

    def __init__(self, archive: Path) -> None:
        if shutil.which("zstd") is None:
            raise SystemExit("zstd CLI not found; install it with `brew install zstd`")
        self._proc = subprocess.Popen(["zstd", "-dc", str(archive)], stdout=subprocess.PIPE)
        assert self._proc.stdout is not None
        self._tar = tarfile.open(fileobj=self._proc.stdout, mode="r|")

    def __enter__(self) -> tarfile.TarFile:
        return self._tar

    def __exit__(self, *_: object) -> None:
        self._tar.close()
        if self._proc.stdout is not None:
            self._proc.stdout.close()
        self._proc.wait()


def extract(archive: Path, force: bool) -> Path:
    manifest = _read_manifest_from_archive(archive)
    slug = str(manifest["group"]["slug"])
    dest = CATALOGS_DIR / slug
    if dest.exists():
        if not force:
            console.print(f"[yellow]{dest} already exists; use --force to re-extract[/yellow]")
            return dest
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    with _open_zst_tar(archive) as tar:
        tar.extractall(dest, filter="data")
    console.print(f"[green]Extracted {archive.name} -> {dest.relative_to(PROJECT_ROOT)}[/green]")
    return dest


# --------------------------------------------------------------------------- catalog


def _resolve_catalog_dir(catalog: Path | None) -> Path:
    if catalog is not None:
        return catalog.resolve()
    candidates = sorted(p.parent for p in CATALOGS_DIR.glob(f"*/*/{MANIFEST_NAME}")) if CATALOGS_DIR.exists() else []
    if len(candidates) != 1:
        found = ", ".join(str(c.relative_to(PROJECT_ROOT)) for c in candidates) or "none"
        raise SystemExit(f"Pass --catalog explicitly; expected exactly one extracted catalog under {CATALOGS_DIR} (found: {found})")
    return candidates[0].parent


def load_prompts(catalog_dir: Path) -> list[Prompt]:
    """Load active prompts from an extracted export (directory containing manifest.json's parent)."""
    manifests = list(catalog_dir.glob(f"**/{MANIFEST_NAME}"))
    if len(manifests) != 1:
        raise SystemExit(f"Expected exactly one {MANIFEST_NAME} under {catalog_dir}")
    export_root = manifests[0].parent.parent
    manifest = json.loads(manifests[0].read_text())
    catalog = yaml.safe_load((export_root / manifest["catalog_path"]).read_text())

    prompts: list[Prompt] = []
    for group in catalog.get("groups", []):
        for item in group.get("prompts", []):
            if not item.get("is_active", True):
                continue
            key = str(item["key"])
            prompts.append(
                Prompt(
                    key=key,
                    group=str(group["slug"]),
                    title=str(item.get("title") or key),
                    prompt_text=str(item["prompt_text"]),
                    metadata=dict(item.get("metadata") or {}),
                )
            )
    return prompts


def filter_prompts(prompts: list[Prompt], only: list[str] | None, limit: int | None) -> list[Prompt]:
    if only:
        prompts = [p for p in prompts if any(fnmatch.fnmatch(p.key, pattern) for pattern in only)]
    return prompts[:limit] if limit else prompts


# --------------------------------------------------------------------------- run

_PYTHON_BLOCK = re.compile(r"```(?:python|py)\s*\n(.*?)```", re.DOTALL)


def extract_python(reply: str) -> str | None:
    """Return the largest fenced python block in a markdown reply."""
    blocks = _PYTHON_BLOCK.findall(reply)
    return max(blocks, key=len).strip() + "\n" if blocks else None


def static_checks(code: str, metadata: dict[str, Any]) -> dict[str, bool]:
    checks: dict[str, bool] = {}
    try:
        tree = ast.parse(code)
        checks["parses"] = True
        checks["has_run"] = any(isinstance(node, ast.FunctionDef) and node.name == "run" for node in ast.walk(tree))
    except SyntaxError:
        checks["parses"] = False
        checks["has_run"] = False
    if api_level := metadata.get("api_level"):
        checks["api_level_matches"] = bool(re.search(rf"[\"']apiLevel[\"']\s*:\s*[\"']{re.escape(str(api_level))}[\"']", code))
    if robot_type := metadata.get("robot_type"):
        checks["robot_type_matches"] = bool(re.search(rf"[\"']robotType[\"']\s*:\s*[\"']{re.escape(str(robot_type))}[\"']", code))
    return checks


def fake_key_for(prompt: Prompt) -> FakeKeys | None:
    """Pick the server's canned fake response closest to the prompt so --fake exercises code extraction."""
    application = str(prompt.metadata.get("application", "")).lower()
    flex = str(prompt.metadata.get("robot_type", "")).lower() == "flex"
    if application == "pcr":
        return "pcr flex" if flex else "pcr"
    if application == "reagent transfer":
        return "reagent transfer flex" if flex else "reagent transfer"
    return None


def build_request(prompt: Prompt, pathway: Pathway, fake: bool) -> ChatRequest:
    # "client" mirrors the AI client's first message (empty history -> server "update" chat path).
    # "create" seeds history with the prompt so _determine_protocol_action routes to claude.create.
    history: list[Any] | None = [{"role": "user", "content": prompt.prompt_text}] if pathway == "create" else []
    return ChatRequest(
        message=prompt.prompt_text,
        history=history,
        fake=fake,
        fake_key=fake_key_for(prompt) if fake else None,
        chat_options="create" if pathway == "create" else "update",
        pd_protocol_content=None,
        attachments=None,
    )


def analyze_into(analysis_client: AnalysisClient, protocol_path: Path, result: Result) -> None:
    """Analyze ``protocol_path`` and write the Opentrons analysis to the sibling ``.json``."""
    outcome = analysis_client.analyze(protocol_path)
    json_path = protocol_path.with_suffix(".json")
    if outcome.analysis is not None:
        json_path.write_text(json.dumps(outcome.analysis, indent=2) + "\n")
        result.analysis_path = str(json_path)
    else:
        json_path.unlink(missing_ok=True)
    result.analysis_status = outcome.status
    result.analysis_result = outcome.result
    result.analysis_job_id = outcome.job_id
    result.analyzer = outcome.analyzer
    first_error = outcome.errors[0] if outcome.errors else None
    result.analysis_error = f"{first_error.get('errorType')}: {first_error.get('detail')}"[:500] if first_error else (outcome.error or None)
    result.checks["analysis_ok"] = outcome.ok


def run_one(
    client: Client,
    analysis_client: AnalysisClient | None,
    prompt: Prompt,
    run_dir: Path,
    output_dir: Path,
    pathway: Pathway,
    fake: bool,
) -> Result:
    request = build_request(prompt, pathway, fake)
    start = time.monotonic()
    try:
        response = client.httpx.post(
            "/chat/completion", headers=client.standard_headers, json=request.model_dump(mode="json", by_alias=True)
        )
    except HTTPError as err:
        return Result(key=prompt.key, status="error", elapsed_seconds=time.monotonic() - start, error=repr(err))
    elapsed = time.monotonic() - start

    if response.status_code != 200:
        return Result(
            key=prompt.key,
            status="http_error",
            elapsed_seconds=elapsed,
            http_status=response.status_code,
            error=response.text[:2000],
        )

    reply = str(response.json().get("reply", ""))
    reply_path = run_dir / "replies" / f"{prompt.key}.md"
    reply_path.write_text(reply)

    code = extract_python(reply)
    if code is None:
        return Result(
            key=prompt.key,
            status="no_code",
            elapsed_seconds=elapsed,
            http_status=200,
            reply_path=str(reply_path),
        )

    generated_path = output_dir / prompt.group / f"{prompt.key}.py"
    generated_path.parent.mkdir(parents=True, exist_ok=True)
    generated_path.write_text(code)
    result = Result(
        key=prompt.key,
        status="ok",
        elapsed_seconds=elapsed,
        http_status=200,
        generated_path=str(generated_path),
        reply_path=str(reply_path),
        checks=static_checks(code, prompt.metadata),
    )
    if analysis_client is not None:
        analyze_into(analysis_client, generated_path, result)
    return result


def _load_completed(run_dir: Path) -> set[str]:
    results_file = run_dir / RESULTS_NAME
    if not results_file.exists():
        return set()
    done: set[str] = set()
    for line in results_file.read_text().splitlines():
        if line.strip():
            record = json.loads(line)
            if record.get("status") == "ok":
                done.add(str(record["key"]))
    return done


def _append_result(run_dir: Path, result: Result) -> None:
    with _results_lock, (run_dir / RESULTS_NAME).open("a") as fh:
        fh.write(json.dumps(asdict(result)) + "\n")


def _latest_results(run_dir: Path) -> list[dict[str, Any]]:
    latest: dict[str, dict[str, Any]] = {}
    for line in (run_dir / RESULTS_NAME).read_text().splitlines():
        if line.strip():
            record = json.loads(line)
            latest[str(record["key"])] = record
    return list(latest.values())


def write_summary(run_dir: Path) -> None:
    records = _latest_results(run_dir)
    check_names = sorted({name for r in records for name in r.get("checks", {})})

    table = Table(title=f"Golden run: {run_dir.name}")
    for column in ["key", "status", "secs", *check_names]:
        table.add_column(column)
    lines = [
        f"# Golden run `{run_dir.name}`",
        "",
        "| key | status | secs | " + " | ".join(check_names) + " |",
        "|" + " --- |" * (3 + len(check_names)),
    ]
    for r in sorted(records, key=lambda rec: str(rec["key"])):
        marks = ["pass" if r.get("checks", {}).get(name) else ("fail" if name in r.get("checks", {}) else "-") for name in check_names]
        row = [str(r["key"]), str(r["status"]), f"{r['elapsed_seconds']:.1f}", *marks]
        table.add_row(*row)
        lines.append("| " + " | ".join(row) + " |")

    ok = sum(1 for r in records if r["status"] == "ok")
    lines += ["", f"{ok}/{len(records)} prompts returned a python protocol."]
    analyzed = [r for r in records if r.get("analysis_status")]
    if analyzed:
        analysis_ok = sum(1 for r in analyzed if r.get("checks", {}).get("analysis_ok"))
        lines.append(f"{analysis_ok}/{len(analyzed)} analyzed protocols returned result ok.")
        failures = [r for r in analyzed if not r.get("checks", {}).get("analysis_ok")]
        if failures:
            lines += ["", "## Analysis failures", ""]
            lines += [f"- `{r['key']}` ({r.get('analysis_result') or r['analysis_status']}): {r.get('analysis_error')}" for r in failures]
        console.print(f"[bold]{analysis_ok}/{len(analyzed)} analysis ok[/bold]")
        for r in failures:
            console.print(f"[red]{r['key']}[/red]: {r.get('analysis_error')}")
    (run_dir / "summary.md").write_text("\n".join(lines) + "\n")
    console.print(table)
    console.print(f"[bold]{ok}/{len(records)} ok[/bold]  results: {(run_dir / RESULTS_NAME).relative_to(PROJECT_ROOT)}")


def run(args: argparse.Namespace) -> None:
    catalog_dir = _resolve_catalog_dir(args.catalog)
    prompts = filter_prompts(load_prompts(catalog_dir), args.only, args.limit)

    if args.resume:
        run_dir = Path(args.resume).resolve()
        completed = _load_completed(run_dir)
        prompts = [p for p in prompts if p.key not in completed]
        console.print(f"Resuming {run_dir.name}: {len(completed)} already ok, {len(prompts)} remaining")
    else:
        run_id = f"{datetime.now():%Y%m%d-%H%M%S}-{args.env}-{args.pathway}{'-fake' if args.fake else ''}"
        run_dir = RUNS_DIR / run_id
    (run_dir / "replies").mkdir(parents=True, exist_ok=True)
    # Fake replies are canned, so keep them out of the tracked outputs directory.
    output_dir = run_dir / "generated" if args.fake else Path(args.output_dir).resolve()

    settings = get_settings(env=args.env)
    client = Client(settings)
    analysis_client = None if args.fake or args.no_analyze else _open_analysis_client(args.analysis_env)
    try:
        health = client.get_health()
        health.raise_for_status()
        console.print(f"[green]Server healthy at {settings.BASE_URL}[/green] {health.json()}")

        run_meta = {
            "catalog": str(catalog_dir),
            "env": args.env,
            "base_url": settings.BASE_URL,
            "pathway": args.pathway,
            "fake": args.fake,
            "output_dir": str(output_dir),
            "analysis_url": analysis_client.config.api_base_url if analysis_client else None,
            "concurrency": args.concurrency,
            "server_health": health.json(),
            "started_at": datetime.now().isoformat(),
        }
        (run_dir / "run.json").write_text(json.dumps(run_meta, indent=2) + "\n")

        with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            futures = [pool.submit(run_one, client, analysis_client, p, run_dir, output_dir, args.pathway, args.fake) for p in prompts]
            _collect(run_dir, futures)
    finally:
        client.close()
        if analysis_client is not None:
            analysis_client.close()

    if (run_dir / RESULTS_NAME).exists():
        write_summary(run_dir)


def _open_analysis_client(target: AnalysisTarget) -> AnalysisClient:
    analysis_client = AnalysisClient(get_analysis_config(target))
    health = analysis_client.health()
    console.print(f"[green]Analysis service healthy at {analysis_client.config.api_base_url}[/green] version={health.get('version')}")
    return analysis_client


def _collect(run_dir: Path, futures: list[Future[Result]]) -> None:
    for i, future in enumerate(as_completed(futures), start=1):
        result = future.result()
        _append_result(run_dir, result)
        color = "green" if result.status == "ok" and result.checks.get("analysis_ok", True) else "red"
        analysis = f" analysis={result.analysis_result or result.analysis_status}" if result.analysis_status else ""
        console.print(f"[{color}]{i}/{len(futures)} {result.key}: {result.status}{analysis}[/{color}] ({result.elapsed_seconds:.1f}s)")


def analyze_one(analysis_client: AnalysisClient, key: str, protocol_path: Path) -> Result:
    start = time.monotonic()
    result = Result(key=key, status="ok", elapsed_seconds=0.0, generated_path=str(protocol_path))
    analyze_into(analysis_client, protocol_path, result)
    result.elapsed_seconds = time.monotonic() - start
    return result


def analyze(args: argparse.Namespace) -> None:
    """Analyze already generated ``<output-dir>/<group>/<key>.py`` files and write sibling ``.json`` analyses."""
    paths = sorted(Path(args.output_dir).resolve().glob("*/*.py"))
    if args.only:
        paths = [p for p in paths if any(fnmatch.fnmatch(p.stem, pattern) for pattern in args.only)]
    if args.limit:
        paths = paths[: args.limit]
    if not paths:
        raise SystemExit(f"No protocols found under {args.output_dir}")

    run_dir = RUNS_DIR / f"{datetime.now():%Y%m%d-%H%M%S}-analyze-{args.analysis_env}"
    run_dir.mkdir(parents=True)
    analysis_client = _open_analysis_client(args.analysis_env)
    try:
        (run_dir / "run.json").write_text(
            json.dumps({"analysis_url": analysis_client.config.api_base_url, "protocols": [str(p) for p in paths]}, indent=2) + "\n"
        )
        with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            _collect(run_dir, [pool.submit(analyze_one, analysis_client, p.stem, p) for p in paths])
    finally:
        analysis_client.close()
    write_summary(run_dir)


# --------------------------------------------------------------------------- cli


def list_prompts(args: argparse.Namespace) -> None:
    prompts = filter_prompts(load_prompts(_resolve_catalog_dir(args.catalog)), args.only, args.limit)
    table = Table(title=f"{len(prompts)} prompts")
    for column in ["key", "group", "robot", "api", "application"]:
        table.add_column(column)
    for p in prompts:
        table.add_row(
            p.key,
            p.group,
            str(p.metadata.get("robot_type", "")),
            str(p.metadata.get("api_level", "")),
            str(p.metadata.get("application", "")),
        )
    console.print(table)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    p_extract = sub.add_parser("extract", help="Unpack a Golden Studio .tar.zst export")
    p_extract.add_argument("--archive", type=Path, help="Defaults to the only *.tar.zst in opentrons-ai-server/")
    p_extract.add_argument("--force", action="store_true", help="Replace an existing extraction")

    def add_selection(p: argparse.ArgumentParser) -> None:
        p.add_argument("--catalog", type=Path, help="Extracted catalog dir; defaults to the only one under tmp/golden-studio/catalogs")
        p.add_argument("--only", nargs="+", metavar="GLOB", help="Prompt key globs, e.g. 'PCR-*' 'Serial-dilution-1-v2'")
        p.add_argument("--limit", type=int, help="Max prompts to process")

    p_list = sub.add_parser("list", help="List prompts in an extracted catalog")
    add_selection(p_list)

    p_run = sub.add_parser("run", help="Generate protocols from prompts via the running server")
    add_selection(p_run)
    p_run.add_argument("--env", default="local", choices=["local", "dev", "sandbox", "crt", "staging", "prod"])
    p_run.add_argument(
        "--pathway",
        default="create",
        choices=["client", "create"],
        help="create: seed history so the server uses claude.create in one shot (default). client: mirror the AI client first message",
    )
    p_run.add_argument("--output-dir", type=Path, default=OUTPUTS_DIR, help="Where <group>/<key>.py protocols are written")
    p_run.add_argument("--concurrency", type=int, default=2, help="Parallel requests (each can take minutes)")
    p_run.add_argument(
        "--fake", action="store_true", help="Use the server's canned fake responses (no Anthropic calls); PCR/reagent prompts return code"
    )
    p_run.add_argument("--resume", type=Path, help="Existing run dir; skips prompts already 'ok'")
    p_run.add_argument("--no-analyze", action="store_true", help="Skip Protocol Analysis service calls")
    p_run.add_argument("--analysis-env", default="dev", choices=["local", "dev", "prod"], help="INTEGRATION_<ENV>_* in test.env")

    p_analyze = sub.add_parser("analyze", help="Analyze generated protocols via the Protocol Analysis service; writes <key>.json")
    p_analyze.add_argument("--output-dir", type=Path, default=OUTPUTS_DIR, help="Directory containing <group>/<key>.py")
    p_analyze.add_argument("--only", nargs="+", metavar="GLOB", help="Protocol key globs")
    p_analyze.add_argument("--limit", type=int, help="Max protocols to analyze")
    p_analyze.add_argument("--concurrency", type=int, default=4)
    p_analyze.add_argument("--analysis-env", default="dev", choices=["local", "dev", "prod"], help="INTEGRATION_<ENV>_* in test.env")

    args = parser.parse_args()
    if args.command == "extract":
        extract(args.archive or _find_default_archive(), args.force)
    elif args.command == "list":
        list_prompts(args)
    elif args.command == "run":
        run(args)
    elif args.command == "analyze":
        analyze(args)


if __name__ == "__main__":
    main()
