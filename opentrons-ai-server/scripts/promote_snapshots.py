#!/usr/bin/env python3
"""
Promote temporary snapshots to approved: archive current approved (with timestamp), then move temp to approved.

Run after reviewing the diff between snapshots/temp and snapshots/approved.

Usage:
  uv run python scripts/promote_snapshots.py
"""

from __future__ import annotations

import shutil
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console  # type: ignore[import-untyped]
from rich.panel import Panel  # type: ignore[import-untyped]
from rich.table import Table  # type: ignore[import-untyped]

# Project root is parent of scripts/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = PROJECT_ROOT / "snapshots"
APPROVED_DIR = SNAPSHOTS_DIR / "approved"
TEMP_DIR = SNAPSHOTS_DIR / "temp"
ARCHIVE_DIR = SNAPSHOTS_DIR / "archive"

console = Console()


def main() -> int:
    if not TEMP_DIR.exists() or not any(TEMP_DIR.glob("*.snapshot.md")):
        console.print("[red]No temp snapshots found.[/red] Run scripts/run_snapshots.py first.")
        return 1

    APPROVED_DIR.mkdir(parents=True, exist_ok=True)
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    promoted: list[tuple[str, str | None, str]] = []  # (name, archived_path, approved_path)
    for temp_path in sorted(TEMP_DIR.glob("*.snapshot.md")):
        name = temp_path.name
        base = name.replace(".snapshot.md", "")
        archive_name = f"{base}.snapshot.{timestamp}.md"
        approved_path = APPROVED_DIR / name
        archive_path = ARCHIVE_DIR / archive_name

        if approved_path.exists():
            shutil.move(str(approved_path), str(archive_path))
            promoted.append((name, str(archive_path), str(approved_path)))
        else:
            promoted.append((name, None, str(approved_path)))
        shutil.move(str(temp_path), str(approved_path))

    table = Table(title="Promoted snapshots", show_header=True, header_style="bold")
    table.add_column("Snapshot", style="cyan")
    table.add_column("Archived (previous)", style="dim")
    table.add_column("Approved (new)", style="green")
    for name, archived, approved in promoted:
        table.add_row(name, archived or "—", approved)
    console.print(Panel(table, title="[bold]Promote complete[/bold]", border_style="green"))
    console.print(f"\n[dim]Previous approved moved to archive/ with timestamp {timestamp}[/dim]")

    if TEMP_DIR.exists() and not any(TEMP_DIR.iterdir()):
        TEMP_DIR.rmdir()
    return 0


if __name__ == "__main__":
    sys.exit(main())
