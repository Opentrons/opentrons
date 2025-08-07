"""The versions of standard labware that the Protocol API should load by default."""

from typing import TypeAlias
from opentrons.protocols.api_support.types import APIVersion


DefaultLabwareVersions: TypeAlias = dict[APIVersion, dict[str, int]]


# This:
#
# {
#     APIVersion(2, 100): {
#         "foo_well_plate": 3,
#     },
#     APIVersion(2, 105): {
#         "foo_well_plate": 7
#     }
# }
#
# Means this:
#
# apiLevels        Load name         Default labware version
# ----------------------------------------------------------
# <2.100           foo_well_plate    1
# >=2.100,<2.105   foo_well_plate    3
# >=2.105          foo_well_plate    7
# [any]            [anything else]   1
DEFAULT_LABWARE_VERSIONS: DefaultLabwareVersions = {
    APIVersion(2, 14): {
        "armadillo_96_wellplate_200ul_pcr_full_skirt": 2,
        "biorad_384_wellplate_50ul": 2,
        "biorad_96_wellplate_200ul_pcr": 2,
        "corning_12_wellplate_6.9ml_flat": 2,
        "corning_24_wellplate_3.4ml_flat": 2,
        "corning_384_wellplate_112ul_flat": 2,
        "corning_48_wellplate_1.6ml_flat": 2,
        "corning_6_wellplate_16.8ml_flat": 2,
        "corning_96_wellplate_360ul_flat": 2,
        "nest_1_reservoir_195ml": 2,
        "nest_96_wellplate_100ul_pcr_full_skirt": 2,
        "nest_96_wellplate_200ul_flat": 2,
        "nest_96_wellplate_2ml_deep": 2,
        "opentrons_24_aluminumblock_generic_2ml_screwcap": 2,
        "opentrons_96_aluminumblock_generic_pcr_strip_200ul": 2,
        "opentrons_96_wellplate_200ul_pcr_full_skirt": 2,
    },
    APIVersion(2, 23): {
        "agilent_1_reservoir_290ml": 2,
        "appliedbiosystemsmicroamp_384_wellplate_40ul": 2,
        "armadillo_96_wellplate_200ul_pcr_full_skirt": 3,
        "axygen_1_reservoir_90ml": 2,
        "biorad_384_wellplate_50ul": 3,
        "biorad_96_wellplate_200ul_pcr": 3,
        "corning_12_wellplate_6.9ml_flat": 3,
        "corning_24_wellplate_3.4ml_flat": 3,
        "corning_384_wellplate_112ul_flat": 3,
        "corning_48_wellplate_1.6ml_flat": 3,
        "corning_6_wellplate_16.8ml_flat": 3,
        "corning_96_wellplate_360ul_flat": 3,
        "nest_12_reservoir_15ml": 2,
        "nest_1_reservoir_195ml": 3,
        "nest_1_reservoir_290ml": 2,
        "nest_96_wellplate_100ul_pcr_full_skirt": 3,
        "nest_96_wellplate_200ul_flat": 3,
        "nest_96_wellplate_2ml_deep": 3,
        "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical": 2,
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical": 2,
        "opentrons_15_tuberack_falcon_15ml_conical": 2,
        "opentrons_15_tuberack_nest_15ml_conical": 2,
        "opentrons_24_aluminumblock_generic_2ml_screwcap": 3,
        "opentrons_24_aluminumblock_nest_0.5ml_screwcap": 2,
        "opentrons_24_aluminumblock_nest_1.5ml_screwcap": 2,
        "opentrons_24_aluminumblock_nest_1.5ml_snapcap": 2,
        "opentrons_24_aluminumblock_nest_2ml_screwcap": 2,
        "opentrons_24_aluminumblock_nest_2ml_snapcap": 2,
        "opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap": 2,
        "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap": 2,
        "opentrons_24_tuberack_generic_2ml_screwcap": 2,
        "opentrons_24_tuberack_nest_0.5ml_screwcap": 2,
        "opentrons_24_tuberack_nest_1.5ml_screwcap": 2,
        "opentrons_24_tuberack_nest_1.5ml_snapcap": 2,
        "opentrons_24_tuberack_nest_2ml_screwcap": 2,
        "opentrons_24_tuberack_nest_2ml_snapcap": 2,
        "opentrons_6_tuberack_falcon_50ml_conical": 2,
        "opentrons_6_tuberack_nest_50ml_conical": 2,
        "opentrons_96_aluminumblock_generic_pcr_strip_200ul": 3,
        "opentrons_96_wellplate_200ul_pcr_full_skirt": 3,
        "opentrons_tough_pcr_auto_sealing_lid": 2,
        "thermoscientificnunc_96_wellplate_1300ul": 2,
        "thermoscientificnunc_96_wellplate_2000ul": 2,
        "usascientific_12_reservoir_22ml": 2,
        "usascientific_96_wellplate_2.4ml_deep": 2,
    },
    APIVersion(2, 25): {
        "appliedbiosystemsmicroamp_384_wellplate_40ul": 3,
        "axygen_96_wellplate_500ul": 2,
        "biorad_384_wellplate_50ul": 4,
        "biorad_96_wellplate_200ul_pcr": 4,
        "corning_12_wellplate_6.9ml_flat": 4,
        "corning_24_wellplate_3.4ml_flat": 4,
        "corning_48_wellplate_1.6ml_flat": 5,
        "corning_6_wellplate_16.8ml_flat": 4,
        "corning_96_wellplate_360ul_flat": 4,
        "ibidi_96_square_well_plate_300ul": 2,
        "nest_96_wellplate_100ul_pcr_full_skirt": 4,
        "nest_96_wellplate_200ul_flat": 4,
        "nest_96_wellplate_2ml_deep": 4,
        "opentrons_96_wellplate_200ul_pcr_full_skirt": 4,
        "smc_384_read_plate": 2,
        "thermoscientificnunc_96_wellplate_1300ul": 3,
        "thermoscientificnunc_96_wellplate_2000ul": 3,
        "usascientific_96_wellplate_2.4ml_deep": 3,
    },
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
    # These were supposed to be short-lived drafts as part of of a one-two punch of
    # https://github.com/Opentrons/opentrons/pull/18266 + https://github.com/Opentrons/opentrons/pull/18284,
    # but the second punch took a while. We should merge the second punch after v8.6.0
    # and remove these exceptions as part of that.
    "agilent_1_reservoir_290ml",
    "corning_384_wellplate_112ul_flat",
    "nest_1_reservoir_290ml",
    "opentrons_24_aluminumblock_nest_0.5ml_screwcap",
    "opentrons_24_tuberack_nest_0.5ml_screwcap",
    "opentrons_96_aluminumblock_generic_pcr_strip_200ul",
    "usascientific_12_reservoir_22ml",
}


def get_standard_labware_default_version(
    api_version: APIVersion,
    load_name: str,
    default_labware_versions: DefaultLabwareVersions = DEFAULT_LABWARE_VERSIONS,
) -> int:
    """Return what version of a standard labware the Protocol API should load by default.

    The `default_labware_versions` param is exposed for testability and should be left
    unspecified.
    """
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
