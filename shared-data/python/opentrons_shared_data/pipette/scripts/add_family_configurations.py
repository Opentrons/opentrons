#!/usr/bin/env python3

import subprocess
import dataclasses
import argparse
import json
import pathlib
import sys
import traceback
from typing import Iterator, Any

from ..types import PIPETTE_API_NAMES_MAP

DEFAULT_DATA_PATH = (
    pathlib.Path(__file__).parent.parent.parent.parent.parent
    / "pipette"
    / "definitions"
    / "2"
)
EXEMPLAR_VERSIONS = ["1_0", "2_0", "3_0"]

CHANNEL_NAMES_TO_COUNTS = {
    "single_channel": 1,
    "eight_channel": 8,
    "ninety_six_channel": 96,
}
CHANNEL_COUNTS_TO_NAMES = {
    1: "single_channel",
    8: "eight_channel",
    96: "ninety_six_channel",
}
CHANNEL_COUNTS_TO_OLD_NAMES = {1: "single", 8: "multi", 96: "96"}
OLD_NAMES_TO_CHANNEL_COUNTS = {"single": 1, "multi": 8, "96": 96}

FAMILY_NAMES_TO_API_NAMES = {
    "p10_single_gen1": "p10_single",
    "p10_multi_gen1": "p10_multi",
    "p20_single_gen2": "p20_single_gen2",
    "p20_multi_gen2": "p20_single_gen2",
    "p50_single_gen1": "p50_single",
    "p50_multi_gen1": "p50_multi",
    "p300_single_gen1": "p300_single",
    "p300_multi_gen1": "p300_multi",
    "p300_single_gen2": "p300_single_gen2",
    "p300_multi_gen2": "p300_multi_gen2",
    "p1000_single_gen1": "p1000_single",
    "p1000_single_gen2": "p1000_single_gen2",
    "p50_single_flex": "flex_1channel_50",
    "p50_multi_flex": "flex_8channel_50",
    "p1000_single_flex": "flex_1channel_1000",
    "p1000_multi_flex": "flex_8channel_1000",
    "p1000_multi_em_flex": "flex_8channel_1000_em",
    "p1000_96_flex": "flex_96channel_1000",
    "p200_96_flex": "flex_96channel_200",
}

FAMILY_NAMES_TO_PIPETTE_NAMES = {
    "p10_single_gen1": "p10_single",
    "p10_multi_gen1": "p10_multi",
    "p20_single_gen2": "p20_single_gen2",
    "p20_multi_gen2": "p20_multi_gen2",
    "p50_single_gen1": "p50_single",
    "p50_multi_gen1": "p50_multi",
    "p300_single_gen1": "p300_single",
    "p300_multi_gen1": "p300_multi",
    "p300_single_gen2": "p300_single_gen2",
    "p300_multi_gen2": "p300_multi_gen2",
    "p1000_single_gen1": "p1000_single",
    "p1000_single_gen2": "p1000_single_gen2",
    "p50_single_flex": "p50_single_flex",
    "p50_multi_flex": "p50_multi_flex",
    "p1000_single_flex": "p1000_single_flex",
    "p1000_multi_flex": "p1000_multi_flex",
    "p1000_multi_em_flex": "p1000_multi_em_flex",
    "p1000_96_flex": "p1000_96",
    "p200_96_flex": "p200_96",
}

EXEMPLAR_PATHS_TO_FAMILY_NAMES = {
    "single_channel/p1000/1_0.json": "p1000_single_gen1",
    "single_channel/p1000/2_0.json": "p1000_single_gen2",
    "single_channel/p1000/3_0.json": "p1000_single_flex",
    "single_channel/p300/1_0.json": "p300_single_gen1",
    "single_channel/p300/2_0.json": "p300_single_gen2",
    "single_channel/p50/1_0.json": "p50_single_gen1",
    "single_channel/p50/2_0.json": "p50_single_gen2",
    "single_channel/p50/3_0.json": "p50_single_flex",
    "single_channel/p10/1_0.json": "p10_single_gen1",
    "single_channel/p20/2_0.json": "p20_single_gen2",
    "eight_channel/p1000/1_0.json": "p1000_multi_flex",
    "eight_channel/p1000/3_0.json": "p1000_multi_flex",
    "eight_channel/p10/1_0.json": "p10_multi_gen1",
    "eight_channel/p20/2_0.json": "p20_multi_gen2",
    "eight_channel/p50/1_0.json": "p50_multi_gen1",
    "eight_channel/p50/3_0.json": "p50_multi_flex",
    "eight_channel/p300/1_0.json": "p300_multi_gen1",
    "eight_channel/p300/2_0.json": "p300_multi_gen2",
    "eight_channel_em/p1000/3_0.json": "p1000_multi_em_flex",
    "eight_channel_em/p1000/1_0.json": "p1000_multi_em_flex",
    "ninety_six_channel/p1000/3_0.json": "p1000_96_flex",
    "ninety_six_channel/p200/3_0.json": "p200_96_flex",
    "ninety_six_channel/p1000/1_0.json": "p1000_96_flex",
    "ninety_six_channel/p200/1_0.json": "p200_96_flex",
}


