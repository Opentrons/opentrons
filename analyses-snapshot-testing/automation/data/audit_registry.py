import ast
import keyword
import re
import subprocess
from pathlib import Path

from rich.console import Console
from rich.panel import Panel

from automation.data.collect_direct import (
    collect_protocols,
)
from automation.data.protocol import (
    MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOL_DESIGNER_PROTOCOLS_FOLDER,
    PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOLS_FOLDER,
)

PROTOCOLS_PY = Path(__file__).parent / "protocols.py"
SNAPSHOT_DIR = Path(__file__).parent.parent.parent / "tests" / "__snapshots__" / "analyses_snapshot_test"


def get_protocol_stems_from_files():
    # This does not audit automation/data/protocols_with_overrides.py
    audits = collect_protocols(
        [PROTOCOL_LIBRARY_PROTOCOLS_FOLDER, PROTOCOLS_FOLDER, MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER, PROTOCOL_DESIGNER_PROTOCOLS_FOLDER]
    )
    stems = set()
    for audit in audits:
        # Exclude generated protocols and _overrides_ (already handled in collect_protocols)
        stems.add((audit.stem, audit.ext, audit.folder))
    return stems


def get_protocol_stems_from_class():
    # Parse the Protocols class in protocols.py
    with open(PROTOCOLS_PY, "r") as f:
        content = f.read()
    # Find all Protocol(...) entries
    pattern = re.compile(r'(\w+): Protocol = Protocol\(\s*file_stem="([\w\d_]+)",\s*file_extension="(py|json)"', re.MULTILINE)
    found = pattern.findall(content)
    # (property_name, file_stem, ext)
    stems = set()
    for stem, ext, folder in found:
        stems.add((stem, ext, folder))
    return stems


def get_protocol_stems_from_class_ast():  # noqa: C901
    with open(PROTOCOLS_PY, "r") as f:
        tree = ast.parse(f.read())

    class ProtocolsVisitor(ast.NodeVisitor):
        def __init__(self):
            self.protocols = set()

        def visit_ClassDef(self, node):
            if node.name == "Protocols":
                for stmt in node.body:
                    if isinstance(stmt, ast.AnnAssign) and isinstance(stmt.value, ast.Call):
                        call = stmt.value
                        if isinstance(call.func, ast.Name) and call.func.id == "Protocol":
                            file_stem = None
                            file_extension = None
                            for kw in call.keywords:
                                if kw.arg == "file_stem":
                                    file_stem = kw.value.value if isinstance(kw.value, ast.Constant) else kw.value.s
                                if kw.arg == "file_extension":
                                    file_extension = kw.value.value if isinstance(kw.value, ast.Constant) else kw.value.s
                            if file_stem and file_extension:
                                self.protocols.add((file_stem, file_extension, None))

    visitor = ProtocolsVisitor()
    visitor.visit(tree)
    return visitor.protocols


def make_valid_identifier(stem):
    # Replace invalid characters with underscores
    ident = re.sub(r"[^0-9a-zA-Z_]", "_", stem)
    # If it starts with a digit, prefix with 'p_'
    if re.match(r"^\d", ident):
        ident = f"p_{ident}"
    # If it's a Python keyword, prefix with '_'
    if keyword.iskeyword(ident):
        ident = f"_{ident}"
    return ident


