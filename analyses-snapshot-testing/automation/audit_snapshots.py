import json
from dataclasses import dataclass
from pathlib import Path
from typing import List

from rich.console import Console
from rich.markup import escape
from rich.panel import Panel
from rich.theme import Theme


@dataclass
class AuditResult:
    files_with_unexpected_errors: List[Path]
    files_missing_expected_errors: List[Path]


def audit_snapshots() -> AuditResult:  # noqa: C901
    theme = Theme({"error": "bold red", "success": "bold green", "info": "bold blue", "path": "yellow"})
    console = Console(theme=theme)

    project_root = Path(__file__).parent.parent
    snapshot_path = Path(project_root, "tests", "__snapshots__", "analyses_snapshot_test")
    snapshot_json_files = list(snapshot_path.glob("**/*.json"))

    files_with_unexpected_errors = []
    files_missing_expected_errors = []

    console.print(Panel(f"Found [info]{len(snapshot_json_files)}[/] JSON files in [path]{snapshot_path}[/]"))
    ignored_files = [
        "test_analysis_snapshot[ac886d7768][Flex_S_v2_15_P1000_96_GRIP_HS_MB_TC_TM_IDTXgen96Part1to3].json",
        "test_analysis_snapshot[f24bb0b4d9][Flex_S_v2_15_P1000_96_GRIP_HS_MB_TC_TM_IlluminaDNAPrep96PART3].json",
        # https://opentrons.atlassian.net/browse/RQA-4264
        "test_analysis_snapshot[0ea9d4ab9b][Flex_S_2_16_MPL_sample_dilution_with_96_channel_pipette].json",
        "test_analysis_snapshot[0161fbd0a6][Flex_S_2_15_MPL_langone_ribo_pt1_ramp].json",
        "test_analysis_snapshot[2791b57a2c][Flex_S_v2_24_P50_P1000_HappyPath_alter_lc].json",
        # TODO: These protocols require RTP CSV files and succeed manually.
        # Add this capability to the analysis flow.
        "test_analysis_snapshot[13c4a34603][Flex_S_v2_20_PL_cherry].json",
        "test_analysis_snapshot[b3d58bf433][Flex_S_v2_20_PL_protein_normal].json",
    ]
    console.print(Panel("\n".join([f"  • [path]{escape(f)}[/]" for f in ignored_files]), title=f"Ignoring {len(ignored_files)} files"))
    snapshot_json_files = [f for f in snapshot_json_files if f.name not in ignored_files]
    console.print(Panel(f"[info]Processing {len(snapshot_json_files)} files[/]", title="Snapshot Processing", expand=False))
    with console.status("[info]Processing snapshot files...[/]"):
        for file_path in snapshot_json_files:
            try:
                with open(file_path, "r") as f:
                    data = json.load(f)
                errors_present = data.get("errors") != []
                file_path_str = str(file_path)
                # Check for error key at the top level of the JSON
                # This happens when things are not found
                has_error_key = "error" in data
                if "Flex_S" in file_path_str:
                    if errors_present or has_error_key:
                        console.print(f"Error in {file_path}")
                        for e in data.get("errors", []):
                            for w in e.get("wrappedErrors", []):
                                for key in w.keys():
                                    console.print(f"{w[key]}")
                        files_with_unexpected_errors.append(file_path)
                else:
                    # Flex_X and other failure-case protocols are expected to have errors
                    if not errors_present and not has_error_key:
                        files_missing_expected_errors.append(file_path)

            except json.JSONDecodeError:
                console.print(f"[error]Invalid JSON format in:[/] [path]{file_path}[/]")
                raise
            except Exception as e:
                console.print(f"[error]Error processing[/] [path]{file_path}[/]: {str(e)}")
                raise

    # Separate files with '_PL_' in the name
    files_with_unexpected_errors_pl = [p for p in files_with_unexpected_errors if "_PL_" in p.name]
    files_with_unexpected_errors_other = [p for p in files_with_unexpected_errors if "_PL_" not in p.name]
    files_missing_expected_errors_pl = [p for p in files_missing_expected_errors if "_PL_" in p.name]
    files_missing_expected_errors_other = [p for p in files_missing_expected_errors if "_PL_" not in p.name]

    # Unexpected errors panels
    console.print(
        Panel(f"[error]Files with unexpected errors (PL):[/] {len(files_with_unexpected_errors_pl)}", title="Unexpected Errors (PL)")
    )
    if files_with_unexpected_errors_pl:
        for path in files_with_unexpected_errors_pl:
            relative_path = Path(path).relative_to(snapshot_path)
            console.print(f"  • [path]{escape(str(relative_path))}[/]")

    console.print(
        Panel(
            f"[error]Files with unexpected errors (Other):[/] {len(files_with_unexpected_errors_other)}", title="Unexpected Errors (Other)"
        )
    )
    if files_with_unexpected_errors_other:
        for path in files_with_unexpected_errors_other:
            relative_path = Path(path).relative_to(snapshot_path)
            console.print(f"  • [path]{escape(str(relative_path))}[/]")

    # Missing expected errors panels
    console.print(
        Panel(f"[error]Files missing expected errors (PL):[/] {len(files_missing_expected_errors_pl)}", title="Missing Errors (PL)")
    )
    if files_missing_expected_errors_pl:
        for path in files_missing_expected_errors_pl:
            relative_path = Path(path).relative_to(snapshot_path)
            console.print(f"  • [path]{escape(str(relative_path))}[/]")

    console.print(
        Panel(
            f"[error]Files missing expected errors (Other):[/] {len(files_missing_expected_errors_other)}", title="Missing Errors (Other)"
        )
    )
    if files_missing_expected_errors_other:
        for path in files_missing_expected_errors_other:
            relative_path = Path(path).relative_to(snapshot_path)
            console.print(f"  • [path]{escape(str(relative_path))}[/]")

    result = AuditResult(
        files_with_unexpected_errors=files_with_unexpected_errors, files_missing_expected_errors=files_missing_expected_errors
    )

    # Print summary
    if not files_with_unexpected_errors and not files_missing_expected_errors:
        console.print(Panel("[success]All snapshot tests passed correctly![/]", title="Audit Complete"))
    else:
        console.print(
            Panel(
                f"[error]Found {len(files_with_unexpected_errors) + len(files_missing_expected_errors)} issues[/]", title="Audit Complete"
            )
        )

    return result


if __name__ == "__main__":
    audit_snapshots()
