import json
from pathlib import Path
from typing import Any

import pytest
from automation.analyze import gen_analyses_files
from automation.data.collect import protocols_under_test
from automation.data.protocol import Protocol
from citools.generate_analyses import ANALYSIS_SUFFIX
from rich.console import Console
from syrupy.types import SerializableData

from tests.custom_json_snapshot_extension import CustomJSONSnapshotExtension

console = Console()


@pytest.fixture
def snapshot_custom(snapshot: SerializableData) -> SerializableData:
    return snapshot.with_defaults(extension_class=CustomJSONSnapshotExtension)


@pytest.fixture(scope="session")
def analyze_protocols() -> None:
    """Once for the session, generate analyses for all protocols to test."""
    tests = protocols_under_test()
    gen_analyses_files(
        protocols=tests,
    )


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
    analysis = Path(
        Path(__file__).parent.parent,
        "analysis_results",
        f"{protocol.file_stem}_{ANALYSIS_SUFFIX}",
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
