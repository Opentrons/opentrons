import argparse
import random
from pathlib import Path

from rich import print as rprint
from rich.panel import Panel
from rich.pretty import Pretty
from rich.table import Table

from automation.analyze import analyze_protocol_files

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", "-L", type=int, default=None, help="Limit to N random protocol files")
    args = parser.parse_args()

    # Example: analyze all .py and .json protocols in the protocols folder
    protocols_dir = Path(__file__).parent.parent / "files" / "protocols"
    protocol_files = [
        file
        for file in (list(protocols_dir.glob("*.py")) + list(protocols_dir.glob("*.json")))
        if "Overrides" not in file.name and "_X_" not in file.name
    ]

    ignored_files = {
        "Flex_S_v2_15_P1000_96_GRIP_HS_MB_TC_TM_IDTXgen96Part1to3.py",
        "Flex_S_v2_15_P1000_96_GRIP_HS_MB_TC_TM_IlluminaDNAPrep96PART3.py",
        "pl_sample_dilution_with_96_channel_pipette.py",
        "pl_langone_ribo_pt1_ramp.py",
    }
    protocol_files = [f for f in protocol_files if f.name not in ignored_files]

    if args.limit is not None and len(protocol_files) > args.limit:
        protocol_files = random.sample(protocol_files, args.limit)

    results = analyze_protocol_files(protocol_files)

    rprint("\nSummary of analysis results:")

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Protocol Name", style="bold blue")
    table.add_column("Status")
    table.add_column("Errors", style="yellow")

    for result in results:
        status = "[green]Success[/green]" if result.is_successful else "[red]Failed[/red]"
        errors = ""
        if not result.is_successful:
            error_list = result.analysis.get("errors", [])
            if isinstance(error_list, list):
                if error_list:
                    # Display each error dict as a pretty-printed string, joined together
                    error_renders = [Pretty(e, indent_guides=True) for e in error_list]
                    errors = "\n".join([str(e) for e in error_list])
                else:
                    errors = "No errors found"
            else:
                errors = str(Pretty(error_list, indent_guides=True))
        table.add_row(result.protocol_name, status, errors)

    rprint(Panel(table, title="Analysis Results", border_style="bright_blue"))
