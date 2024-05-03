import os
from pathlib import Path
from typing import Optional

from rich.console import Console
from rich.panel import Panel

from automation.data.protocol import Protocol
from automation.data.protocol_with_overrides import ProtocolWithOverrides
from automation.data.protocols import Protocols
from automation.data.protocols_with_overrides import ProtocolsWithOverrides


class ProtocolRegistry:
    def __init__(self) -> None:
        self.protocols: Protocols = Protocols()
        self.protocols_with_overrides: ProtocolsWithOverrides = ProtocolsWithOverrides()
        self.protocols_to_test: Optional[list[Protocol]] = self._what_protocols()

    def _what_protocols(self) -> Optional[list[Protocol]]:
        protocol_names: Optional[str] = os.environ.get("APP_ANALYSIS_TEST_PROTOCOLS")
        override_protocol_names: Optional[str] = os.environ.get("APP_ANALYSIS_TEST_PROTOCOLS_WITH_OVERRIDES")
        protocols_to_test: list[Protocol] = []
        if protocol_names:
            for protocol_name in [x.strip() for x in protocol_names.split(",")]:
                protocol: Protocol = getattr(self.protocols, protocol_name)  # raises
                protocols_to_test.append(protocol)
        if override_protocol_names:
            for protocol_with_overrides__name in [x.strip() for x in override_protocol_names.split(",")]:
                protocol_with_overrides: ProtocolWithOverrides = getattr(
                    self.protocols_with_overrides, protocol_with_overrides__name
                )  # raises
                if protocol_with_overrides.protocols is not None:
                    protocols_to_test.extend(protocol_with_overrides.protocols)
        if protocols_to_test == []:
            return None
        return protocols_to_test

    def all_defined_protocols(self) -> list[Protocol]:
        return [getattr(self.protocols, prop) for prop in dir(self.protocols) if "__" not in prop]

    def all_defined_protocols_with_overrides(self) -> list[ProtocolWithOverrides]:
        return [getattr(self.protocols_with_overrides, prop) for prop in dir(self.protocols_with_overrides) if "__" not in prop]


def all_stems() -> set[str]:
    dir_path = Path(Path(__file__).resolve().parent.parent.parent, os.getenv("FILES_FOLDER", "files"), "protocols")
    file_stems = {file.stem for file in dir_path.glob("*.py")}
    return file_stems


def main() -> None:
    console = Console()
    protocol_registry = ProtocolRegistry()
    console.print("protocols for APP_ANALYSIS_TEST_PROTOCOLS")
    console.print(Panel("Formatted for .env"))
    regular_stems = sorted([p.file_stem for p in protocol_registry.all_defined_protocols()])
    console.print('APP_ANALYSIS_TEST_PROTOCOLS="')
    console.print(",\n".join(regular_stems))
    console.print('"')
    override_stems = sorted([p.file_stem for p in protocol_registry.all_defined_protocols_with_overrides()])
    console.print('APP_ANALYSIS_TEST_PROTOCOLS_WITH_OVERRIDES="')
    console.print(",\n".join(override_stems))
    console.print('"')

    all_files = all_stems()
    filtered_stems = {stem for stem in all_files if "overrides" not in stem.lower()}
    found_override_stems = {stem for stem in all_files if "overrides" in stem.lower()}
    # Finding and displaying differences
    differences = filtered_stems - set(regular_stems)
    if differences:
        console.print(f"Stems in actual files not in mapping: {differences}")
    else:
        console.print("No differences between files and mapping.")

    differences = found_override_stems - set(override_stems)
    if differences:
        console.print(f"Override Stems in actual files not in mapping: {differences}")
    else:
        console.print("No differences between actual override protocols and the mapping.")


if __name__ == "__main__":
    main()
