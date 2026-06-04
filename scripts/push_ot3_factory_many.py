#!/usr/bin/env python3
"""Push OT3 software to several hosts by running the existing make target."""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Optional, Sequence


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MAKE_DIR = "hardware-testing"
DEFAULT_TARGET = "push-ot3-factory"
DEFAULT_SHARED_LINKS = (
    ".git",
    "node_modules",
    "api/.venv",
    "robot-server/.venv",
    "server-utils/.venv",
    "update-server/.venv",
    "system-server/.venv",
    "hardware/.venv",
    "usb-bridge/.venv",
    "shared-data/python/.venv",
    "hardware-testing/.venv",
)
PIPENV_VENV_CACHE = {}
RSYNC_EXCLUDES = (
    ".git/",
    "node_modules/",
    ".venv/",
    "__pycache__/",
    ".mypy_cache/",
    ".pytest_cache/",
    ".ruff_cache/",
    ".tox/",
    "build/",
    "dist/",
    "*.egg-info/",
    "*.pyc",
    ".coverage",
    "coverage.xml",
)


@dataclass(frozen=True)
class PushResult:
    """The result of one host push."""

    host: str
    command: Sequence[str]
    log_path: Path
    returncode: int
    seconds: float


def split_hosts(values: Iterable[str]) -> List[str]:
    """Split host arguments on commas or whitespace while preserving order."""

    hosts: List[str] = []
    for value in values:
        for host in re.split(r"[\s,]+", value.strip()):
            if host:
                hosts.append(host)
    return unique(hosts)


def unique(values: Iterable[str]) -> List[str]:
    """Return unique values in their first-seen order."""

    seen = set()
    output: List[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            output.append(value)
    return output


def load_hosts_file(path: Path) -> List[str]:
    """Load hosts from JSON or a text file."""

    text = path.read_text(encoding="utf-8")
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        lines = []
        for line in text.splitlines():
            lines.append(line.split("#", 1)[0])
        return split_hosts(lines)

    if isinstance(data, list):
        return split_hosts(str(value) for value in data)

    if isinstance(data, dict):
        if "ip_address_list" in data:
            data = data["ip_address_list"]
        elif "hosts" in data:
            data = data["hosts"]

        if isinstance(data, dict):
            return split_hosts(str(value) for value in data.keys())
        if isinstance(data, list):
            return split_hosts(str(value) for value in data)

    raise ValueError(
        f"{path} must be a text host list, a JSON list, or a JSON object "
        "with hosts/ip_address_list."
    )


def sanitize_host(host: str) -> str:
    """Create a filesystem-safe host label."""

    label = re.sub(r"[^A-Za-z0-9_.-]+", "_", host).strip("._-")
    if label in ("", ".", ".."):
        return "host"
    return label


def quote_command(command: Sequence[str]) -> str:
    """Format a command for human-readable logs."""

    return " ".join(shlex.quote(part) for part in command)


def format_seconds(seconds: float) -> str:
    """Format a short elapsed time."""

    minutes, secs = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes}m {secs}s"
    if minutes:
        return f"{minutes}m {secs}s"
    return f"{secs}s"


def resolve_log_dir(path: Optional[Path], timestamp: str) -> Path:
    """Choose a log directory."""

    if path is not None:
        return path.expanduser().resolve()
    return Path(tempfile.gettempdir()) / "opentrons-ot3-push-logs" / timestamp


def resolve_work_root(path: Optional[Path], timestamp: str) -> Path:
    """Choose an isolated workspace root."""

    if path is not None:
        return path.expanduser().resolve()
    return Path(tempfile.gettempdir()) / "opentrons-ot3-push-workspaces" / timestamp


def run_checked(command: Sequence[str]) -> str:
    """Run a local helper command and return its combined output."""

    try:
        result = subprocess.run(
            list(command),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
        )
    except FileNotFoundError as error:
        raise RuntimeError(f"Required command not found: {command[0]}") from error

    if result.returncode != 0:
        raise RuntimeError(
            "Command failed:\n"
            f"  {quote_command(command)}\n"
            f"Output:\n{result.stdout}"
        )
    return result.stdout


