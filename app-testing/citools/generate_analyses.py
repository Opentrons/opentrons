# docker build --build-arg OPENTRONS_VERSION=v7.0.2 -t opentrons-analysis:v7.0.2 .
# docker build --build-arg OPENTRONS_VERSION=v7.1.0-alpha.1 -t opentrons-analysis:v7.1.0-alpha.1 .
# docker build --build-arg OPENTRONS_VERSION=v7.1.0-alpha.2 -t opentrons-analysis:v7.1.0-alpha.2 .
# docker build --build-arg OPENTRONS_VERSION=v7.1.0-alpha.3 -t opentrons-analysis:v7.1.0-alpha.3 .

# python -m pipenv run python citools/generate_analyses.py

import json
import os
import time
from dataclasses import dataclass
from enum import Enum, auto
from pathlib import Path
from typing import Any, Dict, List

import docker  # type: ignore
from automation.data.protocol import Protocol
from rich import print
from rich.console import Console
from rich.panel import Panel
from rich.traceback import install

install(show_locals=True)
IMAGE = "opentrons-analysis"
CONTAINER_LABWARE = "/var/lib/ot"
HOST_LABWARE = Path(Path(__file__).parent.parent, "files", "labware")
HOST_PROTOCOLS_ROOT = Path(Path(__file__).parent.parent, "files", "protocols")
CONTAINER_PROTOCOLS_ROOT = "/var/lib/ot/protocols"
CONTAINER_RESULTS = "/var/lib/ot/analysis_results"
HOST_RESULTS = Path(Path(__file__).parent.parent, "analysis_results")
ANALYSIS_SUFFIX = "analysis.json"

console = Console()


class ProtocolType(Enum):
    PROTOCOL_DESIGNER = auto()
    PYTHON = auto()


@dataclass
class AnalyzeProtocol:
    host_protocol_file: Path
    container_protocol_file: Path
    host_analysis_file: Path
    container_analysis_file: Path
    tag: str
    analysis_execution_time: float | None = None
    exit_code: int | None = None
    output: str | None = None
    analysis: Dict[str, Any] | None = None

    @property
    def analysis_file_exists(self) -> bool:
        return self.host_analysis_file.exists()

    def set_analysis(self) -> None:
        if self.analysis_file_exists:
            with open(self.host_analysis_file, "r") as file:
                self.analysis = json.load(file)

    @property
    def protocol_file_name(self) -> str:
        return self.host_protocol_file.name

    @property
    def protocol_type(self) -> str:
        return (ProtocolType.PYTHON if self.host_protocol_file.suffix == ".py" else ProtocolType.PROTOCOL_DESIGNER).name.title()

    def set_analysis_execution_time(self, analysis_execution_time: float) -> None:
        self.analysis_execution_time = analysis_execution_time


def run_container(image_name: str, timeout: int = 60) -> docker.models.containers.Container:
    client = docker.from_env()
    volumes = {
        str(HOST_LABWARE): {"bind": CONTAINER_LABWARE, "mode": "rw"},
        str(HOST_RESULTS): {"bind": CONTAINER_RESULTS, "mode": "rw"},
        str(HOST_PROTOCOLS_ROOT): {"bind": CONTAINER_PROTOCOLS_ROOT, "mode": "rw"},
    }

    # Check for running containers using the specified image
    containers = client.containers.list(filters={"ancestor": image_name, "status": "running"})

    if containers:
        print("Container already running.")
        print("Exiting, stop this container so that you may be sure to have the right volumes attached.")
        exit(1)
    else:
        # If no running container is found, start a new one with the specified volume
        print("Starting a new container.")
        container = client.containers.run(image_name, detach=True, volumes=volumes)

    # Wait for the container to be ready if a readiness command is provided
    start_time = time.time()
    while time.time() - start_time < timeout:
        exit_code, output = container.exec_run(f"ls -al {CONTAINER_LABWARE}")
        if exit_code == 0:
            print("Container is ready.")
            break
        else:
            print("Waiting for container to be ready...")
        time.sleep(5)
    else:
        print("Timeout waiting for container to be ready. Proceeding anyway.")
    return container