def add_missing_protocols_to_class_ast(missing, file_stem_set):  # noqa: C901
    def get_folder_value(prop_name, ext):
        if "_MPL_" in prop_name:
            return ast.Name(id="MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER", ctx=ast.Load())
        elif "_PL_" in prop_name:
            return ast.Name(id="PROTOCOL_LIBRARY_PROTOCOLS_FOLDER", ctx=ast.Load())
        elif ext == "json":
            return ast.Name(id="PROTOCOL_DESIGNER_PROTOCOLS_FOLDER", ctx=ast.Load())
        else:
            return ast.Name(id="PROTOCOLS_FOLDER", ctx=ast.Load())

    def is_valid_protocol_assign(stmt, file_stem_set):
        if not (isinstance(stmt, ast.AnnAssign) and isinstance(stmt.value, ast.Call)):
            return False
        call = stmt.value
        file_stem = None
        file_extension = None
        for kw in call.keywords:
            if kw.arg == "file_stem":
                file_stem = kw.value.value if isinstance(kw.value, ast.Constant) else kw.value.s
            if kw.arg == "file_extension":
                file_extension = kw.value.value if isinstance(kw.value, ast.Constant) else kw.value.s
        return (file_stem, file_extension) in file_stem_set

    class ProtocolsEditor(ast.NodeTransformer):
        def __init__(self):
            self.added_names = []

        def visit_ClassDef(self, node):
            if node.name != "Protocols":
                return node
            # Only keep AnnAssign nodes that are in file_stem_set
            new_assignments = [stmt for stmt in node.body if is_valid_protocol_assign(stmt, file_stem_set)]
            # Add new missing assignments
            for stem, ext in sorted(missing):
                robot = "Flex"
                prop_name = make_valid_identifier(stem)
                folder_value = get_folder_value(prop_name, ext)
                assign = ast.AnnAssign(
                    target=ast.Name(id=prop_name, ctx=ast.Store()),
                    annotation=ast.Name(id="Protocol", ctx=ast.Load()),
                    value=ast.Call(
                        func=ast.Name(id="Protocol", ctx=ast.Load()),
                        args=[],
                        keywords=[
                            ast.keyword(arg="file_stem", value=ast.Constant(stem)),
                            ast.keyword(arg="file_extension", value=ast.Constant(ext)),
                            ast.keyword(arg="robot", value=ast.Constant(robot)),
                            ast.keyword(arg="folder", value=folder_value),
                        ],
                    ),
                    simple=1,
                )
                new_assignments.append(assign)
                self.added_names.append(prop_name)
            # Sort all assignments by property name
            new_assignments.sort(key=lambda a: a.target.id)
            # Remove all AnnAssign nodes (protocol entries)
            node.body = [stmt for stmt in node.body if not isinstance(stmt, ast.AnnAssign)]
            node.body.extend(new_assignments)
            return node

    with open(PROTOCOLS_PY, "r") as f:
        lines = f.readlines()
    tree = ast.parse("".join(lines))
    editor = ProtocolsEditor()
    new_tree = editor.visit(tree)
    ast.fix_missing_locations(new_tree)
    new_code = ast.unparse(new_tree)
    with open(PROTOCOLS_PY, "w") as f:
        f.write(new_code)
    return editor.added_names


def extract_stem_from_snapshot(filename):
    # Example: test_analysis_snapshot[0160301f8a][Flex_S_v2_24_96_HappyPath_Overrides_transfer_liquid_Override_200_filter].json
    match = re.match(r"test_analysis_snapshot\[[^\]]+\]\[([^\]]+)\]\\.json", filename)
    if not match:
        match = re.match(r"test_analysis_snapshot\[[^\]]+\]\[([^\]]+)\]\.json", filename)
    return match.group(1) if match else None


def audit_snapshots_against_registry(console, file_stem_set):
    snapshot_files = list(SNAPSHOT_DIR.glob("*.json"))
    # remove overrides
    snapshot_files = [f for f in snapshot_files if "_Overrides_" not in f.name]
    console.print(
        Panel(
            f"Found [info]{len(snapshot_files)}[/] snapshot files in [path]{SNAPSHOT_DIR}[/]",
            title="Snapshot Files",
            expand=False,
        )
    )
    snapshot_stems = set()
    file_by_stem = {}
    for f in snapshot_files:
        stem = extract_stem_from_snapshot(f.name)
        if stem:
            snapshot_stems.add(stem)
            file_by_stem[stem] = f
    registered_stems = {stem for (stem, _) in file_stem_set}
    missing_snapshots = registered_stems - snapshot_stems
    extra_snapshots = snapshot_stems - registered_stems

    summary = (
        f"[bold]Registered protocols:[/bold] {len(registered_stems)} | "
        f"[bold]Snapshots:[/bold] {len(snapshot_stems)} | "
        f"[bold]Missing Snapshots:[/bold] {len(missing_snapshots)} | "
        f"[bold]Extra Snapshots:[/bold] {len(extra_snapshots)}"
    )
    console.print(Panel(summary, title="Snapshot Audit", expand=False))

    if missing_snapshots:
        console.print(Panel("\n".join(sorted(missing_snapshots)), title="[red]Missing Snapshots[/red]"))
    if extra_snapshots:
        console.print(Panel("\n".join(sorted(extra_snapshots)), title="[yellow]Extra Snapshots (will be deleted)[/yellow]"))
        # Delete extra snapshot files
        for stem in extra_snapshots:
            f = file_by_stem.get(stem)
            if f and f.exists():
                f.unlink()
                console.print(f"[yellow]Deleted extra snapshot:[/yellow] {f}")
    if not missing_snapshots and not extra_snapshots:
        console.print(
            Panel(
                "[green]All registered protocols have matching snapshots. No extra snapshots found![/green]", title="Snapshot Audit Result"
            )
        )


