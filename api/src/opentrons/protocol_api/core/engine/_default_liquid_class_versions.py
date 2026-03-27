"""The versions of standard liquid classes that the Protocol API should load by default."""

from typing import TypeAlias

from opentrons.protocols.api_support.types import APIVersion

DefaultLiquidClassVersions: TypeAlias = dict[APIVersion, dict[str, int]]


# This:
#
# {
#     APIVersion(2, 100): {
#         "foo_liquid": 3,
#     },
#     APIVersion(2, 105): {
#         "foo_liquid": 7
#     }
# }
#
# Means this:
#
# apiLevels        name              Default liquid class version
# ---------------------------------------------------------------
# <2.100           foo_liquid        1
# >=2.100,<2.105   foo_liquid        3
# >=2.105          foo_liquid        7
# [any]            [anything else]   1
DEFAULT_LIQUID_CLASS_VERSIONS: DefaultLiquidClassVersions = {
    APIVersion(2, 26): {
        "ethanol_80": 2,
        "glycerol_50": 2,
        "water": 2,
    },
    APIVersion(2, 27): {
        "ethanol_80": 2,
        "glycerol_50": 2,
        "water": 3,
    },
}


def get_liquid_class_version(
    api_version: APIVersion,
    liquid_class_name: str,
) -> int:
    """Return what version of a liquid class the Protocol API should load by default."""
    default_lc_versions_newest_to_oldest = sorted(
        DEFAULT_LIQUID_CLASS_VERSIONS.items(), key=lambda kv: kv[0], reverse=True
    )
    for (
        breakpoint_api_version,
        breakpoint_liquid_class_versions,
    ) in default_lc_versions_newest_to_oldest:
        if (
            api_version >= breakpoint_api_version
            and liquid_class_name in breakpoint_liquid_class_versions
        ):
            return breakpoint_liquid_class_versions[liquid_class_name]

    return 1
