"""Configuration loading for the robot fleet Jira ticketing workflow."""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping, Sequence

DEFAULT_JIRA_URL = "https://opentrons.atlassian.net"
DEFAULT_CLEANUP_KEEP_COUNT = 3
DEFAULT_ENV_FILE_NAME = "robot_fleet_error.env"


@dataclass(frozen=True)
class LocalMachineConfig:
    """Machine-local paths that rarely change between runs."""

    storage_directory: Path
    robot_ssh_key_path: Path


@dataclass(frozen=True)
class JiraConfig:
    """Jira connection settings resolved at startup."""

    url: str
    project_key: str
    email: str
    api_token: str


@dataclass(frozen=True)
class ArtifactConfig:
    """Local artifact retention settings."""

    cleanup_keep_count: int


@dataclass(frozen=True)
class RobotFleetRuntimeConfig:
    """Full runtime configuration for one invocation of the fleet script."""

    robot_ips: tuple[str, ...]
    local_machine: LocalMachineConfig
    jira: JiraConfig
    artifacts: ArtifactConfig


def _parse_env_file(env_file_path: Path) -> dict[str, str]:
    """Parse a simple KEY=VALUE env file into a dictionary.

    Lines beginning with ``#`` and blank lines are ignored. Values may be quoted.
  """
    values: dict[str, str] = {}
    if not env_file_path.is_file():
        return values

    for raw_line in env_file_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value
    return values


def _merged_env_values(env_file: Path | None) -> Mapping[str, str]:
    """Merge env-file values with the process environment (env vars win)."""
    file_values = _parse_env_file(env_file) if env_file is not None else {}
    merged = dict(file_values)
    for key, value in os.environ.items():
        if key.startswith("ABR_"):
            merged[key] = value
    return merged


def _require_value(values: Mapping[str, str], key: str) -> str:
    """Return a required configuration value or raise ``ValueError``."""
    value = values.get(key, "").strip()
    if not value:
        raise ValueError(f"Missing required configuration value: {key}")
    return value


def _optional_path(values: Mapping[str, str], key: str) -> Path | None:
    """Return a path value when the key is set."""
    value = values.get(key, "").strip()
    return Path(value).expanduser() if value else None


def _build_local_machine_config(values: Mapping[str, str]) -> LocalMachineConfig:
    """Build local machine configuration from merged env values."""
    storage_directory = Path(
        _require_value(values, "ABR_STORAGE_DIRECTORY")
    ).expanduser()
    ssh_key_path = _optional_path(values, "ABR_ROBOT_SSH_KEY_PATH")

    if ssh_key_path is None:
        ssh_key_path = storage_directory / "robot_key"

    return LocalMachineConfig(
        storage_directory=storage_directory,
        robot_ssh_key_path=ssh_key_path,
    )


def _build_jira_config(values: Mapping[str, str]) -> JiraConfig:
    """Build Jira configuration from merged env values."""
    url = values.get("ABR_JIRA_URL", DEFAULT_JIRA_URL).strip() or DEFAULT_JIRA_URL
    project_key = _require_value(values, "ABR_JIRA_PROJECT_KEY")
    email = _require_value(values, "ABR_JIRA_EMAIL")
    api_token = _require_value(values, "ABR_JIRA_API_TOKEN")
    return JiraConfig(
        url=url,
        project_key=project_key,
        email=email,
        api_token=api_token,
    )


def _build_artifact_config(values: Mapping[str, str]) -> ArtifactConfig:
    """Build artifact retention configuration from merged env values."""
    raw_keep_count = values.get(
        "ABR_CLEANUP_KEEP_COUNT", str(DEFAULT_CLEANUP_KEEP_COUNT)
    ).strip()
    try:
        cleanup_keep_count = int(raw_keep_count)
    except ValueError as exc:
        raise ValueError(
            f"ABR_CLEANUP_KEEP_COUNT must be an integer, got: {raw_keep_count!r}"
        ) from exc
    return ArtifactConfig(cleanup_keep_count=cleanup_keep_count)


def validate_local_machine_config(local_machine: LocalMachineConfig) -> None:
    """Validate that required local machine paths exist before processing robots.

    Creates the storage directory when it does not already exist.
    """
    local_machine.storage_directory.mkdir(parents=True, exist_ok=True)

    if not local_machine.robot_ssh_key_path.is_file():
        raise FileNotFoundError(
            f"Robot SSH key not found: {local_machine.robot_ssh_key_path}"
        )


def load_robot_fleet_config(
    argv: Sequence[str] | None = None,
) -> RobotFleetRuntimeConfig:
    """Load configuration from an env file, environment variables, and CLI args.

    Machine-local values come from ``ABR_*`` variables (typically in a local env
    file). Runtime invocation data, especially robot IPs, comes from CLI args.
    """
    parser = argparse.ArgumentParser(
        description="Create Jira tickets for robots with errors."
    )
    parser.add_argument(
        "--robot-ips",
        nargs="+",
        required=True,
        metavar="ROBOT_IP",
        help="One or more robot IP addresses to process.",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help=(
            "Path to a local env file with ABR_* machine configuration. "
            f"Defaults to ./{DEFAULT_ENV_FILE_NAME} in the current working directory."
        ),
    )
    args = parser.parse_args(argv)

    env_file = args.env_file
    if env_file is None:
        default_env = Path(DEFAULT_ENV_FILE_NAME)
        env_file = default_env if default_env.is_file() else None

    values = _merged_env_values(env_file)
    local_machine = _build_local_machine_config(values)
    jira = _build_jira_config(values)
    artifacts = _build_artifact_config(values)

    robot_ips = tuple(str(ip).strip() for ip in args.robot_ips)
    if not robot_ips or any(not ip for ip in robot_ips):
        raise ValueError("--robot-ips requires at least one non-empty IP address.")

    return RobotFleetRuntimeConfig(
        robot_ips=robot_ips,
        local_machine=local_machine,
        jira=jira,
        artifacts=artifacts,
    )
