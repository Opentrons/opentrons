#!/usr/bin/env python3
"""
Run the snapshot prompt suite against the API and write responses to snapshots/temp/.

Does not overwrite approved snapshots. Use promote_snapshots.py to promote temp to approved.

By default runs in dry-run mode (fake=True, fake_key) so no LLM is called. Use --live to call the real API.

Usage:
  uv run python scripts/run_snapshots.py [--env local|staging]        # dry-run (default)
  uv run python scripts/run_snapshots.py --live [--env local|staging] # real API
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import yaml
from rich.console import Console  # type: ignore[import-untyped]
from rich.panel import Panel  # type: ignore[import-untyped]
from rich.progress import Progress, SpinnerColumn, TaskProgressColumn  # type: ignore[import-untyped]
from rich.table import Table  # type: ignore[import-untyped]

# Project root is parent of scripts/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = PROJECT_ROOT / "snapshots"
PROMPTS_PATH = SNAPSHOTS_DIR / "prompts.yaml"
TEMP_DIR = SNAPSHOTS_DIR / "temp"

# Default fake_key for dry-run chat completion (deterministic response with protocol content)
DEFAULT_FAKE_KEY = "reagent transfer"

console = Console()


def load_prompts() -> list[dict]:
    """Load prompt suite from prompts.yaml."""
    if not PROMPTS_PATH.exists():
        console.print(f"[red]Error:[/red] prompts file not found: {PROMPTS_PATH}")
        sys.exit(1)
    with open(PROMPTS_PATH) as f:
        data = yaml.safe_load(f)
    prompts = data.get("prompts") or []
    if not prompts:
        console.print("[red]Error:[/red] no prompts defined in prompts.yaml")
        sys.exit(1)
    return prompts


def response_to_markdown(status_code: int, body: dict) -> str:
    """Format API response as readable markdown for snapshot."""
    lines = [
        "# API Response Snapshot",
        "",
        f"**Status:** {status_code}",
        "",
        "## Reply",
        "",
        (body.get("reply") or "(empty)").strip(),
        "",
    ]
    if body.get("protocol_content") is not None:
        lines.extend(
            [
                "## Protocol content",
                "",
                "```json",
                json.dumps(body["protocol_content"], indent=2),
                "```",
                "",
            ]
        )
    if body.get("file_token_warning"):
        lines.extend(
            [
                "## File token warning",
                "",
                body["file_token_warning"],
                "",
            ]
        )
    if body.get("received_files"):
        lines.extend(
            [
                "## Received files",
                "",
                ", ".join(body["received_files"]),
                "",
            ]
        )
    lines.append("**fake:** " + str(body.get("fake", False)))
    return "\n".join(lines).strip() + "\n"


def resolve_path(relative_path: str) -> Path:
    """Resolve a path from prompts.yaml (relative to snapshots/) to an absolute path."""
    return (SNAPSHOTS_DIR / relative_path).resolve()


def _run_one_prompt(
    entry: dict,
    dry_run: bool,
    default_fake_key: str | None,
    settings: object,
) -> tuple[str, str, str, bool]:
    """Run a single prompt (own client), write snapshot, return (pid, slug, out_path, ok).
    When dry_run is True, every request uses fake=True (no LLM). Real API only when --live.
    """
    sys.path.insert(0, str(PROJECT_ROOT))
    from tests.helpers.client import Client  # type: ignore[import-untyped]

    pid = entry["id"]
    slug = entry["slug"]
    message = entry["message"].strip()
    filename = f"{pid}_{slug}.snapshot.md"
    out_path = TEMP_DIR / filename
    # All prompts get fake responses until --live is passed
    use_fake = dry_run
    prompt_fake_key = entry.get("fake_key") if use_fake else None
    fake_key = prompt_fake_key if prompt_fake_key is not None else default_fake_key

    client = Client(settings)
    try:
        if "protocol_file" in entry:
            proto_path = resolve_path(entry["protocol_file"])
            if not proto_path.exists():
                return (pid, slug, str(out_path), False)
            protocol_text = proto_path.read_text(encoding="utf-8")
            response = client.post_update_protocol(
                protocol_text=protocol_text, prompt=message, fake=use_fake
            )
        elif "attachments" in entry:
            paths = [resolve_path(p) for p in entry["attachments"]]
            if any(not p.exists() for p in paths):
                return (pid, slug, str(out_path), False)
            response = client.post_chat_completion_multipart(
                message=message, file_paths=paths, fake=use_fake
            )
        else:
            response = client.get_chat_completion(
                message, fake=use_fake, fake_key=fake_key
            )

        try:
            body = response.json()
        except Exception:
            body = {
                "reply": response.text,
                "fake": use_fake,
                "protocol_content": None,
                "file_token_warning": None,
                "received_files": None,
            }
        md = response_to_markdown(response.status_code, body)
        out_path.write_text(md, encoding="utf-8")
        return (pid, slug, str(out_path), True)
    except Exception:
        return (pid, slug, str(out_path), False)
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run snapshot prompts against the API and write to snapshots/temp/. Default: dry-run (fake responses)."
    )
    parser.add_argument("--env", default="local", help="Target environment (local, staging, prod)")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Call the real API (default is dry-run with fake_key, no LLM call)",
    )
    parser.add_argument(
        "--fake-key",
        default=DEFAULT_FAKE_KEY,
        help=f"Fake response key for dry-run chat completion (default: {DEFAULT_FAKE_KEY})",
    )
    args = parser.parse_args()

    dry_run = not args.live
    prompts = load_prompts()
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    # Summary table
    mode = "[dim]dry-run (fake)[/dim]" if dry_run else "[bold green]live[/bold green]"
    table = Table(title="Snapshot run", show_header=True, header_style="bold")
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="green")
    table.add_row("Mode", mode)
    table.add_row("Environment", args.env)
    table.add_row("Prompts", str(len(prompts)))
    table.add_row("Output", str(TEMP_DIR))
    if dry_run:
        table.add_row("Fake key (chat)", args.fake_key)
    console.print(Panel(table, title="[bold]Run config[/bold]", border_style="blue"))
    console.print()

    sys.path.insert(0, str(PROJECT_ROOT))
    from tests.helpers.settings import get_settings  # type: ignore[import-untyped]

    settings = get_settings(env=args.env)
    # All prompts get fake responses until --live is passed
    default_fake_key: str | None = args.fake_key if dry_run else None

    with Progress(
        SpinnerColumn(),
        TaskProgressColumn(),
        console=console,
        expand=True,
    ) as progress:
        task = progress.add_task("[cyan]Running prompts (parallel)...", total=len(prompts))
        results: list[tuple[str, str, str, bool]] = []
        with ThreadPoolExecutor(max_workers=len(prompts)) as executor:
            futures = {
                executor.submit(_run_one_prompt, entry, dry_run, default_fake_key, settings): entry
                for entry in prompts
            }
            for future in as_completed(futures):
                try:
                    results.append(future.result())
                except Exception as e:
                    entry = futures[future]
                    results.append((entry["id"], entry["slug"], str(TEMP_DIR / f"{entry['id']}_{entry['slug']}.snapshot.md"), False))
                    console.print(f"[red]Error {entry['id']} ({entry['slug']}):[/red] {e}")
                progress.advance(task)

    # Sort by prompt id for stable table order
    results.sort(key=lambda r: r[0])

    # Log any skips (missing files)
    for pid, slug, path, ok in results:
        if not ok:
            entry = next((p for p in prompts if p["id"] == pid), None)
            if entry and "protocol_file" in entry:
                proto_path = resolve_path(entry["protocol_file"])
                if not proto_path.exists():
                    console.print(f"[yellow]Skipped {pid} ({slug}):[/yellow] protocol_file not found: {proto_path}")
            elif entry and "attachments" in entry:
                paths = [resolve_path(p) for p in entry["attachments"]]
                missing = [p for p in paths if not p.exists()]
                if missing:
                    console.print(f"[yellow]Skipped {pid} ({slug}):[/yellow] attachment(s) not found: {[str(p) for p in missing]}")

    # Results table
    result_table = Table(title="Results", show_header=True, header_style="bold")
    result_table.add_column("ID", style="dim")
    result_table.add_column("Slug", style="cyan")
    result_table.add_column("Output", style="green")
    result_table.add_column("Status", justify="right")
    for pid, slug, path, ok in results:
        status = "[green]OK[/green]" if ok else "[red]FAIL[/red]"
        result_table.add_row(pid, slug, path, status)
    console.print()
    console.print(Panel(result_table, title="[bold]Snapshots written[/bold]", border_style="green"))
    console.print(f"\n[dim]Temp snapshots: {TEMP_DIR}[/dim]")
    if dry_run:
        console.print("[dim]Run with --live to call the real API. Use promote_snapshots.py to promote temp to approved.[/dim]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