def get_exemplars(data_path: pathlib.Path) -> Iterator[pathlib.Path]:
    """Get the exemplar definitions."""
    for general in get_generals(data_path):
        if general.stem in EXEMPLAR_VERSIONS:
            print(f"Parsing {general}")
            yield general


def get_nonexemplars(data_path: pathlib.Path) -> Iterator[pathlib.Path]:
    """Get non-exemplar general definitions."""
    for general in get_generals(data_path):
        if general.stem in EXEMPLAR_VERSIONS:
            continue
        yield general


def get_generals(data_path: pathlib.Path) -> Iterator[pathlib.Path]:
    """Get all general settings."""
    for channel_dir in (data_path / "general").iterdir():
        for volume_group in channel_dir.iterdir():
            for definition in volume_group.iterdir():
                yield definition


def family_from_exemplar(
    exemplar_data: dict[str, Any], family_name: str
) -> dict[str, Any]:
    """Get a family definition from an exemplar."""
    return {
        "$otSharedSchema": "#/pipette/schemas/2/pipetteFamilySchema.json",
        "displayName": exemplar_data["displayName"],
        "oemType": "em" if "_em" in family_name else "ot",
        "channels": exemplar_data["channels"],
        "apiLoadName": FAMILY_NAMES_TO_API_NAMES[family_name],
        "pipetteName": FAMILY_NAMES_TO_PIPETTE_NAMES[family_name],
        "familyName": family_name,
        "displayCategory": exemplar_data["displayCategory"],
        "generation": exemplar_data["displayCategory"],
        "model": exemplar_data["model"],
        "compatibleMachine": (
            "Flex" if exemplar_data["displayCategory"] == "FLEX" else "OT-2"
        ),
    }


def run(data_path: pathlib.Path) -> None:
    """Create family definitions for all families."""
    for exemplar in get_exemplars(data_path):
        ex_rel = str(exemplar.relative_to(data_path / "general"))
        try:
            family_name = EXEMPLAR_PATHS_TO_FAMILY_NAMES[ex_rel]
        except KeyError:
            print(
                f"During create family: Exemplar at {ex_rel} not known (this may be okay tho)"
            )
            continue
        exemplar_data = json.load(open(exemplar))
        family_data = family_from_exemplar(exemplar_data, family_name)
        print(f"Creating {family_name}")
        json.dump(family_data, open(data_path / "family" / f"{family_name}.json", "w"))

    for general in get_generals(data_path):
        exemplar = general.parent / (general.stem.split("_")[0] + "_0.json")
        exemplar_path = exemplar.relative_to(data_path / "general")
        try:
            family_name = EXEMPLAR_PATHS_TO_FAMILY_NAMES[str(exemplar_path)]
        except KeyError:
            print(
                f"During update defs: exemplar at {exemplar_path} for {general.relative_to(data_path / 'general')} not known (this may be okay tho)"
            )
            continue
        original = json.load(open(general))
        original["familyName"] = family_name
        json.dump(original, open(general, "w"))
    subprocess.check_call(
        ["yarn", "prettier", "--write", str(data_path / "**/*.json")],
        cwd=data_path.parent.parent.parent.parent,
    )


def _do_run(args: list[str]) -> int:
    parser = get_argparse(argparse.ArgumentParser())
    args = parser.parse_args()
    try:
        run(args.data_path)
        return 0
    except BaseException:
        traceback.print_exc()
        return 1


def get_argparse(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.description = "Update pipette configs to add family configurations"
    parser.add_argument(
        "--data-path",
        type=str,
        default=DEFAULT_DATA_PATH,
        help="Path to the pipette definition root shared-data/pipettes/definitions/2",
    )

    return parser


if __name__ == "__main__":
    sys.exit(_do_run(sys.argv[1:]))
