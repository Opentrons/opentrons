#!/usr/bin/env python3
"""
Protocol Analysis CLI Tool

A reusable command-line tool for analyzing Opentrons protocols and generating snapshots.
This tool can analyze protocol files from a specified directory, resolve custom labware
dependencies, and generate analysis snapshot files.

Usage:
    protocol-analyze --interactive
    protocol-analyze --protocols-dir /path/to/protocols --output-dir /path/to/output

Features:
    - Interactive mode with menu-driven directory selection
    - Analyzes both Python (.py) and JSON (.json) protocol files
    - Resolves custom labware dependencies
    - Generates analysis snapshots with traceable naming
    - Validates analysis results before saving
    - Supports dry-run mode
    - Provides summary statistics
"""

import argparse
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, Progress, TextColumn, TimeElapsedColumn
from rich.table import Table

from automation.analyze import AnalysisResult, run_analysis
from automation.data.protocol import Protocol
from automation.protocol_utils import (
    discover_protocol_files_in_directory,
    generate_analysis_summary,
    save_analysis_snapshot,
    validate_protocol_file,
)

console = Console()


class ProtocolAnalysisCLI:
    """Main CLI class for protocol analysis functionality."""

    def __init__(
        self,
        protocols_dir: Path,
        labware_dir: Optional[Path] = None,
        output_dir: Optional[Path] = None,
        dry_run: bool = False,
        interactive: bool = False,
    ):
        self.protocols_dir = protocols_dir
        self.labware_dir = labware_dir
        self.output_dir = output_dir or Path.cwd() / "analysis_results"
        self.dry_run = dry_run
        self.interactive = interactive
        self.custom_labware_files: List[Path] = []

        if self.labware_dir and self.labware_dir.exists():
            self.custom_labware_files = list(self.labware_dir.glob("*.json"))

    @staticmethod
    def scan_directories_for_protocols(base_dir: Path = None) -> List[Path]:
        """
        Scan for directories containing protocol files (.py or .json).

        Args:
            base_dir: Directory to scan (defaults to current working directory)

        Returns:
            List of directory paths containing protocol files
        """
        if base_dir is None:
            base_dir = Path.cwd()

        protocol_dirs = []

        with Progress(
            "[progress.description]{task.description}",
            BarColumn(),
            "[progress.percentage]{task.percentage:>3.0f}%",
            transient=True,
            console=console,
        ) as progress:
            # Get all subdirectories, including nested ones up to 2 levels deep
            all_dirs = [base_dir]

            # Add direct subdirectories
            direct_subdirs = [d for d in base_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
            all_dirs.extend(direct_subdirs)

            # Add nested subdirectories (one level deeper)
            for subdir in direct_subdirs:
                try:
                    nested_dirs = [d for d in subdir.iterdir() if d.is_dir() and not d.name.startswith(".")]
                    all_dirs.extend(nested_dirs)
                except (PermissionError, OSError):
                    pass

            task = progress.add_task("Scanning for protocols...", total=len(all_dirs))

            for dir_path in all_dirs:
                try:
                    # Check if directory contains protocol files
                    protocol_files = list(dir_path.glob("*.py")) + list(dir_path.glob("*.json"))
                    # Filter to actual protocol files (basic validation)
                    valid_protocols = [f for f in protocol_files if validate_protocol_file(f)]

                    if valid_protocols:
                        protocol_dirs.append(dir_path)

                except (PermissionError, OSError):
                    # Skip directories we can't access
                    pass

                progress.update(task, advance=1)

        return sorted(protocol_dirs)

    @staticmethod
    def scan_directories_for_labware(base_dir: Path = None) -> List[Path]:
        """
        Scan for directories containing labware definition files (.json).

        Args:
            base_dir: Directory to scan (defaults to current working directory)

        Returns:
            List of directory paths containing labware files
        """
        if base_dir is None:
            base_dir = Path.cwd()

        labware_dirs = []

        with Progress(
            "[progress.description]{task.description}",
            BarColumn(),
            "[progress.percentage]{task.percentage:>3.0f}%",
            transient=True,
            console=console,
        ) as progress:
            # Get all subdirectories, including nested ones up to 2 levels deep
            all_dirs = [base_dir]

            # Add direct subdirectories
            direct_subdirs = [d for d in base_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
            all_dirs.extend(direct_subdirs)

            # Add nested subdirectories (one level deeper)
            for subdir in direct_subdirs:
                try:
                    nested_dirs = [d for d in subdir.iterdir() if d.is_dir() and not d.name.startswith(".")]
                    all_dirs.extend(nested_dirs)
                except (PermissionError, OSError):
                    pass

            task = progress.add_task("Scanning for labware...", total=len(all_dirs))

            for dir_path in all_dirs:
                try:
                    # Check if directory contains labware JSON files
                    json_files = list(dir_path.glob("*.json"))
                    # Simple heuristic: if it has JSON files and appears to be labware
                    if json_files and ("labware" in str(dir_path).lower() or len(json_files) > 5):
                        labware_dirs.append(dir_path)

                except (PermissionError, OSError):
                    # Skip directories we can't access
                    pass

                progress.update(task, advance=1)

        return sorted(labware_dirs)

    def interactive_directory_selection(self) -> Tuple[Path, Optional[Path]]:  # noqa: C901
        """
        Interactive menu for selecting protocol and labware directories.

        Returns:
            Tuple of (protocol_dir, labware_dir)
        """
        console.print(
            Panel.fit(
                "[bold blue]Protocol Analysis Tool - Interactive Mode[/bold blue]\nSelect directories for protocol analysis",
                title="Welcome",
            )
        )

        # Select protocol directory
        console.print("\n[bold cyan]Step 1: Select Protocol Directory[/bold cyan]")
        protocol_dirs = self.scan_directories_for_protocols()

        if not protocol_dirs:
            console.print("[red]No directories with protocol files found in current directory.[/red]")
            manual_path = input("Enter protocol directory path manually: ").strip()
            if manual_path:
                protocol_dir = Path(manual_path)
                if not protocol_dir.exists():
                    console.print(f"[red]Directory does not exist: {protocol_dir}[/red]")
                    sys.exit(1)
            else:
                console.print("[red]No protocol directory specified.[/red]")
                sys.exit(1)
        else:
            # Show protocol directory options
            table = Table(title="Available Protocol Directories")
            table.add_column("Option", style="cyan", width=8)
            table.add_column("Directory", style="magenta")
            table.add_column("Protocol Count", style="green", justify="right")

            for i, dir_path in enumerate(protocol_dirs, 1):
                protocol_count = len(discover_protocol_files_in_directory(dir_path))
                table.add_row(str(i), str(dir_path.relative_to(Path.cwd())), str(protocol_count))

            console.print(table)

            while True:
                try:
                    choice = input(f"\nSelect protocol directory (1-{len(protocol_dirs)}) or enter custom path: ").strip()

                    if choice.isdigit():
                        index = int(choice) - 1
                        if 0 <= index < len(protocol_dirs):
                            protocol_dir = protocol_dirs[index]
                            break
                        else:
                            console.print(f"[red]Please enter a number between 1 and {len(protocol_dirs)}[/red]")
                    else:
                        # Custom path
                        protocol_dir = Path(choice)
                        if protocol_dir.exists():
                            break
                        else:
                            console.print(f"[red]Directory does not exist: {protocol_dir}[/red]")

                except (ValueError, KeyboardInterrupt):
                    console.print("[red]Invalid selection[/red]")

        # Select labware directory
        console.print("\n[bold cyan]Step 2: Select Labware Directory (Optional)[/bold cyan]")
        labware_dirs = self.scan_directories_for_labware()

        labware_dir = None
        if labware_dirs:
            # Show labware directory options
            table = Table(title="Available Labware Directories")
            table.add_column("Option", style="cyan", width=8)
            table.add_column("Directory", style="magenta")
            table.add_column("JSON Files", style="green", justify="right")

            table.add_row("0", "[italic]Skip labware directory[/italic]", "-")
            for i, dir_path in enumerate(labware_dirs, 1):
                json_count = len(list(dir_path.glob("*.json")))
                table.add_row(str(i), str(dir_path.relative_to(Path.cwd())), str(json_count))

            console.print(table)

            while True:
                try:
                    choice = input(f"\nSelect labware directory (0-{len(labware_dirs)}) or enter custom path: ").strip()

                    if choice.isdigit():
                        index = int(choice)
                        if index == 0:
                            labware_dir = None
                            break
                        elif 1 <= index <= len(labware_dirs):
                            labware_dir = labware_dirs[index - 1]
                            break
                        else:
                            console.print(f"[red]Please enter a number between 0 and {len(labware_dirs)}[/red]")
                    else:
                        # Custom path
                        labware_dir = Path(choice)
                        if labware_dir.exists():
                            break
                        else:
                            console.print(f"[red]Directory does not exist: {labware_dir}[/red]")

                except (ValueError, KeyboardInterrupt):
                    console.print("[red]Invalid selection[/red]")
        else:
            console.print("[yellow]No directories with JSON files found. Skipping labware selection.[/yellow]")

        # Show confirmation
        self.show_analysis_confirmation(protocol_dir, labware_dir)

        return protocol_dir, labware_dir

    def show_analysis_confirmation(self, protocol_dir: Path, labware_dir: Optional[Path]):
        """
        Show confirmation screen before running analysis.

        Args:
            protocol_dir: Selected protocol directory
            labware_dir: Selected labware directory (optional)
        """
        console.print("\n" + "=" * 60)
        console.print(
            Panel.fit(
                f"[bold green]Analysis Configuration[/bold green]\n\n"
                f"[cyan]Protocol Directory:[/cyan] {protocol_dir}\n"
                f"[cyan]Labware Directory:[/cyan] {labware_dir or '[italic]None[/italic]'}\n"
                f"[cyan]Output Directory:[/cyan] {self.output_dir}\n"
                f"[cyan]Dry Run:[/cyan] {self.dry_run}",
                title="Confirmation",
            )
        )

        # Count protocols
        protocol_files = discover_protocol_files_in_directory(protocol_dir)
        valid_protocols = [f for f in protocol_files if validate_protocol_file(f)]

        console.print(f"\n[green]Found {len(protocol_files)} protocol files ({len(valid_protocols)} valid)[/green]")

        try:
            proceed = input("\nProceed with analysis? (y/N): ").strip().lower()
            if proceed not in ["y", "yes"]:
                console.print("[yellow]Analysis cancelled by user.[/yellow]")
                sys.exit(0)
        except KeyboardInterrupt:
            console.print("\n[yellow]Analysis cancelled by user.[/yellow]")
            sys.exit(0)

    def discover_protocol_files(self) -> List[Path]:
        """
        Discover all protocol files in the protocols directory.

        Returns:
            List of protocol file paths (.py and .json files).
        """
        return discover_protocol_files_in_directory(self.protocols_dir)

    def generate_output_filename(self, protocol_file: Path) -> str:
        """
        Generate a traceable output filename for the analysis result.

        Args:
            protocol_file: Path to the original protocol file.

        Returns:
            Generated filename for the analysis output.
        """
        return f"{protocol_file.stem}_analysis.json"

    def create_protocol_object(self, file_path: Path) -> Protocol:
        """
        Create a Protocol object from a file path.

        Args:
            file_path: Path to the protocol file.

        Returns:
            Protocol object.
        """
        return Protocol(
            file_stem=file_path.stem,
            folder=file_path.parent,
            file_extension=file_path.suffix[1:],  # Remove the dot
            robot="Flex",
        )

    async def analyze_single_protocol(self, protocol_file: Path) -> AnalysisResult:
        """
        Analyze a single protocol file.

        Args:
            protocol_file: Path to the protocol file to analyze.

        Returns:
            AnalysisResult object containing the analysis results.
        """
        return await run_analysis(protocol_file)

    def save_analysis_result(self, result: AnalysisResult) -> Path:
        """
        Save analysis result to a file.

        Args:
            result: AnalysisResult object to save.

        Returns:
            Path to the saved file.
        """
        return save_analysis_snapshot(result, self.output_dir)

    def print_summary(self, results: List[AnalysisResult], saved_files: List[Path]):
        """
        Print a summary of the analysis results.

        Args:
            results: List of analysis results.
            saved_files: List of paths to saved analysis files.
        """
        summary = generate_analysis_summary(results)

        # Create summary table
        table = Table(title="Analysis Summary")
        table.add_column("Metric", style="cyan")
        table.add_column("Count", style="magenta", justify="right")

        table.add_row("Total Protocols", str(summary["total_protocols"]))
        table.add_row("Successful Analyses", str(summary["successful_analyses"]))
        table.add_row("Failed Analyses", str(summary["failed_analyses"]))
        table.add_row("Success Rate", f"{summary['success_rate']:.1f}%")
        table.add_row("Files Saved", str(len(saved_files)))

        console.print(table)

        # Show failed analyses if any
        if summary["failed_analyses"] > 0:
            console.print("\n[red]Failed Analyses:[/red]")
            for protocol_name in summary["failed_protocols"]:
                console.print(f"  • {protocol_name}")

    def run_dry_run(self, protocol_files: List[Path]):
        """
        Execute dry-run mode, showing what would be processed without actually analyzing.

        Args:
            protocol_files: List of protocol files that would be processed.
        """
        console.print(Panel("DRY RUN MODE - No analysis will be performed", style="yellow"))

        table = Table(title="Files to be Processed")
        table.add_column("File", style="cyan")
        table.add_column("Output", style="magenta")
        table.add_column("Valid", style="green")

        for file_path in protocol_files:
            output_name = self.generate_output_filename(file_path)
            is_valid = validate_protocol_file(file_path)
            table.add_row(
                str(file_path.relative_to(self.protocols_dir)),
                output_name,
                "✓" if is_valid else "⚠",
            )

        console.print(table)
        console.print(f"\nWould process {len(protocol_files)} files")
        console.print(f"Output directory: {self.output_dir}")

    async def run_analysis(self) -> Dict[str, Any]:
        """
        Run the full analysis pipeline.

        Returns:
            Dictionary containing summary information about the analysis run.
        """
        # Discover protocol files
        protocol_files = self.discover_protocol_files()

        if not protocol_files:
            console.print("[red]No protocol files found in the specified directory.[/red]")
            return {"total_files": 0, "processed": 0, "successful": 0, "failed": 0}

        console.print(f"Found {len(protocol_files)} protocol files")

        # Filter valid protocol files
        valid_files = [f for f in protocol_files if validate_protocol_file(f)]
        invalid_count = len(protocol_files) - len(valid_files)

        if invalid_count > 0:
            console.print(f"[yellow]Skipping {invalid_count} files that don't appear to be valid protocols[/yellow]")

        if not valid_files:
            console.print("[red]No valid protocol files found.[/red]")
            return {
                "total_files": len(protocol_files),
                "processed": 0,
                "successful": 0,
                "failed": 0,
            }

        # Run dry-run if requested
        if self.dry_run:
            self.run_dry_run(valid_files)
            return {
                "total_files": len(protocol_files),
                "processed": 0,
                "successful": 0,
                "failed": 0,
            }

        # Run actual analysis
        results = []
        saved_files = []

        with Progress(
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            "[progress.percentage]{task.percentage:>3.0f}%",
            "|",
            "[cyan]{task.completed}/{task.total}",
            TimeElapsedColumn(),
            transient=True,
        ) as progress:
            task_id = progress.add_task("Analyzing protocols", total=len(valid_files))

            for protocol_file in valid_files:
                try:
                    # Analyze the protocol
                    result = await self.analyze_single_protocol(protocol_file)
                    results.append(result)

                    # Save all analyses (both successful and failed)
                    saved_path = self.save_analysis_result(result)
                    saved_files.append(saved_path)

                except Exception as e:
                    console.print(f"[red]Error analyzing {protocol_file.name}: {e}[/red]")
                    # Create a failed result for summary purposes and save it
                    failed_result = AnalysisResult(
                        protocol_file=protocol_file,
                        analysis={"error": str(e), "errors": [str(e)]},
                        logs="",
                    )
                    results.append(failed_result)

                    # Save the failed analysis too
                    saved_path = self.save_analysis_result(failed_result)
                    saved_files.append(saved_path)

                progress.update(task_id, advance=1)

        # Print summary
        self.print_summary(results, saved_files)

        successful_count = sum(1 for r in results if r.is_successful)
        failed_count = len(results) - successful_count

        return {
            "total_files": len(protocol_files),
            "processed": len(results),
            "successful": successful_count,
            "failed": failed_count,
            "saved_files": len(saved_files),
        }


def main():  # noqa: C901
    """Main entry point for the CLI tool."""
    parser = argparse.ArgumentParser(
        description="Analyze Opentrons protocols and generate analysis snapshots",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --interactive
  %(prog)s --protocols-dir ./protocols --output-dir ./results
  %(prog)s --protocols-dir ./protocols --labware-dir ./labware --dry-run
  %(prog)s --protocols-dir /path/to/protocols --labware-dir /path/to/labware
        """,
    )

    # Interactive mode flag
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Run in interactive mode with menu-driven directory selection",
    )

    parser.add_argument(
        "--protocols-dir",
        type=Path,
        help="Directory containing protocol files to analyze (required if not using --interactive)",
    )

    parser.add_argument(
        "--labware-dir",
        type=Path,
        help="Directory containing custom labware definitions (optional)",
    )

    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Directory to save analysis results (default: ./analysis_results)",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be processed without running analysis",
    )

    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")

    args = parser.parse_args()

    # Handle interactive mode
    if args.interactive:
        # Create CLI instance for interactive mode
        cli = ProtocolAnalysisCLI(
            protocols_dir=Path("."),  # Placeholder, will be set by interactive selection
            labware_dir=args.labware_dir,
            output_dir=args.output_dir,
            dry_run=args.dry_run,
            interactive=True,
        )

        # Get directories through interactive selection
        protocols_dir, labware_dir = cli.interactive_directory_selection()

        # Update CLI instance with selected directories
        cli.protocols_dir = protocols_dir
        cli.labware_dir = labware_dir
        if cli.labware_dir and cli.labware_dir.exists():
            cli.custom_labware_files = list(cli.labware_dir.glob("*.json"))

    else:
        # Non-interactive mode - require protocols-dir
        if not args.protocols_dir:
            console.print("[red]Error: --protocols-dir is required when not using --interactive mode[/red]")
            parser.print_help()
            sys.exit(1)

        # Validate input arguments
        if not args.protocols_dir.exists():
            console.print(f"[red]Error: Protocols directory does not exist: {args.protocols_dir}[/red]")
            sys.exit(1)

        if args.labware_dir and not args.labware_dir.exists():
            console.print(f"[red]Error: Labware directory does not exist: {args.labware_dir}[/red]")
            sys.exit(1)

        # Create CLI tool for non-interactive mode
        cli = ProtocolAnalysisCLI(
            protocols_dir=args.protocols_dir,
            labware_dir=args.labware_dir,
            output_dir=args.output_dir,
            dry_run=args.dry_run,
            interactive=False,
        )

    try:
        import asyncio

        summary = asyncio.run(cli.run_analysis())

        if not args.dry_run:
            if summary["failed"] > 0:
                console.print(f"\n[yellow]Analysis completed with {summary['failed']} failures[/yellow]")
                console.print(f"\n[bold cyan]Analysis results saved to:[/bold cyan] {cli.output_dir.absolute()}")
                sys.exit(1)
            else:
                console.print("\n[green]Analysis completed successfully![/green]")
                console.print(f"Processed {summary['successful']} protocols, saved {summary['saved_files']} analysis files")
                console.print(f"\n[bold cyan]Analysis results saved to:[/bold cyan] {cli.output_dir.absolute()}")
        else:
            console.print(f"\n[bold cyan]Dry run complete. Results would be saved to:[/bold cyan] {cli.output_dir.absolute()}")

    except KeyboardInterrupt:
        console.print("\n[yellow]Analysis interrupted by user[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[red]Error: {e}[/red]")
        if args.verbose:
            import traceback

            console.print(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
