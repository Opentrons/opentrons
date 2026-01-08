# noqa: D100

import pytest

from opentrons_shared_data.labware import list_definitions as list_labware_definitions

from opentrons.protocol_api.core.engine._default_labware_versions import (
    DEFAULT_LABWARE_VERSIONS,
    KNOWN_EXCEPTIONS_FOR_TESTS,
    get_standard_labware_default_version,
)
from opentrons.protocols.api_support.types import APIVersion

_TEST_DEFAULT_LABWARE_VERSIONS = {
    APIVersion(1, 100): {
        "well_plate_a": 3,
    },
    APIVersion(1, 110): {
        "well_plate_b": 4,
    },
    APIVersion(1, 120): {
        "well_plate_a": 5,
        "well_plate_b": 6,
    },
}


def _get_available_load_names_and_highest_versions() -> list[tuple[str, int]]:
    highest_available_version_by_load_name: dict[str, int] = {}
    for load_name, version, _ in list_labware_definitions():
        if (
            load_name not in highest_available_version_by_load_name
            or version > highest_available_version_by_load_name[load_name]
        ):
            highest_available_version_by_load_name[load_name] = version
    return sorted(highest_available_version_by_load_name.items())


def _highest_possible_default_version(load_name: str) -> int:
    """For a given labware, return the highest version that will ever be loaded by default, across all apiLevels."""
    default_versions_for_this_labware = [
        default_versions_by_load_name[load_name]
        for default_versions_by_load_name in DEFAULT_LABWARE_VERSIONS.values()
        if load_name in default_versions_by_load_name
    ]
    return max(default_versions_for_this_labware, default=1)


@pytest.mark.parametrize(
    ("api_version", "load_name", "expected_labware_version"),
    [
        # At 1.100, well_plate_a upgrades to 3.
        (APIVersion(1, 99), "well_plate_a", 1),
        (APIVersion(1, 99), "well_plate_b", 1),
        (APIVersion(1, 99), "well_plate_c", 1),
        (APIVersion(1, 100), "well_plate_a", 3),
        (APIVersion(1, 100), "well_plate_b", 1),
        (APIVersion(1, 100), "well_plate_c", 1),
        # At 1.110, well_plate_b upgrades to 4.
        (APIVersion(1, 109), "well_plate_a", 3),
        (APIVersion(1, 109), "well_plate_b", 1),
        (APIVersion(1, 109), "well_plate_c", 1),
        (APIVersion(1, 110), "well_plate_a", 3),
        (APIVersion(1, 110), "well_plate_b", 4),
        (APIVersion(1, 110), "well_plate_c", 1),
        # At 1.120, well_plate_a upgrades to 5 and well_plate_b upgrades to 6.
        (APIVersion(1, 119), "well_plate_a", 3),
        (APIVersion(1, 119), "well_plate_b", 4),
        (APIVersion(1, 119), "well_plate_c", 1),
        (APIVersion(1, 120), "well_plate_a", 5),
        (APIVersion(1, 120), "well_plate_b", 6),
        (APIVersion(1, 120), "well_plate_c", 1),
        # Higher versions are the same as the highest-defined version, in this case 1.120.
        (APIVersion(1, 121), "well_plate_a", 5),
        (APIVersion(1, 121), "well_plate_b", 6),
        (APIVersion(1, 121), "well_plate_c", 1),
    ],
)
def test_get_standard_labware_default_version(
    api_version: APIVersion, load_name: str, expected_labware_version: int
) -> None:
    """Test the logic for resolving a single labware's version at an arbitrary api_version."""
    assert (
        get_standard_labware_default_version(
            api_version, load_name, _TEST_DEFAULT_LABWARE_VERSIONS
        )
        == expected_labware_version
    )


@pytest.mark.parametrize(
    ("load_name", "highest_available_version"),
    _get_available_load_names_and_highest_versions(),
)
def test_default_labware_version_coverage(
    load_name: str, highest_available_version: int
) -> None:
    """When new labware versions are added, make sure they're included in some apiLevel."""
    if load_name not in KNOWN_EXCEPTIONS_FOR_TESTS:
        assert (
            _highest_possible_default_version(load_name) == highest_available_version
        ), (
            f"Expected version {highest_available_version} of {load_name} to be included in some apiLevel. See DEFAULT_LABWARE_VERSIONS."
        )
    else:
        assert (
            _highest_possible_default_version(load_name) != highest_available_version
        ), (
            f"{load_name} is included in KNOWN_EXCEPTIONS_FOR_TESTS but it no longer needs to be?"
        )
