import ast
import keyword
import re
from pathlib import Path

from rich.console import Console
from rich.panel import Panel

from automation.data.collect_direct import (
    PROTOCOL_LIBRARY_PROTOCOLS,
    PROTOCOLS,
    collect_protocols,
)

PROTOCOLS_PY = Path(__file__).parent / "protocols.py"


def get_protocol_stems_from_files():
    # Only collect from PROTOCOLS and PROTOCOL_LIBRARY_PROTOCOLS, not generated
    audits = collect_protocols([PROTOCOLS, PROTOCOL_LIBRARY_PROTOCOLS])
    # Exclude generated and overrides
    stems = set()
    for audit in audits:
        # Exclude generated protocols and _overrides_ (already handled in collect_protocols)
        stems.add((audit.stem, audit.ext, audit.is_protocol_library))
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
    for _prop, stem, ext in found:
        stems.add((stem, ext, None))  # is_protocol_library not tracked in class
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


def add_missing_protocols_to_class_ast(missing):
    with open(PROTOCOLS_PY, "r") as f:
        lines = f.readlines()
    tree = ast.parse("".join(lines))

    class ProtocolsEditor(ast.NodeTransformer):
        def visit_ClassDef(self, node):
            if node.name == "Protocols":
                # Collect all existing assignments and new ones, then sort
                assignments = [stmt for stmt in node.body if isinstance(stmt, ast.AnnAssign)]
                # Remove all AnnAssign nodes (protocol entries)
                node.body = [stmt for stmt in node.body if not isinstance(stmt, ast.AnnAssign)]
                # Add new missing assignments
                for stem, ext in sorted(missing):
                    robot = "Flex" if stem.startswith("Flex") else "OT2"
                    prop_name = make_valid_identifier(stem)
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
                            ],
                        ),
                        simple=1,
                    )
                    assignments.append(assign)
                # Sort all assignments by property name
                assignments.sort(key=lambda a: a.target.id)
                node.body.extend(assignments)
            return node

    new_tree = ProtocolsEditor().visit(tree)
    ast.fix_missing_locations(new_tree)
    new_code = ast.unparse(new_tree)
    with open(PROTOCOLS_PY, "w") as f:
        f.write(new_code)


def main():
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
        if missing:
            add_missing_protocols_to_class_ast(missing)
            console.print(
                Panel(
                    (
                        f"[yellow]Added {len(missing)} missing protocols to Protocols class and "
                        "alphabetized all entries.[/yellow]"
                    ),
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
                console.print(
                    Panel("[green]Protocols registry matches protocol files after update![/green]", title="Audit Result (Post-Edit)")
                )
            else:
                console.print(
                    Panel(
                        f"[red]Still missing: {len(missing2)}, still extra: {len(extra2)} after update![/red]",
                        title="Audit Result (Post-Edit)",
                    )
                )
        if extra:
            console.print(
                Panel(
                    f"[red]{len(extra)} extra protocols in Protocols class (not in files). Manual cleanup may be needed.[/red]",
                    title="Extra Protocols",
                )
            )


if __name__ == "__main__":
    main()
