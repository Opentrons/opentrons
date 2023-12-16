import json
import os
from pathlib import Path
from typing import Any, List

import pytest
from automation.data.protocol import Protocol
from automation.data.protocols import Protocols
from citools.generate_analyses import ANALYSIS_SUFFIX, generate_analyses_from_test
from syrupy.extensions.json import JSONSnapshotExtension
from syrupy.filters import props
from syrupy.types import SerializableData

# not included in the snapshot
exclude = props(
    "id",
    "createdAt",
    "startedAt",
    "completedAt",
    "lastModified",
    "created",
    "key",
    "pipetteId",
    "labwareId",
    "serialNumber",
    "moduleId",
    "liquidId",
)


@pytest.fixture
def snapshot_exclude(snapshot: SerializableData) -> SerializableData:
    return snapshot.with_defaults(exclude=exclude)


@pytest.fixture
def snapshot_json(snapshot_exclude: SerializableData) -> SerializableData:
    return snapshot_exclude.with_defaults(extension_class=JSONSnapshotExtension)


def what_protocols() -> List[Protocol]:
    protocols: Protocols = Protocols()
    protocols_to_test: str = os.getenv("APP_ANALYSIS_TEST_PROTOCOLS", "upload_protocol")
    tests: list[(Protocol)] = []
    for protocol_name in [x.strip() for x in protocols_to_test.split(",")]:
        tests.append((getattr(protocols, protocol_name)))
    return tests


@pytest.fixture(scope="session")
def analyze_protocols() -> None:
    """Use the environment variable to select which protocols are used in the test."""
    tests = what_protocols()
    # Generate target analyses
    if not tests:
        exit("No protocols to test.")
    # !!!!! Docker Image with tag of TARGET must already be created
    target = os.getenv("TARGET")
    if not target:
        raise AssertionError("Environment variable TARGET not set.")
    else:
        generate_analyses_from_test(tag=target, protocols=tests)


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


# Read in what protocols to test from the environment variable
# APP_ANALYSIS_TEST_PROTOCOLS
# Generate all the analyses for the target version of the Opentrons repository
# Compare the analyses to the snapshots


@pytest.mark.parametrize(
    "protocol",
    what_protocols(),
    ids=[x.file_name for x in what_protocols()],
)
def test_analysis_snapshot(analyze_protocols: None, snapshot_json: SerializableData, protocol: Protocol) -> None:
    target = os.getenv("TARGET")
    if not target:
        raise AssertionError("Environment variable TARGET not set.")
    analysis = Path(
        Path(__file__).parent.parent,
        "analysis_results",
        f"{protocol.file_name}_{target}_{ANALYSIS_SUFFIX}",
    )
    if analysis.exists():
        with open(analysis, "r") as f:
            data = json.load(f)
            print(f"Test name: {protocol.file_name}")
            data = sort_all_lists(data, sort_key="name")
        assert snapshot_json(name=protocol.file_name) == data
    else:
        raise AssertionError(f"Analysis file not found: {analysis}")
