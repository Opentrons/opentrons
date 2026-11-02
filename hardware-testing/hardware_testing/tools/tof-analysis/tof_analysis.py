"""This script lets you analyze, plot, and generate baselines for TOF sensors.

Usage:

    python3 tof_tools.py <action> [options]

"""

import os
import sys
import argparse
import plotly.graph_objects as go  # type: ignore
import pandas as pd  # type: ignore
import statistics
import json

from ast import literal_eval
from collections import defaultdict
from enum import Enum
from typing import Any, DefaultDict, Dict, List, Tuple
from itertools import product
from math import trunc


CHUNK_SIZE = 500
NUMBER_OF_ZONES = 10
NUMBER_OF_BINS = 128

DEFAULT_STD = 6
DEFAULT_THRESHOLD = 1000
# Defaults taken from TOF_DETECTION_CONFIG in api flex_stacker.py
DEFAULT_BIN_RANGES = [(30, 40), (17, 30), (15, 63), (15, 63)]
DEFAULT_MAX_SAMPLES = 100000

ACTIONS = ["plot", "generate", "validate"]


class StackerAxis(Enum):
    """The TOF sensor at the specific axis to target."""

    X = "x"
    Z = "z"


class Baseline(Enum):
    """The type of data to use to create the baseline."""

    LABWARE = "labware"
    STACKER = "stacker"
    AXIS = "axis"


class Platform(Enum):
    """The plarform location 'extend' or 'retract'."""

    EXTEND = "extend"
    RETRACT = "retract"


def _truncate(f: float, decimals: int = 2) -> float:
    factor = 10**decimals
    return trunc(f * factor) / factor


def _parse_axis(arg: str) -> str:
    try:
        return arg.lower()
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"Invalid axis format: {arg}. Expected format: axis axis"
        )


def _parse_tuple(arg: str) -> Tuple[int, int]:
    try:
        key, value = arg.split(",")
        return (int(key), int(value))
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"Invalid tuple format: {arg}. Expected format: key,value"
        )


def _get_value_from_index(deviations: List[int], axis: str, platform: str) -> int:
    index_map = {
        ("x", "extend"): 0,
        ("x", "retract"): 1,
        ("z", "extend"): 2,
        ("z", "retract"): 3,
    }
    return deviations[index_map.get((axis, platform), 0)]


def _get_tuple_from_index(
    bins_list: List[Tuple[int, int]], axis: str, platform: str
) -> Tuple[int, int]:
    index_map = {
        ("x", "extend"): 0,
        ("x", "retract"): 1,
        ("z", "extend"): 2,
        ("z", "retract"): 3,
    }
    return bins_list[index_map.get((axis, platform), 0)]


def convert_to_dict(obj: DefaultDict[Any, Any]) -> Dict[Any, Any]:
    """Convert a defaultdict to dict."""
    return {
        k: convert_to_dict(v) if isinstance(v, defaultdict) else v
        for k, v in obj.items()
    }


def is_valid_row(axis: str, platform: str, zone: int, config: Dict[Any, Any]) -> bool:
    """Determine if the row should be processed."""
    for a in ["x", "z"]:
        if axis == a:
            platform_list = config[f"platform_list_{a}"]
            zone_list = config[f"zone_list_{a}"]
            return (not platform_list or platform in platform_list) and (
                not zone_list or zone in zone_list
            )
    return True


def parse_common_args(args: argparse.Namespace) -> Dict[str, Any]:
    """Parses common arguments."""
    return {
        "axis_list": args.axis,
        "stacker_list": args.stackers or [],
        "labware_list": [] if "all" in args.labwares else args.labwares or ["baseline"],
        "platform_list_x": args.platform_x,
        "platform_list_z": args.platform_z,
        "zone_list_x": args.zones_x or list(range(NUMBER_OF_ZONES)),
        "zone_list_z": args.zones_z or list(range(NUMBER_OF_ZONES)),
        "bins_list": args.bins or list(range(NUMBER_OF_BINS)),
        "max_samples": args.max_samples or DEFAULT_MAX_SAMPLES,
        "baseline_version": getattr(args, "baseline_version", None),
        "output_file": getattr(args, "output_file", None),
        "std": getattr(args, "std", [DEFAULT_STD] * 4),
        "threshold": args.threshold,
        "bin_range": args.bin_range,
    }