def find_pipenv_venv(project_dir: Path) -> Optional[Path]:
    """Find an existing pipenv virtualenv for a project directory."""

    cached = PIPENV_VENV_CACHE.get(project_dir)
    if cached is not None:
        return cached

    try:
        result = subprocess.run(
            [sys.executable, "-m", "pipenv", "--venv"],
            cwd=str(project_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        PIPENV_VENV_CACHE[project_dir] = None
        return None

    if result.returncode != 0:
        PIPENV_VENV_CACHE[project_dir] = None
        return None

    for line in reversed(result.stdout.splitlines()):
        candidate = Path(line.strip()).expanduser()
        if candidate.exists():
            PIPENV_VENV_CACHE[project_dir] = candidate
            return candidate

    PIPENV_VENV_CACHE[project_dir] = None
    return None


def find_shared_link_source(source_root: Path, relative: str) -> Optional[Path]:
    """Find the source path to symlink for an isolated workspace."""

    source = source_root / relative
    if source.exists():
        return source
    if relative.endswith(".venv"):
        return find_pipenv_venv(source.parent)
    return None


def symlink_if_present(source_root: Path, workspace: Path, relative: str) -> None:
    """Symlink a shared local resource into an isolated workspace."""

    source = find_shared_link_source(source_root, relative)
    if source is None:
        return
    destination = workspace / relative
    if destination.exists() or destination.is_symlink():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.symlink_to(source, target_is_directory=source.is_dir())


def prepare_isolated_workspace(
    source_root: Path,
    work_root: Path,
    host: str,
) -> Path:
    """Copy source files and link heavy local resources for one host."""

    workspace = work_root / sanitize_host(host)
    if workspace.exists():
        shutil.rmtree(str(workspace))
    workspace.parent.mkdir(parents=True, exist_ok=True)

    command = ["rsync", "-a", "--delete"]
    for pattern in RSYNC_EXCLUDES:
        command.extend(["--exclude", pattern])
    command.extend([str(source_root) + "/", str(workspace) + "/"])
    print(f"[{host}] preparing isolated workspace: {workspace}", flush=True)
    run_checked(command)

    for relative in DEFAULT_SHARED_LINKS:
        symlink_if_present(source_root, workspace, relative)
    return workspace


def build_make_command(
    host: str,
    make_dir: str,
    target: str,
    make_vars: Sequence[str],
    workspace: Path,
) -> List[str]:
    """Build the make command for one host."""

    make_dir_path = Path(make_dir)
    if not make_dir_path.is_absolute():
        make_dir_path = workspace / make_dir_path
    return ["make", "-C", str(make_dir_path), target, f"host={host}", *make_vars]


async def run_push(
    host: str,
    command: Sequence[str],
    log_path: Path,
    workspace: Path,
) -> PushResult:
    """Run one make push and stream output with a host prefix."""

    start = time.monotonic()
    log_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"[{host}] starting: {quote_command(command)}", flush=True)

    with log_path.open("w", encoding="utf-8") as log_file:
        log_file.write(f"$ {quote_command(command)}\n")
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=str(workspace),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        assert process.stdout is not None
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="replace").rstrip()
            log_file.write(text + "\n")
            print(f"[{host}] {text}", flush=True)

        returncode = await process.wait()
        elapsed = time.monotonic() - start
        log_file.write(f"\nexit code: {returncode}\n")
        log_file.write(f"elapsed: {format_seconds(elapsed)}\n")

    status = "finished" if returncode == 0 else "failed"
    print(
        f"[{host}] {status} in {format_seconds(elapsed)} " f"(exit {returncode})",
        flush=True,
    )
    return PushResult(host, command, log_path, returncode, elapsed)


async def run_all(
    hosts: Sequence[str],
    make_dir: str,
    target: str,
    make_vars: Sequence[str],
    workspaces: Sequence[Path],
    log_dir: Path,
    jobs: int,
) -> List[PushResult]:
    """Run all host pushes with a concurrency limit."""

    semaphore = asyncio.Semaphore(jobs)

    async def guarded_run(host: str, workspace: Path) -> PushResult:
        async with semaphore:
            command = build_make_command(host, make_dir, target, make_vars, workspace)
            log_path = log_dir / f"{sanitize_host(host)}.log"
            return await run_push(host, command, log_path, workspace)

    return await asyncio.gather(
        *(guarded_run(host, workspace) for host, workspace in zip(hosts, workspaces))
    )


