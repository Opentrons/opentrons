# /// script
# dependencies = [
#   "rich",
# ]
# ///
"""
Locize synchronization script for managing i18n translations.

This script consolidates localization files from multiple locations in the monorepo
and syncs them with Locize cloud service. It can be run locally or in CI/CD pipelines.

Usage:
    LOCIZE_API_KEY=your_key LOCIZE_PROJECT_ID=your_id uv run scripts/locize_sync.py push-local
    LOCIZE_API_KEY=your_key LOCIZE_PROJECT_ID=your_id uv run scripts/locize_sync.py download-remote
    LOCIZE_API_KEY=your_key LOCIZE_PROJECT_ID=your_id uv run scripts/locize_sync.py push-local --dry-run

Environment Variables:
    LOCIZE_API_KEY: API key for Locize service
    LOCIZE_PROJECT_ID: Project ID for Locize

Linting and Formatting:
uvx ruff check --fix scripts/locize_sync.py && uvx ruff format scripts/locize_sync.py
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


# Paths relative to repository root
REPO_ROOT = Path(__file__).parent.parent
APP_LOCALIZATION = REPO_ROOT / "app" / "src" / "assets" / "localization"
COMPONENTS_LOCALIZATION = REPO_ROOT / "components" / "src" / "assets" / "localization"

# Languages to sync
LANGUAGES = ["en", "zh"]

PRETTIER_VERSION = "3.6.2"

LOCALIZATION_JSON_DIRS = [
    APP_LOCALIZATION / "en",
    APP_LOCALIZATION / "zh",
    COMPONENTS_LOCALIZATION / "en",
    COMPONENTS_LOCALIZATION / "zh",
]


def check_environment():
    """Verify required environment variables are set."""
    api_key = os.getenv("LOCIZE_API_KEY")
    project_id = os.getenv("LOCIZE_PROJECT_ID")

    if not api_key:
        console.print("[bold red]Error:[/] LOCIZE_API_KEY environment variable not set")
        sys.exit(1)

    if not project_id:
        console.print(
            "[bold red]Error:[/] LOCIZE_PROJECT_ID environment variable not set"
        )
        sys.exit(1)

    return api_key, project_id


def consolidate_localization_files(dry_run=False):
    """
    Copy localization files from components to app directory.

    This ensures all translation files are in a single location that Locize CLI
    can process. Files are copied (not moved) to preserve the original structure.

    Args:
        dry_run: If True, still perform filesystem operations but skip remote
            side effects (Locize calls, formatting)

    Returns a list of files that were copied, for later cleanup.
    """
    console.print("\n[bold cyan]📦 Consolidating localization files...[/]")
    if dry_run:
        console.print(
            "[yellow]  [DRY RUN MODE - Consolidation still runs; Locize commands execute with --dry][/yellow]"
        )

    copied_files: list[Path] = []

    for lang in LANGUAGES:
        src_dir = COMPONENTS_LOCALIZATION / lang
        dst_dir = APP_LOCALIZATION / lang

        if not src_dir.exists():
            console.print(
                f"[yellow]  ⚠ Warning:[/] {src_dir} does not exist, skipping..."
            )
            continue

        json_files = list(src_dir.glob("*.json"))

        if not json_files:
            console.print(f"[dim]  No JSON files found in {src_dir}[/]")
            continue

        table = Table(
            title=f"Files to copy from components/{lang}/ to app/{lang}/",
            show_header=True,
            header_style="bold magenta",
            border_style="blue",
        )
        table.add_column("File", style="cyan")
        table.add_column("Source", style="green", overflow="fold")
        table.add_column("Destination", style="yellow", overflow="fold")

        for json_file in json_files:
            dst_file = dst_dir / json_file.name
            table.add_row(json_file.name, str(json_file), str(dst_file))

        console.print(table)

        dst_dir.mkdir(parents=True, exist_ok=True)
        for json_file in json_files:
            dst_file = dst_dir / json_file.name
            shutil.copy2(json_file, dst_file)
            copied_files.append(dst_file)

    status = "were (dry run)" if dry_run else "were"
    console.print(
        f"\n[bold green]✓[/] Consolidation complete. {len(copied_files)} file(s) {status} copied.\n"
    )
    return copied_files


def unconsolidate_localization_files(copied_files, dry_run=False):
    """
    Copy downloaded translations back to components and remove from app.

    After downloading translations from Locize, this function:
    1. Copies the updated files from app back to their original components location
    2. Removes the component files from app to maintain separation

    Args:
        copied_files: List of file paths that were copied during consolidation
        dry_run: If True, still perform filesystem cleanup but skip remote actions
    """
    console.print("\n[bold cyan]📤 Unconsolidating localization files...[/]")
    if dry_run:
        console.print(
            "[yellow]  [DRY RUN MODE - Unconsolidation still runs; Locize commands execute with --dry][/yellow]"
        )

    copied_set = set(copied_files)
    files_to_copy_back = []
    files_to_remove = []

    for lang in LANGUAGES:
        app_dir = APP_LOCALIZATION / lang
        components_dir = COMPONENTS_LOCALIZATION / lang

        if not app_dir.exists():
            continue

        for app_file in app_dir.glob("*.json"):
            if app_file in copied_set:
                components_file = components_dir / app_file.name
                files_to_copy_back.append((app_file, components_file))
                files_to_remove.append(app_file)

    if files_to_copy_back:
        table = Table(
            title="Files to copy back from app/ to components/",
            show_header=True,
            header_style="bold magenta",
            border_style="blue",
        )
        table.add_column("File", style="cyan")
        table.add_column("Language", style="blue")
        table.add_column("Source", style="green", overflow="fold")
        table.add_column("Destination", style="yellow", overflow="fold")

        for app_file, components_file in files_to_copy_back:
            lang = app_file.parent.name
            table.add_row(app_file.name, lang, str(app_file), str(components_file))

            components_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(app_file, components_file)

        console.print(table)

    if files_to_remove:
        table = Table(
            title="Files to remove from app/",
            show_header=True,
            header_style="bold magenta",
            border_style="red",
        )
        table.add_column("File", style="cyan")
        table.add_column("Language", style="blue")
        table.add_column("Path", style="red", overflow="fold")

        for app_file in files_to_remove:
            lang = app_file.parent.name
            table.add_row(app_file.name, lang, str(app_file))
            app_file.unlink()

        console.print(table)

    status = "were (dry run)" if dry_run else "were"
    console.print(
        f"\n[bold green]✓[/] Unconsolidation complete. {len(files_to_copy_back)} file(s) {status} copied back, "
        f"{len(files_to_remove)} file(s) {status} removed.\n"
    )


def _collect_localization_json_paths():
    files = []
    for directory in LOCALIZATION_JSON_DIRS:
        if not directory.exists():
            continue
        files.extend(sorted(directory.glob("*.json")))
    return files


def _relative_to_repo(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def run_repo_formatter(dry_run=False):
    """Run the equivalent of `make format-js` via npx prettier."""

    files_to_format = [
        _relative_to_repo(path) for path in _collect_localization_json_paths()
    ]

    console.print(
        "\n[bold cyan]🧽 Running repo formatter (make format-js equivalent)...[/]"
    )

    if not files_to_format:
        console.print("[dim]  No localization JSON files found to format.[/]\n")
        return

    command = [
        "npx",
        "-y",
        f"prettier@{PRETTIER_VERSION}",
        "--ignore-path",
        ".eslintignore",
        "--write",
        *files_to_format,
    ]

    console.print(Panel(" ".join(command), title="Command", border_style="blue"))

    if dry_run:
        console.print("[yellow]  [DRY RUN MODE - Command skipped][/]\n")
        return

    result = subprocess.run(command, cwd=REPO_ROOT)

    if result.returncode != 0:
        console.print("[bold red]✗ Error:[/] Prettier formatting failed")
        sys.exit(result.returncode)

    console.print("[bold green]✓ Repo formatting complete.[/]\n")


def push_local(api_key, project_id, dry_run=False):
    """
    Push local English and Chinese translations to Locize.

    Equivalent to:
        npx -y locize-cli@latest sync \\
            --api-key KEY \\
            --project-id ID \\
            -p ./app/src/assets/localization \\
            --language en,zh \\
            --update-values true \\
            --skip-delete false \\
            --ver latest

    This treats the local files as the source of truth. After syncing we still
    unconsolidate so the repo returns to its original components/app split.
    """
    console.print("\n[bold cyan]🚀 Pushing local translations to Locize...[/]")

    cmd = [
        "npx",
        "-y",
        "locize-cli@latest",
        "sync",
        "--api-key",
        api_key,
        "--project-id",
        project_id,
        "-p",
        str(APP_LOCALIZATION),
        "--language",
        "en",
        "--update-values",
        "true",
        "--skip-delete",
        "false",
        "--ver",
        "latest",
    ]

    if dry_run:
        console.print("[yellow]  [DRY RUN MODE - Using --dry flag][/]")
        cmd.append("--dry")
        cmd.append("true")

    console.print(Panel(" ".join(cmd), title="Command", border_style="blue"))

    if dry_run:
        console.print("[dim]Executing with --dry=true to preview changes...[/]\n")

    result = subprocess.run(cmd, cwd=REPO_ROOT)

    if result.returncode != 0:
        console.print("[bold red]✗ Error:[/] Failed to push translations to Locize")
        sys.exit(result.returncode)

    if dry_run:
        console.print(
            "[bold green]✓ Dry run complete - Locize sync executed with --dry (remote untouched).[/]\n"
        )
    else:
        console.print("[bold green]✓ Local translations pushed successfully.[/]\n")


def download_remote(api_key, project_id, dry_run=False):
    """
    Download English and Chinese translations from Locize.

    Equivalent to:
        npx -y locize-cli@latest download \\
            --api-key KEY \\
            --project-id ID \\
            --language en,zh \\
            --path ./app/src/assets/localization \\
            --ver latest

    """
    console.print("\n[bold cyan]⬇️  Downloading translations from Locize...[/]")

    cmd = [
        "npx",
        "-y",
        "locize-cli@latest",
        "download",
        "--api-key",
        api_key,
        "--project-id",
        project_id,
        "--language",
        ",".join(LANGUAGES),
        "--path",
        str(APP_LOCALIZATION),
        "--ver",
        "latest",
    ]

    if dry_run:
        console.print("[yellow]  [DRY RUN MODE - Using --dry flag][/]")
        cmd.append("--dry")
        cmd.append("true")

    console.print(Panel(" ".join(cmd), title="Command", border_style="blue"))

    if dry_run:
        console.print("[dim]Executing with --dry=true to preview changes...[/]\n")

    result = subprocess.run(cmd, cwd=REPO_ROOT)

    if result.returncode != 0:
        console.print(
            "[bold red]✗ Error:[/] Failed to download translations from Locize"
        )
        sys.exit(result.returncode)

    if dry_run:
        console.print(
            "[bold green]✓ Dry run complete - Locize download executed with --dry (remote untouched).[/]\n"
        )
    else:
        console.print("[bold green]✓ Translations downloaded successfully.[/]\n")


def main():
    parser = argparse.ArgumentParser(
        description="Sync localization files with Locize cloud service"
    )
    parser.add_argument(
        "action",
        choices=["push-local", "download-remote"],
        help="Action to perform",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making any changes",
    )

    args = parser.parse_args()

    if args.dry_run:
        console.print(
            Panel(
                "[bold yellow]Locize commands will run in dry mode; consolidation/unconsolidation still occur to validate the workflow.[/]",
                title="🔍 DRY RUN MODE",
                border_style="yellow",
            )
        )

    # Check environment variables
    api_key, project_id = check_environment()

    # Always consolidate files before any operation
    copied_files = consolidate_localization_files(args.dry_run)

    # Execute requested action
    if args.action == "push-local":
        push_local(api_key, project_id, args.dry_run)
    elif args.action == "download-remote":
        download_remote(api_key, project_id, args.dry_run)

    unconsolidate_localization_files(copied_files, args.dry_run)
    run_repo_formatter(args.dry_run)

    if args.dry_run:
        console.print(
            Panel(
                "[bold green]Remote changes were skipped (Locize --dry); local files were restored after consolidation.[/]",
                title="✅ DRY RUN COMPLETE",
                border_style="green",
            )
        )


if __name__ == "__main__":
    main()