def create_baseline(
    histograms: Dict[int, List[Dict[str, List[int]]]],
    zone_count: int = NUMBER_OF_ZONES,
    bin_count: int = NUMBER_OF_BINS,
    deviation: int = DEFAULT_STD,
) -> Dict[int, List[float]]:
    """Generate a TOF sensor baseline given multiple histogram readings.

    Baseline must be robust against variation. The "no labware" reading of ANY
    stacker should always be at or below the baseline. For each bin, calculate
    the Mean and Standard Deviation (STD) of the samples, then:

    Baseline = max(Mean + deviation x Standard Deviation, highest sample)

    @param histogram: a list of tof histogram measurements denoted as dicts of zone to bins.
    @param std: the standard deviation to use when calculating baseline, defaults to 6.
    @return: The baseline measurement.
    """
    assert (
        deviation >= 0
    ), f"Standard deviation cannot be negative, provided: {deviation}."
    baseline = defaultdict(list)
    if histograms:
        aggregate = defaultdict(lambda: defaultdict(list))  # type: ignore
        # Iterate through the histograms and create a map of zones to bin value
        # per index of each histogram.
        for zone, zone_bins in histograms.items():
            for bins in zone_bins:
                assert (
                    len(bins) == bin_count
                ), f"Invalid number of bins in zone {zone}, got {len(bins)} expected: {bin_count}."
                for bin, value in enumerate(bins):
                    aggregate[zone][bin].append(value)

        # Iterate through the per-index bin map and calculate the threshold
        # for that specific bin.
        for zone, bins_dict in aggregate.items():
            for bins in bins_dict.values():  # type: ignore
                mean = sum(bins) / len(bins)  # type: ignore
                std = statistics.pstdev(bins)  # type: ignore
                # Floor at the highest empty sample so a reading in this set
                # cannot come back as labware.
                threshold = max(mean + (std * deviation), max(bins))  # type: ignore
                baseline[zone].append(float("%.2f" % threshold))

        assert (
            len(baseline) == zone_count
        ), f"Invalid number of zones, got {len(baseline)} expected {zone_count}"
    return dict(baseline)


def read_filtered_data(
    dataframes: List[str], config: dict
) -> Tuple[Dict[str, Any], int]:
    """Parses the dataframe CSV files into a defaultdict of measurements."""
    samples = 0
    bin_count = len(config["bins_list"])
    measurements = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(dict))))  # type: ignore
    for filepath in dataframes:
        if not os.path.exists(filepath):
            sys.exit(f"ERROR: Invalid dataframe file provided - {filepath}")
        for df in pd.read_csv(filepath, chunksize=CHUNK_SIZE):
            df = df[df["Axis"].isin(config["axis_list"])]
            if config["stacker_list"]:
                df = df[df["Stacker_SN"].isin(config["stacker_list"])]
            if config["labware_list"]:
                df = df[df["Labware_Name"].isin(config["labware_list"])]

            start_index = df.columns.get_loc("Time") + 1
            for row in df.itertuples(index=False, name="data"):
                axis = row.Axis.lower()
                zone = row.Zone
                platform = row.Platform_Position
                stacker = row.Stacker_SN
                labware = row.Labware_Name
                sample = row.Sample

                if not is_valid_row(axis, platform, zone, config):
                    continue

                bins = list(row[start_index : start_index + bin_count])
                # Date + sample is one capture. Sample numbers restart every
                # run, so keying on sample alone keeps only the last run.
                capture = (row.Date, sample)
                measurements[axis][platform][stacker][capture].update(
                    {zone: bins, "lw": labware}
                )

                samples += 1
                if samples > config["max_samples"]:
                    return convert_to_dict(measurements), samples

    return convert_to_dict(measurements), samples