def main():  # noqa: C901
    console = Console()
    file_stems = get_protocol_stems_from_files()
    class_stems = get_protocol_stems_from_class_ast()

    file_stem_set = {(stem, ext) for (stem, ext, _) in file_stems}
    class_stem_set = {(stem, ext) for (stem, ext, _) in class_stems}

    missing = file_stem_set - class_stem_set
    extra = class_stem_set - file_stem_set

    summary = f"[bold]Protocols in files:[/bold] {len(file_stem_set)} | [bold]Protocols in class:[/bold] {len(class_stem_set)} | [bold]Missing:[/bold] {len(missing)} | [bold]Extra:[/bold] {len(extra)}"  # noqa: E501
    console.print(Panel(summary, title="Protocol Registry Audit", expand=False))

    if not missing and not extra:
        console.print(Panel("[green]Protocols registry matches protocol files. No changes needed![/green]", title="Audit Result"))
    else:
        added_command = None
        added_names_for_command = []
        if missing or extra:
            added_names = add_missing_protocols_to_class_ast(missing, file_stem_set)
            if added_names:
                added_command = f"make snapshot-test-update PROTOCOL_NAMES={','.join(added_names)} OVERRIDE_PROTOCOL_NAMES=none"
                added_names_for_command = added_names
            console.print(
                Panel(
                    f"[yellow]Added {len(missing)} missing protocols and removed {len(extra)} extra protocols. "
                    f"Alphabetized all entries.[/yellow]",
                    title="Protocols Updated",
                )
            )
            # Re-run audit after writing
            file_stems2 = get_protocol_stems_from_files()
            class_stems2 = get_protocol_stems_from_class_ast()
            file_stem_set2 = {(stem, ext) for (stem, ext, _) in file_stems2}
            class_stem_set2 = {(stem, ext) for (stem, ext, _) in class_stems2}
            missing2 = file_stem_set2 - class_stem_set2
            extra2 = class_stem_set2 - file_stem_set2
            if not missing2 and not extra2:
                msg = "[green]Protocols registry matches protocol files after update!"
                if extra:
                    msg += " All extra protocols have been deleted."
                msg += "[/green]"
                console.print(Panel(msg, title="Audit Result (Post-Edit)"))
            else:
                console.print(
                    Panel(
                        f"[red]Still missing: {len(missing2)}, still extra: {len(extra2)} after update![/red]",
                        title="Audit Result (Post-Edit)",
                    )
                )
    # --- Snapshot audit ---
    audit_snapshots_against_registry(console, file_stem_set)

    # --- Final manual action (moved to end for better copy/paste; plain output, no panel) ---
    try:
        if "added_command" in locals() and added_command:
            plain_command = added_command
            console.print("\n=== Snapshot Update Command ===")
            console.print("Run this to generate/update snapshots for newly added protocols:")
            # Print raw command alone on its own line for single-click copy
            console.print(f"\n{plain_command}\n")
            console.print("Protocols added (in order used above):")
            for n in added_names_for_command:
                console.print(f" - {n}")
            # Automatically execute the command and capture output
            console.print("\n=== Executing Snapshot Update Command (auto) ===")
            root_dir = Path(__file__).resolve().parents[2]  # analyses-snapshot-testing root
            try:
                result = subprocess.run(
                    plain_command,
                    shell=True,
                    cwd=root_dir,
                    capture_output=True,
                    text=True,
                )
                console.print(f"Return code: {result.returncode}")
                if result.stdout:
                    console.print("\n--- STDOUT ---")
                    console.print(result.stdout.rstrip())
                if result.stderr:
                    console.print("\n--- STDERR ---")
                    console.print(result.stderr.rstrip())
                if result.returncode == 0:
                    console.print("\n[green]Snapshot update command completed successfully.[/green]")
                else:
                    console.print("\n[red]Snapshot update command failed.[/red]")
            except FileNotFoundError:
                console.print("[red]Failed to execute snapshot update command: make not found[/red]")
            console.print("\n(End of command output)\n")
    except Exception:  # pragma: no cover - defensive, shouldn't fail the audit
        pass


if __name__ == "__main__":
    main()
