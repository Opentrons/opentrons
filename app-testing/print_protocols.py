# pipenv run python print_protocols.py
import argparse
import pathlib
import sys

import rich
from automation.data.protocols import Protocols
from rich.panel import Panel

parser = argparse.ArgumentParser()

parser.add_argument("-c", "--check", action="store_true", help="Check if all protocols are mapped.")

args = parser.parse_args()
check = args.check
stems = [p.stem for p in pathlib.Path(pathlib.Path.cwd(), "files", "protocols").rglob("*") if p.is_file()]
protocols = Protocols()
props = [prop for prop in dir(protocols) if "__" not in prop]

if not check:
    rich.print(Panel("For protocol_files.names"))
    rich.print(stems)
    rich.print(Panel("Formatted for .env"))
    rich.print(", ".join(stems))
    rich.print(Panel("What are actually defined?"))
    rich.print(", ".join(props))

possible = set(stems)
actual = set(props)
out = possible - actual
rich.print(Panel("Are all protocols mapped?"))
if len(out) == 0:
    rich.print("🥳 everything is mapped.")
    sys.exit(0)
else:
    rich.print("The below protocols need mapped:")
    rich.print(out)
    sys.exit(1)