def plot_baseline(args: argparse.Namespace) -> None:
    """Plots the baseline and dataframe."""

    def _get_visibility_mask(
        visibility_dict: DefaultDict[str, List[int]], key: str, total: int
    ) -> List[bool]:
        mask = [False] * total
        for i in visibility_dict[key]:
            mask[i] = True
        return mask

    config = parse_common_args(args)
    measurements, samples = read_filtered_data(args.dataframe, config)
    for baseline_path in args.baseline:
        if not os.path.exists(baseline_path):
            sys.exit(f"ERROR: Invalid baseline file provided - {baseline_path}")

        with open(baseline_path, "r") as file:
            definition = json.load(file)
            baseline_data = definition["uniqueModuleData"]["TOFSensorBaseline"]
            baseline_data = {k.lower(): v for k, v in baseline_data.items()}
            version = baseline_data.pop("version", config["baseline_version"])

            for axis, data in baseline_data.items():
                if axis not in config["axis_list"]:
                    continue

                fig = go.Figure()
                trace_visibility = defaultdict(list)
                zone_visibility = defaultdict(list)
                for platform, baseline_str in data.items():
                    print(
                        f"Plotting baseline V{version} for {axis} axis {platform} from {samples} samples"
                    )
                    baseline = literal_eval(baseline_str)
                    for zone, bin in baseline.items():
                        if not is_valid_row(axis, platform, zone, config):
                            continue

                        bins, photons = zip(*enumerate(bin))
                        fig.add_trace(
                            go.Scatter(
                                x=bins,
                                y=photons,
                                mode="lines",
                                name=f"Baseline Zone {zone} {platform}",
                                visible=platform == "extend",
                                line=dict(dash="dash", color="blue", width=2),
                            )
                        )
                        idx = len(fig.data) - 1  # type: ignore
                        trace_visibility[platform].append(idx)
                        zone_visibility[zone].append(idx)

                    if measurements:
                        for stacker, entries in (
                            measurements.get(axis, {}).get(platform, {}).items()
                        ):
                            for _, zone_data in entries.items():
                                zone_data.pop("lw")
                                for zone, bin in zone_data.items():
                                    if not is_valid_row(axis, platform, zone, config):
                                        continue
                                    bins, photons = zip(*enumerate(bin))
                                    fig.add_trace(
                                        go.Scatter(
                                            x=bins,
                                            y=photons,
                                            mode="lines",
                                            name=f"Zone {zone}",
                                            line=dict(width=0.3),
                                            legendgroup=stacker,
                                            legendgrouptitle=dict(text=stacker),
                                            visible=platform == "extend",
                                        )
                                    )
                                    idx = len(fig.data) - 1  # type: ignore
                                    trace_visibility[platform].append(idx)
                                    zone_visibility[zone].append(idx)

                total = len(fig.data)  # type: ignore
                buttons = [
                    *[
                        dict(
                            label=key,
                            method="update",
                            args=[
                                {
                                    "visible": _get_visibility_mask(
                                        trace_visibility, key, total
                                    )
                                },
                                {},
                            ],
                        )
                        for key in trace_visibility
                    ],
                    *[
                        dict(
                            label=f"Zone {z}",
                            method="update",
                            args=[
                                {
                                    "visible": _get_visibility_mask(
                                        zone_visibility, z, total
                                    )
                                },
                                {},
                            ],
                        )
                        for z in zone_visibility
                    ],
                ]
                fig.update_layout(
                    title=f"TOF Sensor Baseline: {config['labware_list']} {axis} {args.graph_name}",
                    xaxis_title="Bins",
                    yaxis_title="Photon Count",
                    template="plotly_white",
                    updatemenus=[
                        dict(
                            type="buttons",
                            direction="down",
                            showactive=True,
                            buttons=buttons,
                        )
                    ],
                )
                fig.show()


