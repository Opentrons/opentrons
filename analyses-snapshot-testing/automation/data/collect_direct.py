import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# Directory configs
PROTOCOLS = Path(__file__).parent.parent.parent / "files" / "protocols"
PROTOCOL_LIBRARY_PROTOCOLS = PROTOCOLS / "protocol_library"
GENERATED_PROTOCOLS = PROTOCOLS / "generated_protocols"


@dataclass
class ProtocolAudit:
    stem: str
    filename: str
    ext: str
    version: Optional[str]
    expected: Optional[str]
    is_protocol_library: bool


def extract_version(filename: str) -> Optional[str]:
    match = re.search(r"_v(\d+\.\d+)_", filename)
    return match.group(1) if match else None


def extract_expected(filename: str) -> Optional[str]:
    # _s_ for success, _x_ for fail (case insensitive)
    lower_filename = filename.lower()
    if "_s_" in lower_filename:
        return "success"
    if "_x_" in lower_filename:
        return "fail"
    return None


def collect_protocols(dirs: List[Path]) -> List[ProtocolAudit]:
    audits = []
    seen = set()  # Track unique file paths
    for directory in dirs:
        for path in directory.rglob("*"):
            if path.suffix not in [".py", ".json"]:
                continue
            # Skip duplicates
            real_path = path.resolve()
            if real_path in seen:
                continue
            seen.add(real_path)
            # Ignore _overrides_ in main PROTOCOLS dir only
            if directory == PROTOCOLS and "_overrides_" in path.name.lower():
                continue
            is_lib = str(path).startswith(str(PROTOCOL_LIBRARY_PROTOCOLS))
            audits.append(
                ProtocolAudit(
                    stem=path.stem,
                    filename=path.name,
                    ext=path.suffix[1:],
                    version=extract_version(path.name),
                    expected=extract_expected(path.name),
                    is_protocol_library=is_lib,
                )
            )
    # Add all .py files from GENERATED_PROTOCOLS (no subdirs, just top level)
    if GENERATED_PROTOCOLS.exists():
        for path in GENERATED_PROTOCOLS.glob("*.py"):
            real_path = path.resolve()
            if real_path in seen:
                continue
            seen.add(real_path)
            audits.append(
                ProtocolAudit(
                    stem=path.stem,
                    filename=path.name,
                    ext=path.suffix[1:],
                    version=extract_version(path.name),
                    expected=extract_expected(path.name),
                    is_protocol_library=False,
                )
            )
    return audits


def main():
    console = Console()
    # Directories to search
    dirs = [PROTOCOLS, PROTOCOL_LIBRARY_PROTOCOLS]
    protocols = collect_protocols(dirs)
    total = len(protocols)
    py_count = sum(p.ext == "py" for p in protocols)
    json_count = sum(p.ext == "json" for p in protocols)

    success_count = sum(p.expected == "success" for p in protocols)
    fail_count = sum(p.expected == "fail" for p in protocols)

    py_success = sum(p.ext == "py" and p.expected == "success" for p in protocols)
    py_fail = sum(p.ext == "py" and p.expected == "fail" for p in protocols)
    json_success = sum(p.ext == "json" and p.expected == "success" for p in protocols)
    json_fail = sum(p.ext == "json" and p.expected == "fail" for p in protocols)

    library_count = sum(p.is_protocol_library for p in protocols)
    library_py = sum(p.is_protocol_library and p.ext == "py" for p in protocols)
    library_json = sum(p.is_protocol_library and p.ext == "json" for p in protocols)

    # Table for protocol types
    type_table = Table(title="Protocol Types", show_header=True, header_style="bold magenta")
    type_table.add_column("Type", style="dim")
    type_table.add_column("Count", justify="right")
    type_table.add_row("Total", str(total))
    type_table.add_row("Python", str(py_count))
    type_table.add_row("JSON", str(json_count))

    # Table for success/fail
    result_table = Table(title="Protocol Results", show_header=True, header_style="bold green")
    result_table.add_column("Result", style="dim")
    result_table.add_column("Total", justify="right")
    result_table.add_column("Python", justify="right")
    result_table.add_column("JSON", justify="right")
    result_table.add_row("Success", str(success_count), str(py_success), str(json_success))
    result_table.add_row("Fail", str(fail_count), str(py_fail), str(json_fail))

    # Table for protocol library
    lib_table = Table(title="Verified Protocol Library", show_header=True, header_style="bold cyan")
    lib_table.add_column("Type", style="dim")
    lib_table.add_column("Count", justify="right")
    lib_table.add_row("Total", str(library_count))
    lib_table.add_row("Python", str(library_py))
    lib_table.add_row("JSON", str(library_json))

    # Panel for generated protocols
    generated_paths = list(GENERATED_PROTOCOLS.glob("*.py")) if GENERATED_PROTOCOLS.exists() else []
    generated_count = len(generated_paths)
    generated_success = 0
    generated_fail = 0
    for path in generated_paths:
        expected = extract_expected(path.name)
        if expected == "success":
            generated_success += 1
        elif expected == "fail":
            generated_fail += 1
    generated_panel = Panel(
        f"[bold]Generated Protocols[/bold]\n"
        f"Total: [cyan]{generated_count}[/cyan]\n"
        f"Success: [green]{generated_success}[/green]\n"
        f"Fail: [red]{generated_fail}[/red]",
        title="[bold magenta]Generated Protocols Summary",
        border_style="magenta",
    )

    # Print all in panels
    console.print(Panel(type_table, title="[bold yellow]Protocol Type Summary", border_style="yellow"))
    console.print(Panel(result_table, title="[bold green]Protocol Result Summary", border_style="green"))
    console.print(Panel(lib_table, title="[bold cyan]Protocol Library Summary", border_style="cyan"))
    console.print(generated_panel)


if __name__ == "__main__":
    main()
