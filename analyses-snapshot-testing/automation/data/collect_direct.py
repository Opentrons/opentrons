import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from rich import print

from automation.data.protocol import (
    GENERATED_PROTOCOLS_FOLDER,
    MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOL_DESIGNER_PROTOCOLS_FOLDER,
    PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOLS_FOLDER,
)


@dataclass
class ProtocolAudit:
    stem: str
    filename: str
    ext: str
    version: Optional[str]
    expected: Optional[str]
    folder: Path


def extract_version(filename: str) -> Optional[str]:
    match = re.search(r"_v(\d+\.\d+)_", filename)
    return match.group(1) if match else None


def extract_expected(filename: str) -> Optional[str]:
    # _s_ for success, _x_ for fail (case insensitive)
    lower_filename = filename.lower()
    if "_s_" in lower_filename:
        return "success"
    if "_x_" in lower_filename:
        return "fail"
    return None


def collect_protocols(dirs: List[Path]) -> List[ProtocolAudit]:
    audits = []
    seen = set()  # Track unique file paths
    for directory in dirs:
        files = list(directory.glob("*.py")) + list(directory.glob("*.json"))
        print(f"Found {len(files)} files in [bold magenta]{directory.name}[/bold magenta]")
        for path in files:
            # Skip duplicates
            real_path = path.resolve()
            if real_path in seen:
                print(f"Skipping duplicate file!!! What???: {path}")
                continue
            seen.add(real_path)
            audits.append(
                ProtocolAudit(
                    stem=path.stem,
                    filename=path.name,
                    ext=path.suffix[1:],
                    version=extract_version(path.name),
                    expected=extract_expected(path.name),
                    folder=directory,
                )
            )
    return audits


def main():
    # Notice GENERATORS is not here.
    # make generate-protocols creates all the protocols in
    # GENERATED_PROTOCOLS_FOLDER
    # make protocol-info that runs this
    # also calls make generate-protocols
    dirs = [
        PROTOCOLS_FOLDER,
        PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
        GENERATED_PROTOCOLS_FOLDER,
        MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
        PROTOCOL_DESIGNER_PROTOCOLS_FOLDER,
    ]
    protocols = collect_protocols(dirs)
    total = len(protocols)
    print(f"Total protocols found: [bold green]{total}[/bold green]")


if __name__ == "__main__":
    main()