def stop_and_remove_containers(image_name: str) -> None:
    client = docker.from_env()

    # Find all containers created from the specified image
    containers = client.containers.list(all=True, filters={"ancestor": image_name})

    for container in containers:
        try:
            # Stop the container if it's running
            if container.status == "running":
                print(f"Stopping container {container.short_id}...")
                container.stop()

            # Remove the container
            print(f"Removing container {container.short_id}...")
            container.remove()
        except docker.errors.ContainerError as e:
            print(f"Error stopping/removing container {container.short_id}: {e}")


def has_designer_application(json_file_path: Path) -> bool:
    try:
        with open(json_file_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            return "designerApplication" in data
    except json.JSONDecodeError:
        # Handle the exception if the file is not a valid JSON
        print(f"Invalid JSON file: {json_file_path}")
        return False


def host_analysis_path(protocol_file: Path, tag: str) -> Path:
    return Path(HOST_RESULTS, f"{protocol_file.stem}_{tag}_{ANALYSIS_SUFFIX}")


def container_analysis_path(protocol_file: Path, tag: str) -> Path:
    return Path(CONTAINER_RESULTS, f"{protocol_file.stem}_{tag}_{ANALYSIS_SUFFIX}")


def generate_protocols(tag: str) -> List[AnalyzeProtocol]:
    def find_pd_protocols() -> List[AnalyzeProtocol]:
        # Check if the provided path is a valid directory
        if not HOST_PROTOCOLS_ROOT.is_dir():
            raise NotADirectoryError(f"The path {HOST_PROTOCOLS_ROOT} is not a valid directory.")

        # Recursively find all .json files
        json_files = list(HOST_PROTOCOLS_ROOT.rglob("*.json"))
        filtered_json_files = [file for file in json_files if has_designer_application(file)]
        pd_protocols: List[AnalyzeProtocol] = []
        for path in filtered_json_files:
            relative_path = path.relative_to(HOST_PROTOCOLS_ROOT)
            updated_path = Path(CONTAINER_PROTOCOLS_ROOT, relative_path)
            pd_protocols.append(AnalyzeProtocol(path, updated_path, host_analysis_path(path, tag), container_analysis_path(path, tag), tag))
        return pd_protocols

    def find_python_protocols() -> List[AnalyzeProtocol]:
        # Check if the provided path is a valid directory
        if not HOST_PROTOCOLS_ROOT.is_dir():
            raise NotADirectoryError(f"The path {HOST_PROTOCOLS_ROOT} is not a valid directory.")

        # Recursively find all .py files
        python_files = list(HOST_PROTOCOLS_ROOT.rglob("*.py"))
        py_protocols: List[AnalyzeProtocol] = []

        for path in python_files:
            relative_path = path.relative_to(HOST_PROTOCOLS_ROOT)
            container_path = Path(CONTAINER_PROTOCOLS_ROOT, relative_path)
            py_protocols.append(
                AnalyzeProtocol(path, container_path, host_analysis_path(path, tag), container_analysis_path(path, tag), tag=tag)
            )
        return py_protocols

    return find_pd_protocols() + find_python_protocols()


def remove_all_files_in_directory(directory: Path) -> None:
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                pass  # Currently, subdirectories are not removed
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")


def report(protocol: AnalyzeProtocol) -> None:
    panel = Panel(
        f"[bold green]Output:[/bold green]\n{protocol.output}\n\n[bold red]Exit Code:[/bold red] {protocol.exit_code}",
        title="[bold magenta]Command Result[/bold magenta]",
        expand=False,
    )
    console.print(panel)
    if protocol.analysis_file_exists is True:
        if protocol.analysis is not None and protocol.analysis["errors"] != []:
            console.print(f"[bold red]Analysis has errors {protocol.protocol_file_name}[/bold red]")
            console.print(protocol.analysis["errors"])
            console.print(protocol.output)
    else:
        console.print(f"[bold red]Analysis not created for {protocol.protocol_file_name}[/bold red]")
        console.print(protocol.output)


def container_custom_labware_paths() -> List[str]:
    if HOST_LABWARE.is_dir():
        return [os.path.join(CONTAINER_LABWARE, file) for file in os.listdir(HOST_LABWARE) if file.endswith(".json")]
    return []


def analyze(protocol: AnalyzeProtocol, container: docker.models.containers.Container) -> None:
    # Run the analyze command
    command = f"python -I -m opentrons.cli analyze --json-output {protocol.container_analysis_file} {protocol.container_protocol_file} {' '.join(map(str, container_custom_labware_paths()))}"  # noqa: E501
    start_time = time.time()
    exit_code, result = container.exec_run(command)  # Assuming container is a defined object
    protocol.output = result.decode("utf-8")
    protocol.exit_code = exit_code
    protocol.set_analysis()
    protocol.set_analysis_execution_time(time.time() - start_time)


def analyze_many(protocol_files: List[AnalyzeProtocol], container: docker.models.containers.Container) -> None:
    for file in protocol_files:
        analyze(file, container)
    accumulated_time = sum(protocol.analysis_execution_time for protocol in protocol_files if protocol.analysis_execution_time is not None)
    console.print(f"{len(protocol_files)} protocols with total analysis time of {accumulated_time:.2f} seconds.\n")


def analyze_against_image(tag: str) -> List[AnalyzeProtocol]:
    image_name = f"{IMAGE}:{tag}"
    protocols = generate_protocols(tag)
    protocols_to_process = protocols
    # protocols_to_process = protocols[:1]  # For testing
    try:
        console.print(f"Analyzing {len(protocols_to_process)} protocol(s) against {image_name}...")
        container = run_container(image_name)
        analyze_many(protocols_to_process, container)
    finally:
        stop_and_remove_containers(image_name)
    return protocols_to_process


def generate_analyses_from_test(tag: str, protocols: List[Protocol]) -> None:
    """Generate analyses from the tests."""
    image_name = f"{IMAGE}:{tag}"
    protocols_to_process: List[AnalyzeProtocol] = []
    for protocol in protocols:
        host_protocol_file = Path(protocol.file_path)
        container_protocol_file = Path(CONTAINER_PROTOCOLS_ROOT, host_protocol_file.relative_to(HOST_PROTOCOLS_ROOT))
        host_analysis_file = host_analysis_path(host_protocol_file, tag)
        container_analysis_file = container_analysis_path(host_protocol_file, tag)
        protocols_to_process.append(
            AnalyzeProtocol(host_protocol_file, container_protocol_file, host_analysis_file, container_analysis_file, tag)
        )
    try:
        console.print(f"Analyzing {len(protocols_to_process)} protocol(s) against {tag}...")
        container = run_container(image_name)
        analyze_many(protocols_to_process, container)
    finally:
        stop_and_remove_containers(image_name)


def main() -> None:
    # # Create the parser
    # parser = argparse.ArgumentParser(description="Process some integers.")
    # # Add the arguments
    # parser.add_argument("tag", type=str, help="The tag to process")
    # # Execute the parse_args() method
    # args = parser.parse_args()
    # tag = args.tag
    # console.print(f"Received tag: {tag}")
    # tag = "v7.0.2"
    # tag = "v7.1.0-alpha.1"
    # tag = "v7.1.0-alpha.2"
    # tag = "v7.1.0-alpha.3"
    # base_tag = "v7.0.2"
    new_release_tag = "v7.1.0-alpha.3"
    # analyze_against_image(base_tag)
    analyze_against_image(new_release_tag)


if __name__ == "__main__":
    main()
