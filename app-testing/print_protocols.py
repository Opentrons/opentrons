# pipenv run python print_protocols.py
import pathlib

import rich
from automation.data.protocols import Protocols
from rich.panel import Panel

stems = [p.stem for p in pathlib.Path(pathlib.Path.cwd(), "files", "protocols").rglob("*") if p.is_file()]
rich.print(Panel("For protocol_files.names"))
rich.print(stems)
rich.print(Panel("Formatted for .env"))
rich.print(", ".join(stems))
rich.print(Panel("What are actually defined?"))
protocols = Protocols()
props = [prop for prop in dir(protocols) if "__" not in prop]
rich.print(",\n".join(props))

possible = set(stems)
actual = set(props)
missing_protocols = possible - actual
orphan_protocols = actual - possible
rich.print(Panel("Are all protocols mapped?"))
if len(missing_protocols) == 0 and len(orphan_protocols) == 0:
    rich.print("🥳 everything is mapped.")
else:
    rich.print("The below protocols need to be mapped in protocols.py:")
    rich.print(missing_protocols)
    rich.print("\nThe below protocols are mapped in protocols.py, but don't exist in the protocols dir:")
    rich.print(orphan_protocols)