def _patch_baseline_text(
    raw: str,
    definition: Dict[str, Any],
    baselines: Dict[str, Any],
    version: Any,
) -> Any:
    """Replace platform baseline strings without reformatting the file.

    Returns the updated text, or None when the file is not already a module
    definition with one string per platform.
    """
    try:
        tof = definition["uniqueModuleData"]["TOFSensorBaseline"]
    except (KeyError, TypeError):
        return None
    if not isinstance(tof, dict):
        return None

    updated = raw
    for axis, data in baselines.items():
        platforms = tof.get(axis.upper())
        if not isinstance(platforms, dict):
            return None
        for platform, baseline in data.items():
            old = platforms.get(platform)
            if not isinstance(old, str):
                return None
            old_entry = f'"{platform}": {json.dumps(old)}'
            new_entry = f'"{platform}": {json.dumps(str(baseline))}'
            if updated.count(old_entry) != 1:
                return None
            updated = updated.replace(old_entry, new_entry, 1)

    new_version = version if version is not None else tof.get("version")
    old_version = tof.get("version")
    if (
        new_version is not None
        and old_version is not None
        and new_version != old_version
    ):
        old_entry = f'"version": {old_version}'
        new_entry = f'"version": {new_version}'
        if updated.count(old_entry) != 1:
            return None
        updated = updated.replace(old_entry, new_entry, 1)
    return updated, new_version or old_version


def _write_baseline_file(
    path: str, baselines: Dict[str, Any], version: Any
) -> Tuple[str, Any]:
    """Write baselines into a module definition or a small baseline JSON file."""
    if not os.path.exists(path):
        print(f"Creating {path}")
        with open(path, "w", encoding="utf-8") as file:
            json.dump({}, file)

    with open(path, "r", encoding="utf-8") as file:
        raw = file.read()
    definition = json.loads(raw) if raw.strip() else {}
    patched = _patch_baseline_text(raw, definition, baselines, version)
    if patched is not None:
        updated, used_version = patched
        with open(path, "w", encoding="utf-8") as file:
            file.write(updated)
        return "patched", used_version

    unique_module_data = definition.setdefault("uniqueModuleData", {})
    tof_sensor_baseline = unique_module_data.get("TOFSensorBaseline", {})
    if tof_sensor_baseline.get("version") is None:
        x_baseline = tof_sensor_baseline.get("X", "{}")
        z_baseline = tof_sensor_baseline.get("Z", "{}")
        tof_sensor_baseline = {
            "version": 1,
            "X": {"extend": x_baseline, "retract": x_baseline},
            "Z": {"extend": z_baseline, "retract": z_baseline},
        }

    used_version = version or tof_sensor_baseline["version"]
    tof_sensor_baseline["version"] = used_version
    for axis, data in baselines.items():
        axis_name = axis.upper()
        tof_sensor_baseline.setdefault(axis_name, {})
        for platform, baseline in data.items():
            tof_sensor_baseline[axis_name][platform] = str(baseline)

    unique_module_data["TOFSensorBaseline"] = tof_sensor_baseline
    with open(path, "w", encoding="utf-8") as file:
        json.dump(definition, file, indent=2)
        file.write("\n")
    return "rewritten", used_version


