"""The versions of standard labware that the Protocol API should load by default."""

import json
import functools
from pathlib import Path

from typing import TypeAlias
from opentrons.protocols.api_support.types import APIVersion


DefaultLabwareVersions: TypeAlias = dict[APIVersion, dict[str, int]]


DEFAULT_LABWARE_VERSIONS_FILE = Path(
    "../../labware/defaultLabwareVersions/default_labware_versions.json"
)


@functools.cache
def _parse_json_from_filesystem() -> DefaultLabwareVersions:
    with open(DEFAULT_LABWARE_VERSIONS_FILE) as file:
        raw_versions = json.load(file)

    # convert "2.14" to APIVersion(2, 14)
    return {
        APIVersion(*(map(int, version_str.split(".")))): labware_map
        for version_str, labware_map in raw_versions.items()
    }


# Labware where, for whatever reason, we don't want `opentrons.protocol_api` to load
# the latest available version.
#
# Typically, this is because the latest available version of the labware is some kind of
# unpublicized draft.
#
# Beware, though, that users can still load the unpublicized draft if they know how, e.g.
# by passing an explicit `version` arg to `ProtocolContext.load_labware()`.
# And non-`opentrons.protocol_api` code like Labware Library, Protocol Designer, and
# Quick Transfer will still use the unpublicized draft unless you exclude it through
# other means.
#
# This list should not be consumed by production code--it's only for the benefit of tests
# that make sure every labware is accounted for somehow.
KNOWN_EXCEPTIONS_FOR_TESTS: set[str] = {
    # Dev testing junk for labware schema 3, not things that users should ever load:
    "schema3test_96_well_aluminum_block",
    "schema3test_96_wellplate_200ul_pcr_full_skirt",
    "schema3test_aluminum_flat_bottom_plate",
    "schema3test_flex_96_tiprack_200ul",
    "schema3test_flex_96_tiprack_adapter",
    "schema3test_flex_tiprack_lid",
    "schema3test_tough_pcr_auto_sealing_lid",
    "schema3test_universal_flat_adapter",
    "schema3test_96_wellplate_360ul_flat",
}


def get_standard_labware_default_version(
    api_version: APIVersion,
    load_name: str,
    default_labware_versions: DefaultLabwareVersions | None = None,
) -> int:
    """Return what version of a standard labware the Protocol API should load by default.

    The `default_labware_versions` param is exposed for testability and should be left
    unspecified.
    """
    if default_labware_versions is None:
        default_labware_versions = _parse_json_from_filesystem()

    default_labware_versions_newest_to_oldest = sorted(
        default_labware_versions.items(), key=lambda kv: kv[0], reverse=True
    )
    for (
        breakpoint_api_version,
        breakpoint_labware_versions,
    ) in default_labware_versions_newest_to_oldest:
        if (
            api_version >= breakpoint_api_version
            and load_name in breakpoint_labware_versions
        ):
            return breakpoint_labware_versions[load_name]

    return 1
