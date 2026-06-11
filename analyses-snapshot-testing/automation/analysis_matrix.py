import ast
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from citools.generate_analyses import TargetProtocol, generate_analyses_from_test
from packaging import version
from packaging.version import InvalidVersion
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

from automation.data.collect_direct import ProtocolAudit, collect_protocols
from automation.data.protocol import (
    GENERATED_PROTOCOLS_FOLDER,
    MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOL_DESIGNER_PROTOCOLS_FOLDER,
    PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOLS_FOLDER,
    Protocol,
)
from automation.data.protocol_registry import ProtocolRegistry

console = Console()

tags = [
    "chore_release-8.5.0",
    "v8.4.1",
    "v8.3.2",
    "v8.2.0",
    "v8.0.0",
]

ROBOT_STACK_VERSION_MAP: Dict[str, Dict[str, str]] = {
    """Robot stack version mapping to maximum PAPI and PD versions."""
    "chore_release-8.5.0": {"api": "2.24", "pd": "8.5.0"},
    "8.4.1": {"api": "2.23", "pd": "8.4.4"},
    "8.3.2": {"api": "2.22", "pd": "?"},
    "8.2.0": {"api": "2.21", "pd": "?"},
    "8.0.0": {"api": "2.20", "pd": "?"},
}


def determine_expect_no_errors(filename: str) -> bool:
    """
    Determine if no errors are expected based on the filename.

    Args:
        filename: The name of the file.

    Returns:
        True if filename starts with 'Flex_S', else False.
    """
    return filename.startswith("Flex_S")


@dataclass
class ProtocolInfo:
    """
    Dataclass representing a protocol file's analysis info.

    Attributes:
        filepath: Path to the protocol file.
        filename: Name of the file.
        expect_no_errors: True if the filename starts with 'Flex_S'.
        api_level: The API level extracted either from requirements or metadata.
        pd_version: The designer application version from a JSON file (if applicable).
        robot: The robot type extracted either from the file's requirements, metadata, or JSON.
    """

    filepath: Path
    filename: str
    expect_no_errors: bool
    key: Optional[str] = None
    api_level: Optional[Any] = None
    pd_version: Optional[str] = None
    robot: Optional[str] = None

    @property
    def pd_protocol(self) -> bool:
        """Return True if this is a Protocol Designer protocol (.json)."""
        return self.filepath.suffix == ".json"

    def min_robot_stack_version(self) -> Optional[str]:  # noqa: C901
        """
        Return the minimum robot stack version supporting this protocol's api_level or pd_version.
        Returns:
            The minimum robot stack version as a string, or None if no mapping exists.
        """
        if self.pd_protocol:
            if not self.pd_version:
                return None
            # Try to parse pd_version, handle errors
            for stack_version, ver_map in sorted(ROBOT_STACK_VERSION_MAP.items(), reverse=True):
                max_pd = ver_map["pd"]
                if max_pd == "?":
                    continue
                try:
                    # Try both as PEP440
                    if version.parse(self.pd_version) <= version.parse(max_pd):
                        return stack_version
                except InvalidVersion:
                    # Try stripping non-numeric suffixes for loose match
                    pd_clean = self.pd_version.split("-")[0]
                    max_pd_clean = max_pd.split("-")[0]
                    try:
                        if version.parse(pd_clean) <= version.parse(max_pd_clean):
                            return stack_version
                    except InvalidVersion:
                        continue  # Just skip if both are invalid
            return None
        else:
            if not self.api_level:
                return None
            for stack_version, ver_map in sorted(ROBOT_STACK_VERSION_MAP.items(), reverse=True):
                max_api = ver_map["api"]
                try:
                    if version.parse(self.api_level) <= version.parse(max_api):
                        return stack_version
                except InvalidVersion:
                    # Same trick if you ever see a weird api_level (rare)
                    continue
            return None

    def is_compatible_with_stack(self, stack_version: str) -> bool:
        """
        Check if this protocol is compatible with a given robot stack version.
        Args:
            stack_version: The robot stack version to test against.
        Returns:
            True if compatible, False otherwise.
        """
        if stack_version not in ROBOT_STACK_VERSION_MAP:
            return False
        if self.pd_protocol:
            max_pd = ROBOT_STACK_VERSION_MAP[stack_version]["pd"]
            if max_pd == "?" or not self.pd_version:
                return False
            return version.parse(self.pd_version) <= version.parse(max_pd)
        else:
            max_api = ROBOT_STACK_VERSION_MAP[stack_version]["api"]
            if not self.api_level:
                return False
            return version.parse(self.api_level) <= version.parse(max_api)


