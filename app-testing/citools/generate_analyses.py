import json
import os
import signal
import time
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum, auto
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

import docker  # type: ignore
from automation.data.protocol import Protocol
from rich.console import Console
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


@contextmanager
def timeout(seconds: int) -> Generator[None, None, None]:
    # Signal handler function
    def raise_timeout(signum, frame) -> None:  # type: ignore[no-untyped-def]
        raise TimeoutError

    # Set the signal handler for the alarm signal
    signal.signal(signal.SIGALRM, raise_timeout)
    signal.alarm(seconds)  # Set the alarm
    try:
        yield
    finally:
        signal.alarm(0)  # Disable the alarm


class ProtocolType(Enum):
    PROTOCOL_DESIGNER = auto()
    PYTHON = auto()


@dataclass
class AnalyzedProtocol:
    host_protocol_file: Path
    container_protocol_file: Path
    host_analysis_file: Path
    container_analysis_file: Path
    tag: str
    analysis_execution_time: Optional[float] = None
    command_exit_code: Optional[int] = None
    command_output: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None

    @property
    def analysis_file_exists(self) -> bool:
        return self.host_analysis_file.exists()

    def create_failed_analysis(self) -> Dict[str, Any]:
        created_at = datetime.now(timezone.utc).isoformat()

        return {
            "createdAt": created_at,
            "errors": [
                {
                    "analysis_execution_time": self.analysis_execution_time,
                    "command_output": self.command_output,
                    "command_exit_code": self.command_exit_code,
                },
            ],
            "files": [],
            "metadata": [],
            "commands": [],
            "labware": [],
            "pipettes": [],
            "modules": [],
            "liquids": [],
            "config": {},
            "runTimeParameters": [],
        }

    def write_failed_analysis(self) -> None:
        analysis = self.create_failed_analysis()
        with open(self.host_analysis_file, "w") as file:
            json.dump(analysis, file, indent=4)

    def set_analysis(self) -> None:
        if self.analysis_file_exists:
            with open(self.host_analysis_file, "r") as file:
                self.analysis = json.load(file)
        else:
            self.write_failed_analysis()

    @property
    def protocol_file_name(self) -> str:
        return self.host_protocol_file.name

    @property
    def protocol_type(self) -> str:
        return (ProtocolType.PYTHON if self.host_protocol_file.suffix == ".py" else ProtocolType.PROTOCOL_DESIGNER).name.title()

    def set_analysis_execution_time(self, analysis_execution_time: float) -> None:
        self.analysis_execution_time = analysis_execution_time


def stop_and_restart_container(image_name: str, timeout: int = 60) -> docker.models.containers.Container:
    client = docker.from_env()
    volumes = {
        str(HOST_LABWARE): {"bind": CONTAINER_LABWARE, "mode": "rw"},
        str(HOST_RESULTS): {"bind": CONTAINER_RESULTS, "mode": "rw"},
        str(HOST_PROTOCOLS_ROOT): {"bind": CONTAINER_PROTOCOLS_ROOT, "mode": "rw"},
    }

    # Find the running container using the specified image
    containers = client.containers.list(filters={"ancestor": image_name, "status": "running"})

    if containers:
        console.print("Stopping the running container(s)...")
        for container in containers:
            container.stop(timeout=10)

    # Start a new container with the specified volume
    console.print("Starting a new container.")
    container = client.containers.run(image_name, detach=True, volumes=volumes)

    # Wait for the container to be ready if a readiness command is provided
    start_time = time.time()
    while time.time() - start_time < timeout:
        exit_code, output = container.exec_run(f"ls -al {CONTAINER_LABWARE}")
        if exit_code == 0:
            console.print("Container is ready.")
            break
        else:
            console.print("Waiting for container to be ready...")
        time.sleep(5)
    else:
        console.print("Timeout waiting for container to be ready. Proceeding anyway.")
    return container


def stop_and_remove_containers(image_name: str) -> None:
    client = docker.from_env()

    # Find all containers created from the specified image
    containers = client.containers.list(all=True, filters={"ancestor": image_name})

    for container in containers:
        try:
            # Stop the container if it's running
            if container.status == "running":
                console.print(f"Stopping container {container.short_id}...")
                container.stop(timeout=10)

            # Remove the container
            console.print(f"Removing container {container.short_id}...")
            container.remove()
        except docker.errors.ContainerError as e:
            console.print(f"Error stopping/removing container {container.short_id}: {e}")