def generate_baseline(args: argparse.Namespace) -> None:
    """Generates a new baseline given the dataframe."""
    config = parse_common_args(args)

    deviations = config["std"]
    # One value applies to every axis/platform. Four values are
    # X-Extend, X-Retract, Z-Extend, Z-Retract.
    if len(deviations) == 1:
        deviations = deviations * 4
    elif len(deviations) != 4:
        sys.exit(
            "ERROR: --std must be 1 value applied to every axis/platform, "
            "or 4 values in order X-Extend, X-Retract, Z-Extend, Z-Retract. "
            f"Provided {deviations}."
        )

    zone_count_x = len(config["zone_list_x"])
    zone_count_z = len(config["zone_list_z"])
    bin_count = len(config["bins_list"])

    print(
        f"\nGenerating baseline: LW={config['labware_list']}, STD={deviations},"
        f" PlatX={config['platform_list_x']}, PlatZ={config['platform_list_z']},"
        f" ZonesX={config['zone_list_x']}, ZonesZ={config['zone_list_z']}, Bins={config['bins_list']}\n"
    )

    measurements, zone_rows = read_filtered_data(args.dataframe, config)
    aggregate_zones = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))  # type: ignore
    baselines = defaultdict(dict)  # type: ignore
    histogram_count = 0
    for axis, platform_data in measurements.items():
        zone_count = zone_count_x if axis == "x" else zone_count_z
        for platform, sample_data in platform_data.items():
            for captures in sample_data.values():
                histogram_count += len(captures)
                for zone_map in captures.values():
                    for zone, bins in zone_map.items():
                        if zone == "lw":
                            continue
                        aggregate_zones[axis][platform][zone].append(bins)

            zone_data = dict(aggregate_zones[axis][platform])
            deviation = _get_value_from_index(deviations, axis, platform)
            baseline = create_baseline(zone_data, zone_count, bin_count, deviation)
            baselines[axis][platform] = baseline

    if not baselines:
        sys.exit("ERROR: No baseline data was generated.")

    output_file = config["output_file"]
    baseline_version = config["baseline_version"]
    write_mode = None

    if output_file:
        print(f"Saving baseline data to - {output_file}.\n")
        write_mode, baseline_version = _write_baseline_file(
            output_file, baselines, baseline_version
        )

    print(
        f"\n--------------- GENERATED BASELINE V{baseline_version} FROM {histogram_count} Histograms ({zone_rows} Zone Rows) ---------------\n"
    )
    if write_mode == "rewritten":
        print(
            "NOTE: The output file was rewritten. If it is a module definition, format it with `make format-js` from the repo root.\n"
        )

    for axis, data in baselines.items():
        for platform, baseline in data.items():
            deviation = _get_value_from_index(deviations, axis, platform)
            print(f"Baseline {axis} {platform} std={deviation}:\n")
            print(baseline, "\n")


