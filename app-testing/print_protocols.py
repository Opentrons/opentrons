# pipenv run python print_protocols.py
import pathlib

import rich
from automation.data.protocols import Protocols
from rich.panel import Panel

stems = [p.stem for p in pathlib.Path(pathlib.Path.cwd(), "files", "protocols").rglob("*") if p.is_file()]
sorted_stems = sorted(stems)
rich.print(Panel("For protocol_files.names"))
rich.print(sorted_stems)
rich.print(Panel("Formatted for .env"))
rich.print(", ".join(sorted_stems))
rich.print(Panel("What are actually defined?"))
protocols = Protocols()
props = [prop for prop in dir(protocols) if "__" not in prop]
rich.print(", ".join(props))

possible = set(sorted_stems)
actual = set(props)
out = possible - actual
rich.print(Panel("Are all protocols mapped?"))
if len(out) == 0:
    rich.print("🥳 everything is mapped.")
else:
    rich.print("The below protocols need mapped:")
    rich.print(out)