def has_designer_application(json_file_path: Path) -> bool:
    try:
        with open(json_file_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            return "designerApplication" in data
    except json.JSONDecodeError:
        # Handle the exception if the file is not a valid JSON
        console.print(f"Invalid JSON file: {json_file_path}")
        return False


def host_analysis_path(protocol_file: Path, tag: str) -> Path:
    return Path(HOST_RESULTS, f"{protocol_file.stem}_{tag}_{ANALYSIS_SUFFIX}")


def container_analysis_path(protocol_file: Path, tag: str) -> Path:
    return Path(CONTAINER_RESULTS, f"{protocol_file.stem}_{tag}_{ANALYSIS_SUFFIX}")


def generate_protocols(tag: str) -> List[AnalyzedProtocol]:
    def find_pd_protocols() -> List[AnalyzedProtocol]:
        # Check if the provided path is a valid directory
        if not HOST_PROTOCOLS_ROOT.is_dir():
            raise NotADirectoryError(f"The path {HOST_PROTOCOLS_ROOT} is not a valid directory.")

        # Recursively find all .json files
        json_files = list(HOST_PROTOCOLS_ROOT.rglob("*.json"))
        filtered_json_files = [file for file in json_files if has_designer_application(file)]
        pd_protocols: List[AnalyzedProtocol] = []
        for path in filtered_json_files:
            relative_path = path.relative_to(HOST_PROTOCOLS_ROOT)
            updated_path = Path(CONTAINER_PROTOCOLS_ROOT, relative_path)
            pd_protocols.append(
                AnalyzedProtocol(path, updated_path, host_analysis_path(path, tag), container_analysis_path(path, tag), tag)
            )
        return pd_protocols

    def find_python_protocols() -> List[AnalyzedProtocol]:
        # Check if the provided path is a valid directory
        if not HOST_PROTOCOLS_ROOT.is_dir():
            raise NotADirectoryError(f"The path {HOST_PROTOCOLS_ROOT} is not a valid directory.")

        # Recursively find all .py files
        python_files = list(HOST_PROTOCOLS_ROOT.rglob("*.py"))
        py_protocols: List[AnalyzedProtocol] = []

        for path in python_files:
            relative_path = path.relative_to(HOST_PROTOCOLS_ROOT)
            container_path = Path(CONTAINER_PROTOCOLS_ROOT, relative_path)
            py_protocols.append(
                AnalyzedProtocol(path, container_path, host_analysis_path(path, tag), container_analysis_path(path, tag), tag=tag)
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
            console.print(f"Failed to delete {file_path}. Reason: {e}")


def container_custom_labware_paths() -> List[str]:
    if HOST_LABWARE.is_dir():
        return [os.path.join(CONTAINER_LABWARE, file) for file in os.listdir(HOST_LABWARE) if file.endswith(".json")]
    return []


def analyze(protocol: AnalyzedProtocol, container: docker.models.containers.Container) -> bool:
    # Run the analyze command
    command = f"python -I -m opentrons.cli analyze --json-output {protocol.container_analysis_file} {protocol.container_protocol_file} {' '.join(map(str, container_custom_labware_paths()))}"  # noqa: E501
    start_time = time.time()
    timeout_duration = 30  # seconds
    try:
        with timeout(timeout_duration):
            command_result = container.exec_run(cmd=command)
            exit_code = command_result.exit_code
            result = command_result.output
            protocol.command_output = result.decode("utf-8")
            protocol.command_exit_code = exit_code
            protocol.set_analysis()
            protocol.set_analysis_execution_time(time.time() - start_time)
            return True
    except TimeoutError:
        console.print(f"Command execution exceeded {timeout_duration} seconds and was aborted.")
        logs = container.logs()
        # Decode and print the logs
        console.print(f"container logs{logs.decode('utf-8')}")
    except KeyboardInterrupt:
        console.print("Execution was interrupted by the user.")
        raise
    except Exception as e:
        console.print(f"An unexpected error occurred: {e}")
        protocol.command_output = result.decode("utf-8")
        console.print(f"Command output: {protocol.command_output}")
        protocol.command_exit_code = exit_code
        console.print(f"Exit code: {protocol.command_exit_code}")
        protocol.set_analysis()
        return False
    protocol.command_output = None
    protocol.command_exit_code = None
    protocol.analysis = None
    protocol.set_analysis_execution_time(time.time() - start_time)
    return False


def analyze_many(protocol_files: List[AnalyzedProtocol], container: docker.models.containers.Container) -> None:
    for file in protocol_files:
        analyze(file, container)
    accumulated_time = sum(protocol.analysis_execution_time for protocol in protocol_files if protocol.analysis_execution_time is not None)
    console.print(f"{len(protocol_files)} protocols with total analysis time of {accumulated_time:.2f} seconds.\n")


def analyze_against_image(tag: str) -> List[AnalyzedProtocol]:
    image_name = f"{IMAGE}:{tag}"
    protocols = generate_protocols(tag)
    protocols_to_process = protocols
    # protocols_to_process = protocols[:1]  # For testing
    try:
        console.print(f"Analyzing {len(protocols_to_process)} protocol(s) against {image_name}...")
        container = stop_and_restart_container(image_name)
        analyze_many(protocols_to_process, container)
    finally:
        stop_and_remove_containers(image_name)
    return protocols_to_process


def generate_analyses_from_test(tag: str, protocols: List[Protocol]) -> None:
    """Generate analyses from the tests."""
    try:
        image_name = f"{IMAGE}:{tag}"
        protocols_to_process: List[AnalyzedProtocol] = []
        # convert the protocols to AnalyzedProtocol
        for test_protocol in protocols:
            host_protocol_file = Path(test_protocol.file_path)
            container_protocol_file = Path(CONTAINER_PROTOCOLS_ROOT, host_protocol_file.relative_to(HOST_PROTOCOLS_ROOT))
            host_analysis_file = host_analysis_path(host_protocol_file, tag)
            container_analysis_file = container_analysis_path(host_protocol_file, tag)
            protocols_to_process.append(
                AnalyzedProtocol(host_protocol_file, container_protocol_file, host_analysis_file, container_analysis_file, tag)
            )
        console.print(f"Analyzing {len(protocols_to_process)} protocol(s) against {tag}...")
        container = stop_and_restart_container(image_name)
        # Analyze the protocols
        for protocol_to_analyze in protocols_to_process:
            console.print(f"Analyzing {protocol_to_analyze.host_protocol_file}...")
            analyzed = analyze(protocol_to_analyze, container)
            if not analyzed:  # Fail fast
                console.print("Analysis failed. Exiting.")
                stop_and_remove_containers(image_name)
        accumulated_time = sum(
            protocol.analysis_execution_time for protocol in protocols_to_process if protocol.analysis_execution_time is not None
        )
        console.print(f"{len(protocols_to_process)} protocols with total analysis time of {accumulated_time:.2f} seconds.\n")
    finally:
        stop_and_remove_containers(image_name)