def validate_baseline(args: argparse.Namespace) -> None:  # noqa: C901
    """Validates the baseline and dataframe and determines if the labware is detected."""
    config = parse_common_args(args)
    thresholds = config["threshold"]
    bin_ranges = config["bin_range"]
    if len(thresholds) > 4 or len(bin_ranges) > 4:
        sys.exit(
            f"ERROR: The number of threshold ({len(thresholds)}) or bin-range ({len(bin_ranges)})"
            " cant be more than 4."
        )

    detected_labware = defaultdict(list)  # type: ignore
    undetected_labware = defaultdict(set)  # type: ignore
    labware_names = set()
    measurements, samples_count = read_filtered_data(args.dataframe, config)
    for baseline_path in args.baseline:
        if not os.path.exists(baseline_path):
            sys.exit(f"ERROR: Invalid baseline file provided - {baseline_path}")

        with open(baseline_path, "r") as file:
            definition = json.load(file)
            baseline = definition.get("uniqueModuleData", {})["TOFSensorBaseline"]
            version = baseline.pop("version", config["baseline_version"])
            baseline["version"] = baseline.get("version", 1)
            baseline = {k.lower(): v for k, v in baseline.items()}
            figures = {}

            # The baseline is stored as string, so convert to dict
            for axis, platform in product(["x", "z"], ["extend", "retract"]):
                figures.update({axis: go.Figure()})
                data = literal_eval(baseline[axis][platform])
                baseline[axis][platform] = data
                for zone, bins in data.items():
                    figures[axis].add_trace(
                        go.Scatter(
                            x=list(range(NUMBER_OF_BINS)),
                            y=bins,
                            mode="lines",
                            name=f"Baseline zone {zone}",
                            visible=True,
                            line=dict(dash="dash", color="blue", width=2),
                        )
                    )

            # Go through measurements
            for axis in config["axis_list"]:
                for platform in set(
                    config["platform_list_x"] + config["platform_list_z"]
                ):
                    print(
                        f"Validate baseline V{version} for {axis} axis {platform} from {samples_count} samples"
                    )

                    for stacker, samples in (
                        measurements.get(axis, {}).get(platform, {}).items()
                    ):
                        for sample, data in samples.items():
                            labware_names.add(data["lw"])
                            detected = False
                            for zone in set(
                                config["zone_list_x"] + config["zone_list_z"]
                            ):
                                if not is_valid_row(axis, platform, zone, config):
                                    continue
                                if zone not in baseline[axis][platform]:
                                    continue
                                baseline_data = baseline[axis][platform][zone]
                                raw_data = data[zone]
                                labware = data["lw"]
                                bin_range = _get_tuple_from_index(
                                    bin_ranges, axis, platform
                                )
                                threshold = _get_tuple_from_index(
                                    thresholds, axis, platform
                                )
                                for bin in range(*bin_range):
                                    raw_data_value = raw_data[bin]
                                    baseline_value = baseline_data[bin]
                                    delta = _truncate(raw_data_value - baseline_value)
                                    if raw_data_value > threshold and delta > 0:
                                        detected = True
                                        mark = "+++" if labware == "baseline" else ""
                                        figures[axis].add_trace(
                                            go.Scatter(
                                                x=list(range(NUMBER_OF_BINS)),
                                                y=raw_data,
                                                mode="lines",
                                                name=f"zone {zone} {mark}",
                                                visible=True,
                                                line=dict(color="green", width=1),
                                            )
                                        )
                                        detected_labware[stacker].append(
                                            dict(
                                                labware=labware,
                                                stacker=stacker,
                                                axis=axis,
                                                platform=platform,
                                                zone=zone,
                                                bin=bin,
                                                raw_data=raw_data,
                                                raw_data_value=raw_data_value,
                                                baseline_value=baseline_value,
                                                delta=delta,
                                                threshold=threshold,
                                            )
                                        )
                                        break
                                if not detected:
                                    detected = False
                                    figures[axis].add_trace(
                                        go.Scatter(
                                            x=list(range(NUMBER_OF_BINS)),
                                            y=raw_data,
                                            mode="lines",
                                            name=f"zone {zone}",
                                            visible=True,
                                            line=dict(color="red", width=2),
                                        )
                                    )
                                    undetected_labware[stacker].add(
                                        (labware, axis, platform, zone)
                                    )
                figures[axis].update_layout(
                    title=f"Validate Baseline {axis}",
                    xaxis_title="Bins",
                    yaxis_title="Photon Count",
                    template="plotly_white",
                )
                if not args.disable_validation_plot:
                    figures[axis].show()

    print("\n---------------- RESULT -------------- \n")
    if detected_labware:
        print("ZONES DETECTED\n")
        for stacker, samples in detected_labware.items():
            for sample in samples:
                axis = sample["axis"]
                platform = sample["platform"]
                zone = sample["zone"]
                bin = sample["bin"]
                value = sample["raw_data_value"]
                base = sample["baseline_value"]
                delta = sample["delta"]
                lw = sample["labware"]
                print(
                    f"{stacker} DETECTED {lw} {axis} {platform} zn:{zone} bin:{bin} photon:{value} base:{base} delta:{delta}"
                )

    # Empty captures are named "baseline". Not detecting them is the correct state.
    if labware_names == {"baseline"}:
        detections = sum(len(hits) for hits in detected_labware.values())
        if detections == 0:
            print(
                f"\nSUCCESS: all {samples_count} samples are baseline and none were detected.\n"
            )
        else:
            print(
                f"\nFAILED: {detections} baseline samples were detected as labware.\n"
            )
        return

    print("\nZONES NOT DETECTED\n")
    for stacker, samples in undetected_labware.items():
        for sample in samples:
            lw, axis, dir, zn = sample
            print(f"{stacker} NOT DETECT {lw} {axis} {dir} zn={zn}")

    # Check if any stackers failed to detect ANY labware
    print("\n\n")
    all_detected = True
    for stacker in undetected_labware:
        if stacker not in detected_labware:
            print(f"WARNING NO DETECTION ACROSS ZONES {stacker}")
            all_detected = False

    if all_detected:
        print("\nSUCCESS: ALL SAMPLES DETECTED!\n")
    else:
        print("\nFAILED: SOME SAMPLES NOT DETECTED!\n")


