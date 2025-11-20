# /// script
# requires-python = "==3.10.*"
# dependencies = [
#     "rich",
# ]
# ///

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

from rich.console import Console  # type: ignore
from rich.panel import Panel  # type: ignore
from rich.table import Table  # type: ignore
from rich import box  # type: ignore

console = Console()

REPO_ROOT = Path(__file__).resolve().parent.parent

FileExtractor = Callable[[str], str]

_file_cache: dict[str, str] = {}


def read_repo_file(relative_path: str) -> str:
    """Read a file relative to the repo root with simple caching."""
    if relative_path not in _file_cache:
        path = REPO_ROOT / relative_path
        if not path.exists():
            raise RuntimeError(f"Missing file: {relative_path}")
        _file_cache[relative_path] = path.read_text(encoding="utf-8")
    return _file_cache[relative_path]


@dataclass
class VersionCheck:
    name: str
    path: str
    extractor: FileExtractor


@dataclass
class CheckResult:
    name: str
    path: str
    value: Optional[str] = None
    error: Optional[str] = None


def extract_command_schema_version(_path: str) -> str:
    schema_dir = REPO_ROOT / _path
    if not schema_dir.is_dir():
        raise RuntimeError("Schema directory not found")
    versions: list[int] = []
    for schema_file in schema_dir.glob("*.json"):
        try:
            versions.append(int(schema_file.stem))
        except ValueError:
            continue
    if not versions:
        raise RuntimeError("No schema JSON files discovered")
    latest_version = max(versions)
    return str(latest_version)


def extract_max_supported_api(path: str) -> str:
    content = read_repo_file(path)
    match = re.search(
        r"MAX_SUPPORTED_VERSION\s*=\s*APIVersion\(\s*(\d+)\s*,\s*(\d+)\s*\)",
        content,
    )
    if not match:
        raise RuntimeError("MAX_SUPPORTED_VERSION not found")
    major, minor = match.groups()
    return f"{major}.{minor}"


def extract_regex_single(path: str, pattern: str, group_index: int = 1) -> str:
    content = read_repo_file(path)
    match = re.search(pattern, content, re.MULTILINE)
    if not match:
        raise RuntimeError(f"Pattern not found: {pattern}")
    groups = match.groups()
    if not groups:
        return match.group(0)
    return match.group(group_index)


def extract_designer_versions(path: str) -> str:
    content = read_repo_file(path)
    matches = re.findall(
        r"designerApplication:\s*{[^}]*?version:\s*'([^']+)'",
        content,
        re.DOTALL,
    )
    if not matches:
        raise RuntimeError("designerApplication version not located")
    unique_values = sorted(set(matches))
    return ", ".join(unique_values)


def extract_command_schema_ids(path: str) -> str:
    content = read_repo_file(path)
    matches = re.findall(r"commandSchemaId:\s*'([^']+)'", content)
    if not matches:
        raise RuntimeError("commandSchemaId not found")
    unique_values = sorted(set(matches))
    return ", ".join(unique_values)


def extract_command_schema_latest(path: str) -> str:
    content = read_repo_file(path)
    match = re.search(r"commandSchemaLatest\s*=\s*commandSchemaV(\d+)", content)
    if not match:
        raise RuntimeError("commandSchemaLatest assignment not found")
    return match.group(1)


def run_check(check: VersionCheck) -> CheckResult:
    result = CheckResult(name=check.name, path=check.path)
    try:
        result.value = check.extractor(check.path)
    except Exception as error:  # pragma: no cover - best effort reporting
        result.error = str(error)
    return result


def main() -> None:
    checks = [
        VersionCheck(
            name="Command schema file version",
            path="shared-data/command/schemas",
            extractor=extract_command_schema_version,
        ),
        VersionCheck(
            name="Command schema commandSchemaLatest export",
            path="shared-data/command/index.ts",
            extractor=extract_command_schema_latest,
        ),
        VersionCheck(
            name="Highest supported API version",
            path="api/src/opentrons/protocols/api_support/definitions.py",
            extractor=extract_max_supported_api,
        ),
        VersionCheck(
            name="Quick Transfer designerApplication version",
            path="app/src/organisms/ODD/QuickTransferFlow/utils/createQuickTransferFile.ts",
            extractor=extract_designer_versions,
        ),
        VersionCheck(
            name="Protocol Designer PD_APPLICATION_VERSION",
            path="step-generation/src/utils/pythonFileUtils.ts",
            extractor=lambda p: extract_regex_single(
                p, r"export const PD_APPLICATION_VERSION = '([^']+)'"
            ),
        ),
        VersionCheck(
            name="Protocol Designer required API version",
            path="step-generation/src/utils/pythonFileUtils.ts",
            extractor=lambda p: extract_regex_single(
                p, r"export const PAPI_VERSION = '([^']+)'"
            ),
        ),
        VersionCheck(
            name="Oldest Robot Stack for PD",
            path="protocol-designer/vite.config.mts",
            extractor=lambda p: extract_regex_single(
                p, r"const REQUIRED_APP_VERSION = '([^']+)'"
            ),
        ),
        VersionCheck(
            name="Protocol Designer JSON command schema id",
            path="protocol-designer/src/file-data/selectors/fileCreator.ts",
            extractor=extract_command_schema_ids,
        ),
        VersionCheck(
            name="Quick Transfer JSON command schema id",
            path="app/src/organisms/ODD/QuickTransferFlow/utils/createQuickTransferFile.ts",
            extractor=extract_command_schema_ids,
        ),
    ]

    results = [run_check(check) for check in checks]
    table = Table(box=box.SIMPLE_HEAVY)
    table.add_column("Name")
    table.add_column("Path")
    table.add_column("Value", style="cyan")

    for result in results:
        display_value = (
            result.value if result.value is not None else (result.error or "—")
        )
        if result.error:
            display_value = f"Error: {result.error}"
        table.add_row(result.name, result.path, display_value)

    console.print(Panel(table, title="Release Version Report", border_style="blue"))


if __name__ == "__main__":
    main()