def protocols_under_test(protocol_names: List[str]) -> List[Protocol]:
    names = ",".join(protocol_names)
    console.print(Panel(f"Protocols under test: {names}", title="Protocols Under Test", subtitle="Analysis Matrix"))
    time.sleep(5)
    protocol_registry: ProtocolRegistry = ProtocolRegistry(protocol_names=names, override_protocol_names="none")
    if not protocol_registry.protocols_to_test:
        exit("No protocols were resolved from the protocol names provided. Exiting.")
    return protocol_registry.protocols_to_test


def extract_py_fields(filepath: Path) -> Tuple[Optional[Any], Optional[str]]:  # noqa: C901
    """
    Extract api_level and robot from a Python file.

    Logic:
      - If a 'requirements' variable is present, extract:
          api_level = requirements["apiLevel"]
          robot = requirements["robotType"]
      - Otherwise, if a 'metadata' variable is found, extract:
          api_level = metadata["apiLevel"]
          robot is set to "Flex"

    Args:
        filepath: Path to the .py file.

    Returns:
        A tuple (api_level, robot) if found, otherwise (None, None).
    """
    try:
        with filepath.open("r", encoding="utf-8") as f:
            file_content = f.read()
        tree = ast.parse(file_content, filename=str(filepath))
    except Exception as e:
        console.print(f"[red]Error parsing {filepath}: {e}[/red]")
        return None, None

    # First, search for 'requirements'
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "requirements":
                    if isinstance(node.value, ast.Dict):
                        try:
                            req_dict: Dict[Any, Any] = ast.literal_eval(node.value)
                            api_level = req_dict.get("apiLevel")
                            robot = req_dict.get("robotType")
                            return api_level, robot
                        except Exception as e:
                            console.print(f"[red]Error evaluating requirements in {filepath}: {e}[/red]")
                            return None, None

    # If no requirements, look for 'metadata'
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "metadata":
                    if isinstance(node.value, ast.Dict):
                        try:
                            meta_dict: Dict[Any, Any] = ast.literal_eval(node.value)
                            api_level = meta_dict.get("apiLevel")
                            # When requirements are missing, default robot to Flex
                            return api_level, "Flex"
                        except Exception as e:
                            console.print(f"[red]Error evaluating metadata in {filepath}: {e}[/red]")
                            return None, "Flex"
    return None, None


def extract_pd_version_from_json(filepath: Path) -> Optional[str]:
    """
    Extract the pd_version from a JSON file.

    Args:
        filepath: Path to the .json file.

    Returns:
        The value of designerApplication.version if found, otherwise None.
    """
    try:
        with filepath.open("r", encoding="utf-8") as f:
            data = json.load(f)
        designer_app = data.get("designerApplication", {})
        if isinstance(designer_app, dict):
            return designer_app.get("version")
    except Exception as e:
        console.print(f"[red]Error reading {filepath}: {e}[/red]")
    return None


def extract_robot_from_json(filepath: Path) -> Optional[str]:
    """
    Extract the robot model from a JSON file.

    Args:
        filepath: Path to the .json file.

    Returns:
        The value of robot.model if found, otherwise None.
    """
    try:
        with filepath.open("r", encoding="utf-8") as f:
            data = json.load(f)
        robot_info = data.get("robot", {})
        if isinstance(robot_info, dict):
            return robot_info.get("model")
    except Exception as e:
        console.print(f"[red]Error reading robot field from {filepath}: {e}[/red]")
    return None