def main(args: argparse.Namespace) -> None:
    """Script main entry point."""
    match args.action:
        case "plot":
            plot_baseline(args)
        case "generate":
            generate_baseline(args)
        case "validate":
            validate_baseline(args)
        case _:
            sys.exit(f"ERROR: Invalid action {args.action}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        formatter_class=argparse.RawTextHelpFormatter, description=__doc__
    )
    parser.add_argument(
        "action",
        choices=ACTIONS,
        help=(
            "plot: Plot the baseline, dataframe, or both superimposed.\n"
            "generate: Generate a baseline from the given dataframe.\n"
            "validate: TBD ???\n"
        ),
    )
    parser.add_argument(
        "-d",
        "--dataframe",
        help="Source file to CSV dataframe for generating baseline or plotting.",
        nargs="+",
    )
    parser.add_argument(
        "-b",
        "--baseline",
        nargs="+",
        help="The path to the generated baseline JSON file for plotting and validating labware.",
    )
    parser.add_argument(
        "--baseline-version",
        help="The version of the baseline to generate",
        type=int,
    )
    parser.add_argument(
        "-o",
        "--output-file",
        help="JSON file to write the baseline into. Pass flexStackerModuleV1.json to update\n"
        "its TOFSensorBaseline in place and leave the rest of the definition unchanged.\n"
        "Prints to stdout if omitted.",
    )
    parser.add_argument(
        "-a",
        "--axis",
        help="The axis to generate baseline for (x, z), generates both if empty.",
        default=["x", "z"],
        type=_parse_axis,
        nargs="+",
    )
    parser.add_argument(
        "--zones-x",
        help="The list of zones to use for the X axis, uses 1-9 if ommited.",
        type=int,
        nargs="+",
    )
    parser.add_argument(
        "--zones-z",
        help="The list of zones to use for the Z axis, uses 1-9 if ommited.",
        type=int,
        nargs="+",
    )
    parser.add_argument(
        "--bins",
        help="The list of bins to use, uses 0-127 if ommited.",
        type=int,
        nargs="+",
    )
    parser.add_argument(
        "--platform-x",
        help="The X platform position (extend, retract, or both)",
        default=["extend", "retract"],
        nargs="+",
    )
    parser.add_argument(
        "--platform-z",
        help="The Z platform position (extend, retract, or both)",
        default=["extend", "retract"],
        nargs="+",
    )
    parser.add_argument(
        "--std",
        help="Standard deviation to use when creating a baseline. "
        "Pass 1 value to apply it to every axis/platform, or 4 values in order "
        "X-Extend, X-Retract, Z-Extend, Z-Retract.",
        type=int,
        default=[DEFAULT_STD] * 4,
        nargs="+",
    )
    parser.add_argument(
        "--threshold",
        help="The minimum raw photon value to be used for labware detection."
        "This can be up to 4 values whose index correspond to each axis-platform combo."
        "X-Extend, X-Retract, Z-Extend, Z-Retract.",
        type=int,
        default=[DEFAULT_THRESHOLD] * 4,
        nargs="+",
    )
    parser.add_argument(
        "--bin-range",
        help="The range of bins to be used for labware detection."
        "This can be up to 4 tuple values whose index correspond to each axis-platform combo."
        "X-Extend, X-Retract, Z-Extend, Z-Retract."
        "The tuple format is `start_index + comma + end_index` like so."
        "1,2 3,4 5,6 7,8",
        type=_parse_tuple,
        default=DEFAULT_BIN_RANGES,
        nargs="+",
    )
    parser.add_argument(
        "-l",
        "--labwares",
        help="The list of labware to use, set to 'all' for all labware. Uses 'baseline' by default.",
        default=[],
        nargs="+",
    )
    parser.add_argument(
        "-s",
        "--stackers",
        help="The list of stacker serial number to process data for, ex. FSTA1020250401005.",
        nargs="+",
    )
    parser.add_argument(
        "--max-samples",
        help="The maximum number of samples (rows) to pricess from the dataframe.",
        type=int,
        default=DEFAULT_MAX_SAMPLES,
    )
    parser.add_argument(
        "--graph-name",
        help="Optional graph tag to add to the name",
        type=str,
        default="",
    )
    parser.add_argument(
        "--disable-validation-plot",
        help="Disables grapping the validation plots.",
        action="store_true",
        default=False,
    )

    args = parser.parse_args()
    main(args)
