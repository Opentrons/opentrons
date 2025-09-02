# noqa: D100

import pytest

from opentrons_shared_data.labware import list_definitions as list_labware_definitions

from opentrons_shared_data.labware.default_labware_versions import (
    _parse_json_from_filesystem,
    KNOWN_EXCEPTIONS_FOR_TESTS,
    get_standard_labware_default_version,
)

_TEST_DEFAULT_LABWARE_VERSIONS = {
    (1, 100): {
        "well_plate_a": 3,
    },
    (1, 110): {
        "well_plate_b": 4,
    },
    (1, 120): {
        "well_plate_a": 5,
        "well_plate_b": 6,
    },
}


def _get_available_load_names_and_highest_versions() -> list[tuple[str, int]]:
    """Returns the highest available version of each labware in shared-data."""
    highest_version_by_load_name: dict[str, int] = {}

    for load_name, version, _ in list_labware_definitions():
        if (
            load_name not in highest_version_by_load_name
            or version > highest_version_by_load_name[load_name]
        ):
            highest_version_by_load_name[load_name] = version

    return sorted(highest_version_by_load_name.items())


def _highest_possible_default_version(load_name: str) -> int:
    """Return the highest default version for a labware across all api levels"""
    versions_by_api = _parse_json_from_filesystem()
    return max(
        (
            labware_map[load_name]
            for labware_map in versions_by_api.values()
            if load_name in labware_map
        ),
        default=1,
    )


@pytest.mark.parametrize(
    ("api_version", "load_name", "expected_labware_version"),
    [
        # At 1.100, well_plate_a upgrades to 3.
        ((1, 99), "well_plate_a", 1),
        ((1, 99), "well_plate_b", 1),
        ((1, 99), "well_plate_c", 1),
        ((1, 100), "well_plate_a", 3),
        ((1, 100), "well_plate_b", 1),
        ((1, 100), "well_plate_c", 1),
        # At 1.110, well_plate_b upgrades to 4.
        ((1, 109), "well_plate_a", 3),
        ((1, 109), "well_plate_b", 1),
        ((1, 109), "well_plate_c", 1),
        ((1, 110), "well_plate_a", 3),
        ((1, 110), "well_plate_b", 4),
        ((1, 110), "well_plate_c", 1),
        # At 1.120, well_plate_a upgrades to 5 and well_plate_b upgrades to 6.
        ((1, 119), "well_plate_a", 3),
        ((1, 119), "well_plate_b", 4),
        ((1, 119), "well_plate_c", 1),
        ((1, 120), "well_plate_a", 5),
        ((1, 120), "well_plate_b", 6),
        ((1, 120), "well_plate_c", 1),
        # Higher versions are the same as the highest-defined version, in this case 1.120.
        ((1, 121), "well_plate_a", 5),
        ((1, 121), "well_plate_b", 6),
        ((1, 121), "well_plate_c", 1),
    ],
)
def test_get_standard_labware_default_version(
    api_version: tuple[int, int], load_name: str, expected_labware_version: int
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
        ), f"Expected version {highest_available_version} of {load_name} to be included in some apiLevel. See DEFAULT_LABWARE_VERSIONS."
    else:
        assert (
            _highest_possible_default_version(load_name) != highest_available_version
        ), f"{load_name} is included in KNOWN_EXCEPTIONS_FOR_TESTS but it no longer needs to be?"