def build_parser() -> argparse.ArgumentParser:
    """Create the CLI parser."""

    parser = argparse.ArgumentParser(
        description=(
            "Run make push-ot3-factory host=... for multiple OT3 hosts. "
            "By default, each host uses an isolated source copy so concurrent "
            "make processes do not race on build artifacts."
        )
    )
    parser.add_argument(
        "hosts",
        nargs="*",
        help="Hostnames/IPs. Comma-separated values are accepted.",
    )
    parser.add_argument(
        "--hosts-file",
        action="append",
        type=Path,
        default=[],
        help=(
            "Text or JSON file of hosts. Existing make_push.py-style "
            "ip_address_list JSON is supported."
        ),
    )
    parser.add_argument(
        "-j",
        "--jobs",
        type=int,
        default=None,
        help="Maximum concurrent pushes. Defaults to min(4, host count).",
    )
    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET,
        help=f"Make target to run. Default: {DEFAULT_TARGET}.",
    )
    parser.add_argument(
        "--make-dir",
        default=DEFAULT_MAKE_DIR,
        help=f"Directory passed to make -C. Default: {DEFAULT_MAKE_DIR}.",
    )
    parser.add_argument(
        "--make-var",
        action="append",
        default=[],
        metavar="NAME=VALUE",
        help="Extra make variable. Repeat for ssh_key=..., OPENTRONS_PROJECT=..., etc.",
    )
    parser.add_argument(
        "--mode",
        choices=("isolated", "shared"),
        default="isolated",
        help=(
            "isolated copies the repo per host; shared runs in the current tree. "
            "Default: isolated."
        ),
    )
    parser.add_argument(
        "--work-root",
        type=Path,
        default=None,
        help="Where isolated workspaces are created.",
    )
    parser.add_argument(
        "--keep-workspaces",
        action="store_true",
        help="Keep isolated workspaces after the run.",
    )
    parser.add_argument(
        "--log-dir",
        type=Path,
        default=None,
        help="Where per-host logs are written.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned commands without preparing workspaces or running make.",
    )
    return parser


def collect_hosts(args: argparse.Namespace) -> List[str]:
    """Collect hosts from argv and files."""

    hosts = split_hosts(args.hosts)
    for hosts_file in args.hosts_file:
        hosts.extend(load_hosts_file(hosts_file.expanduser()))
    return unique(hosts)


def validate_args(parser: argparse.ArgumentParser, args: argparse.Namespace) -> None:
    """Validate CLI options."""

    for make_var in args.make_var:
        if "=" not in make_var:
            parser.error(f"--make-var must look like NAME=VALUE: {make_var}")
    if args.jobs is not None and args.jobs < 1:
        parser.error("--jobs must be at least 1")


def print_plan(
    hosts: Sequence[str],
    make_dir: str,
    target: str,
    make_vars: Sequence[str],
    jobs: int,
    mode: str,
    log_dir: Path,
) -> None:
    """Print the selected run plan."""

    print("OT3 multi-push plan")
    print(f"  hosts: {', '.join(hosts)}")
    print(f"  target: {target}")
    print(f"  make dir: {make_dir}")
    print(f"  jobs: {jobs}")
    print(f"  mode: {mode}")
    print(f"  logs: {log_dir}")
    if make_vars:
        print(f"  extra make vars: {' '.join(make_vars)}")
    if mode == "shared" and jobs > 1:
        print(
            "  warning: shared mode with jobs > 1 can race because make "
            "targets create and delete local build artifacts."
        )


def print_summary(results: Sequence[PushResult], log_dir: Path) -> None:
    """Print run results."""

    print("\nSummary")
    for result in results:
        status = "OK" if result.returncode == 0 else f"FAILED ({result.returncode})"
        print(
            f"  {result.host}: {status}, "
            f"{format_seconds(result.seconds)}, log: {result.log_path}"
        )
    print(f"\nLogs: {log_dir}")


def main(argv: Optional[Sequence[str]] = None) -> int:
    """CLI entrypoint."""

    parser = build_parser()
    args = parser.parse_args(argv)
    validate_args(parser, args)

    try:
        hosts = collect_hosts(args)
    except (OSError, ValueError) as error:
        parser.error(str(error))

    if not hosts:
        parser.error("at least one host or --hosts-file is required")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_dir = resolve_log_dir(args.log_dir, timestamp)
    work_root = resolve_work_root(args.work_root, timestamp)
    jobs = args.jobs if args.jobs is not None else min(4, len(hosts))

    print_plan(
        hosts, args.make_dir, args.target, args.make_var, jobs, args.mode, log_dir
    )

    if args.dry_run:
        workspace = REPO_ROOT
        for host in hosts:
            command = build_make_command(
                host,
                args.make_dir,
                args.target,
                args.make_var,
                workspace,
            )
            print(f"[{host}] dry-run: {quote_command(command)}")
        return 0

    workspaces: List[Path]
    try:
        if args.mode == "isolated":
            workspaces = [
                prepare_isolated_workspace(REPO_ROOT, work_root, host) for host in hosts
            ]
        else:
            workspaces = [REPO_ROOT for _host in hosts]

        results = asyncio.run(
            run_all(
                hosts,
                args.make_dir,
                args.target,
                args.make_var,
                workspaces,
                log_dir,
                jobs,
            )
        )
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        return 130
    except RuntimeError as error:
        print(f"\n{error}", file=sys.stderr)
        return 1
    finally:
        if args.mode == "isolated" and not args.keep_workspaces:
            shutil.rmtree(str(work_root), ignore_errors=True)

    print_summary(results, log_dir)
    if any(result.returncode != 0 for result in results):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
