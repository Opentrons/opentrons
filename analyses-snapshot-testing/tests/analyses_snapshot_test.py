import json
import os
from pathlib import Path
from typing import Any, List

import pytest
from automation.data.protocol import Protocol
from automation.data.protocol_registry import ProtocolRegistry
from citools.generate_analyses import ANALYSIS_SUFFIX, generate_analyses_from_test
from rich.console import Console
from syrupy.types import SerializableData

from tests.custom_json_snapshot_extension import CustomJSONSnapshotExtension

console = Console()


def protocols_under_test() -> List[Protocol]:
    "Use the PROTOCOL_NAMES and OVERRIDE_PROTOCOL_NAMES environment variables to determine which protocols to test."
    protocol_names = os.getenv("PROTOCOL_NAMES")
    override_protocol_names = os.getenv("OVERRIDE_PROTOCOL_NAMES")
    if not protocol_names:
        exit("PROTOCOL_NAMES environment variable not set.")
    if not override_protocol_names:
        exit("OVERRIDE_PROTOCOL_NAMES environment variable not set.")
    protocol_registry: ProtocolRegistry = ProtocolRegistry(protocol_names=protocol_names, override_protocol_names=override_protocol_names)
    if not protocol_registry.protocols_to_test:
        exit("No protocols were resolved from the protocol names provided. Exiting.")
    return protocol_registry.protocols_to_test


@pytest.fixture
def snapshot_custom(snapshot: SerializableData) -> SerializableData:
    return snapshot.with_defaults(extension_class=CustomJSONSnapshotExtension)


@pytest.fixture(scope="session")
def analyze_protocols() -> None:
    """Once for the session, generate analyses for all protocols to test."""
    tests = protocols_under_test()
    # !!!!! Docker Image with tag of ANALYSIS_REF must already be created
    analysis_ref = os.getenv("ANALYSIS_REF")
    if not analysis_ref:
        raise AssertionError("Environment variable ANALYSIS_REF not set.")
    else:
        generate_analyses_from_test(tag=analysis_ref, protocols=tests)


def sort_all_lists(d: Any, sort_key: str | None = None) -> Any:
    """Recursively sorts lists in a nested dictionary.

    :param d: The dictionary or list to sort.
    :param sort_key: The key to sort dictionaries on if they are in a list.
    """
    if isinstance(d, dict):
        return {k: sort_all_lists(v, sort_key) for k, v in d.items()}
    elif isinstance(d, list):
        # Sort each item in the list
        sorted_list = [sort_all_lists(x, sort_key) for x in d]
        # Try to sort the list if it contains comparable items
        try:
            if sort_key and all(isinstance(x, dict) and sort_key in x for x in sorted_list):
                return sorted(sorted_list, key=lambda x: x[sort_key])
            else:
                return sorted(sorted_list)
        except TypeError:
            # If items are not comparable, return the list as is
            return sorted_list
    else:
        return d


@pytest.mark.parametrize(
    "protocol",
    protocols_under_test(),
    ids=[x.short_sha for x in protocols_under_test()],
)
@pytest.mark.usefixtures("analyze_protocols")
def test_analysis_snapshot(snapshot_custom: SerializableData, protocol: Protocol) -> None:
    analysis_ref = os.getenv("ANALYSIS_REF")
    if not analysis_ref:
        raise AssertionError("Environment variable TARGET not set.")
    analysis = Path(
        Path(__file__).parent.parent,
        "analysis_results",
        f"{protocol.file_stem}_{analysis_ref}_{ANALYSIS_SUFFIX}",
    )
    console.print(f"Analysis file: {analysis}")
    if analysis.exists():
        with open(analysis, "r") as f:
            data = json.load(f)
            print(f"Test name: {protocol.file_stem}")
            data = sort_all_lists(data, sort_key="name")
        assert snapshot_custom(name=protocol.file_stem) == data
    else:
        raise AssertionError(f"Analysis file not found: {analysis}")
