"""Developer tooling for the CI bootstrap container.

This module exposes a small CLI that wraps the Docker commands required to
build, publish, and iteratively test-drive the CI container locally. The goal
is to avoid repeatedly typing long `docker` invocations by hand while keeping
the implementation dependency-free so it runs anywhere Python 3.10 is
available.
"""

from __future__ import annotations

import argparse
import logging
import shlex
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Iterable, List


REPO_ROOT = Path(__file__).resolve().parents[1]
THIS_DIR = Path(__file__).resolve().parent
DEFAULT_DOCKERFILE = THIS_DIR / "Dockerfile"
DEFAULT_IMAGE = "ghcr.io/opentrons/ci-bootstrap:local"


class DockerError(RuntimeError):
    """Raised when a wrapped Docker command exits with a non-zero status."""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Utility commands for the Opentrons CI bootstrap container",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable verbose logging output",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    build_parser = subparsers.add_parser(
        "build",
        help="Build the CI container image",
    )
    build_parser.add_argument(
        "--tag",
        default=DEFAULT_IMAGE,
        help="Target image tag (default: %(default)s)",
    )
    build_parser.add_argument(
        "--context",
        default=str(REPO_ROOT),
        help="Docker build context directory (default: repository root)",
    )
    build_parser.add_argument(
        "--file",
        default=str(DEFAULT_DOCKERFILE),
        help="Path to the Dockerfile (default: %(default)s)",
    )
    build_parser.add_argument(
        "--platform",
        help="Optional target platform passed to docker build",
    )
    build_parser.add_argument(
        "--build-arg",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Additional build arguments passed through to docker build",
    )
    build_parser.add_argument(
        "--label",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Additional labels to set on the image",
    )
    build_parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Disable the Docker build cache",
    )
    build_parser.add_argument(
        "--push",
        action="store_true",
        help="Push the resulting image after a successful build",
    )

    shell_parser = subparsers.add_parser(
        "shell",
        help="Run a command inside the CI container with the repo mounted",
    )
    shell_parser.add_argument(
        "--image",
        default=DEFAULT_IMAGE,
        help="Image to run (default: %(default)s)",
    )
    shell_parser.add_argument(
        "--mount",
        default=str(REPO_ROOT),
        help="Host path to mount as /workspace (default: repository root)",
    )
    shell_parser.add_argument(
        "--env",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Environment variables to inject into the container",
    )
    shell_parser.add_argument(
        "--docker-arg",
        action="append",
        default=[],
        help="Raw flags forwarded to docker run",
    )
    shell_parser.add_argument(
        "--user",
        default=None,
        help="Override the user that the container executes as",
    )
    shell_parser.add_argument(
        "command",
        nargs=argparse.REMAINDER,
        help="Command to execute inside the container (default: bash)",
    )

    return parser


def ensure_docker_available() -> None:
    """Raise a friendly error if Docker is not installed or accessible."""

    if shutil.which("docker") is None:
        raise DockerError(
            "Docker executable not found. Install Docker or ensure it is on PATH."
        )


def run_command(command: List[str], *, check: bool = True) -> None:
    """Execute a subprocess command and optionally raise when it fails."""

    logging.debug("Running command: %s", " ".join(shlex.quote(part) for part in command))
    completed = subprocess.run(command, check=False)
    if check and completed.returncode != 0:
        raise DockerError(
            f"Command exited with status {completed.returncode}: {' '.join(command)}"
        )


def handle_build(args: argparse.Namespace) -> None:
    ensure_docker_available()

    command = [
        "docker",
        "build",
        "--file",
        args.file,
        "--tag",
        args.tag,
    ]

    if args.platform:
        command.extend(["--platform", args.platform])

    for build_arg in args.build_arg:
        command.extend(["--build-arg", build_arg])

    for label in args.label:
        command.extend(["--label", label])

    if args.no_cache:
        command.append("--no-cache")

    command.append(args.context)

    run_command(command)

    if args.push:
        run_command(["docker", "push", args.tag])


def _split_key_value(pairs: Iterable[str]) -> list[str]:
    parsed: list[str] = []
    for pair in pairs:
        if "=" not in pair:
            raise DockerError(f"Expected KEY=VALUE format, received '{pair}'")
        parsed.append(pair)
    return parsed


def handle_shell(args: argparse.Namespace) -> None:
    ensure_docker_available()

    command: List[str] = [
        "docker",
        "run",
        "--rm",
        "-it",
    ]

    if args.user:
        command.extend(["--user", args.user])

    command.extend(["-v", f"{args.mount}:/workspace"])
    command.extend(["-w", "/workspace"])

    command.extend(args.docker_arg or [])

    for env_pair in _split_key_value(args.env):
        command.extend(["-e", env_pair])

    command.append(args.image)

    inner_command = args.command if args.command else ["/bin/bash"]
    # argparse.REMAINDER includes the separating "--"; drop it if present.
    if inner_command and inner_command[0] == "--":
        inner_command = inner_command[1:]

    command.extend(inner_command)

    run_command(command, check=False)


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format="%(message)s",
    )

    try:
        if args.command == "build":
            handle_build(args)
        elif args.command == "shell":
            handle_shell(args)
        else:
            parser.error(f"Unhandled command: {args.command}")
    except DockerError as exc:  # pragma: no cover - CLI surfaced errors
        logging.error(str(exc))
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