def gather_protocol_files() -> List[ProtocolAudit]:
    """
    Gather all .json and .py files in the specified directory.

    Args:
        directory: The directory to search.

    Returns:
        A list of Path objects for each protocol file found.
    """
    dirs = [
        PROTOCOLS_FOLDER,
        PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
        GENERATED_PROTOCOLS_FOLDER,
        MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
        PROTOCOL_DESIGNER_PROTOCOLS_FOLDER,
    ]
    return collect_protocols(dirs)


def display_protocols_table(protocols: List[ProtocolInfo]) -> None:
    """
    Display a table of protocol information.

    Args:
        protocols: List of ProtocolInfo objects.
    """

    table = Table(title="Protocols Analysis")
    table.add_column("Key", justify="right", style="cyan", no_wrap=True)
    table.add_column("Filename", style="magenta")
    table.add_column("Expect No Errors", justify="center")
    table.add_column("API Level", style="green")
    table.add_column("PD Version", style="green")
    table.add_column("Robot", style="yellow")
    table.add_column("Min Robot Stack Version", style="blue")

    for protocol in protocols:
        table.add_row(
            protocol.key,
            protocol.filename,
            str(protocol.expect_no_errors),
            str(protocol.api_level) if protocol.api_level is not None else "-",
            protocol.pd_version if protocol.pd_version is not None else "-",
            protocol.robot if protocol.robot is not None else "-",
            protocol.min_robot_stack_version() if protocol.min_robot_stack_version() is not None else "-",
        )
    console.print(table)


def interactive_protocol_selection(protocols: List[ProtocolInfo]) -> List[ProtocolInfo]:
    """
    Interactively select protocols to analyze if the user chooses 'some'.

    Args:
        protocols: List of all ProtocolInfo objects.

    Returns:
        A list of selected ProtocolInfo objects.
    """
    display_protocols_table(protocols)
    console.print("\nEnter the keys of the protocols you want to analyze, separated by commas (e.g. 1,3,5).")
    selection = Prompt.ask("Your selection (or press Enter to select none)", default="")
    if not selection.strip():
        return []
    try:
        keys = [idx.strip() for idx in selection.split(",") if idx.strip().isdigit()]
    except ValueError:
        console.print("[red]Invalid input. Please enter valid numbers.[/red]")
        return []
    console.print(f"[blue]You selected keys: {keys}[/blue]")
    selected = [p for p in protocols if p.key in keys]
    if not selected:
        console.print("[red]No valid protocols selected.[/red]")
    if len(selected) != len(keys):
        missing_indices = [idx for idx in keys if idx not in [p.key for p in selected]]
        console.print(f"[red]The following indices were not found in the protocols: {missing_indices}[/red]")
    return selected


class AnalysisOutcome:
    NO_ERRORS = "✅"
    ERRORS = "❌"
    NA = "—"

    def __init__(self, value: str):
        self.value = value

    def __str__(self) -> str:
        return self.value

    def __repr__(self) -> str:
        return self.value


@dataclass
class AnalysisMatrix:
    filename: str
    v8_5_0: str = AnalysisOutcome.NA
    v8_4_1: str = AnalysisOutcome.NA
    v8_3_2: str = AnalysisOutcome.NA
    v8_2_0: str = AnalysisOutcome.NA
    v8_0_0: str = AnalysisOutcome.NA
    expect_no_errors: bool = False

    def set_result(self, tag: str, protocol: TargetProtocol) -> None:
        if not protocol.analysis:
            console.print(f"[red]No analysis results for {self.filename}[/red]")
            return
        if not protocol.analysis["errors"]:
            console.print(f"[green]No errors for {self.filename}[/green]")
            result = AnalysisOutcome.NO_ERRORS
        else:
            console.print(f"[red]Errors found in {self.filename}[/red]")
            result = AnalysisOutcome.ERRORS

        tag_version = tag.lower()
        if tag_version == "chore_release-8.5.0":
            self.v8_5_0 = result
        elif tag_version == "v8.4.1":
            self.v8_4_1 = result
        elif tag_version == "v8.3.2":
            self.v8_3_2 = result
        elif tag_version == "v8.2.0":
            self.v8_2_0 = result
        elif tag_version == "v8.0.0":
            self.v8_0_0 = result


def main() -> None:  # noqa: C901
    """
    Main function to gather protocols and interactively select files for analysis.
    """
    protocols_dir = Path(Path("__file__").parent.parent, "files", "protocols")
    if not protocols_dir.exists() or not protocols_dir.is_dir():
        console.print(f"[red]Directory {protocols_dir} does not exist or is not a directory.[/red]")
        return

    protocols = gather_protocol_files()

    final_protocols: List[ProtocolInfo] = []
    for protocol in protocols:
        filename = protocol.filename
        expect_no_errors = determine_expect_no_errors(filename)
        api_level: Optional[Any] = None
        pd_version: Optional[str] = None
        robot: Optional[str] = None

        if protocol.ext == "py":
            api_level, robot = extract_py_fields(protocol.file_path)
        elif protocol.ext == "json":
            pd_version = extract_pd_version_from_json(protocol.file_path)
            robot = extract_robot_from_json(protocol.file_path)

        final_protocols.append(
            ProtocolInfo(
                filepath=protocol.file_path,
                filename=filename,
                expect_no_errors=expect_no_errors,
                api_level=api_level,
                pd_version=pd_version,
                robot=robot,
            )
        )

    # Sort protocols
    final_protocols = sorted(final_protocols, key=lambda p: (p.expect_no_errors, p.robot or "", p.api_level or "", p.pd_version or ""))

    # Assign keys after sorting
    for i, protocol in enumerate(final_protocols):
        protocol.key = str(i)

    choice = Prompt.ask(
        "Do you want to analyze all protocols or just some?",
        choices=["all", "some"],
        default="some",
    )
    if choice == "some":
        selected_protocols = interactive_protocol_selection(final_protocols)
    else:
        selected_protocols = final_protocols

    if not selected_protocols:
        console.print("[yellow]No protocols selected for analysis.[/yellow]")
        return

    console.print("\n[bold green]Selected Protocols:[/bold green]")
    display_protocols_table(selected_protocols)
    # Further processing can be added here...
    console.print("\n[blue]Proceeding with further analysis...[/blue]")

    # now we are going to generate an analysis for each of the selected protocols
    # and we will do so for each of the robot versions that are supported by the protocol

    result_matrix = [
        AnalysisMatrix(
            filename=p.filename,
            v8_5_0=AnalysisOutcome.NA,
            v8_4_1=AnalysisOutcome.NA,
            v8_3_2=AnalysisOutcome.NA,
            v8_2_0=AnalysisOutcome.NA,
            v8_0_0=AnalysisOutcome.NA,
            expect_no_errors=p.expect_no_errors,
        )
        for p in selected_protocols
    ]
    for tag in tags:
        compatible_protocols = [
            p
            for p in selected_protocols
            if p.min_robot_stack_version() is not None and p.is_compatible_with_stack(p.min_robot_stack_version() or "")
        ]
        console.print(f"Testing {len(compatible_protocols)} protocols for {tag}")
        if not compatible_protocols:
            console.print(f"[yellow]No protocols compatible with {tag}.[/yellow]")
            continue
        names = [p.filename.rsplit(".", 1)[0] for p in compatible_protocols]
        protocols_to_test = protocols_under_test(names)
        processed_protocols = generate_analyses_from_test(
            tag,
            protocols_to_test,
        )
        for p in processed_protocols:
            for matrix in result_matrix:
                if matrix.filename in str(p.host_protocol_file):
                    matrix.set_result(tag, p)
                    break
    # Display the result_matrix
    table = Table(title="Analysis Matrix Results")
    table.add_column("Filename", style="magenta")
    table.add_column("v8.5.0", justify="center")
    table.add_column("v8.4.1", justify="center")
    table.add_column("v8.3.2", justify="center")
    table.add_column("v8.2.0", justify="center")
    table.add_column("v8.0.0", justify="center")
    table.add_column("Expect No Errors", justify="center")
    for matrix in result_matrix:
        table.add_row(
            matrix.filename,
            str(matrix.v8_5_0),
            str(matrix.v8_4_1),
            str(matrix.v8_3_2),
            str(matrix.v8_2_0),
            str(matrix.v8_0_0),
            str(matrix.expect_no_errors),
        )
    console.print(table)


if __name__ == "__main__":
    main()
