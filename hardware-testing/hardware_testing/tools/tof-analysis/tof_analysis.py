"""This script lets you analyze, plot, and generate baselines for TOF sensors.

Usage:

    python3 tof_tools.py <action> [options]

"""

import os
import sys
import argparse
import traceback
import plotly.graph_objects as go
import pandas as pd
import statistics
import json

from ast import literal_eval
from collections import defaultdict
from enum import Enum
from typing import Any, Dict, List, Optional


global baseline_x, baseline_y
baseline_x = "baseline_x.json"
baseline_z = "baseline_z.json"
baseline_labware = "baseline_lab_{axis}.json"
baseline_stacker = "baseline_stack_{axis}.json"
baseline_sensor = "baseline_sensor_{axis}.json"

global options
option = ["Make Baseline", "Validate Labware", "Validation Checks", "Plot"]

CHUNK_SIZE = 500
NUMBER_OF_ZONES = 10
NUMBER_OF_BINS = 128

DEFAULT_STD = 6
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


def get_deviation(deviations: List[int], axis: str, platform: str) -> int:
    index_map = {
        ("X", "extend"): 0,
        ("X", "retract"): 1,
        ("Z", "extend"): 2,
        ("Z", "retract"): 3,
    }
    return deviations[index_map.get((axis, platform), 0)]


def create_baseline(
    histograms: Dict[int, List[Dict[str, List[int]]]],
    zone_count: int = NUMBER_OF_ZONES,
    bin_count: int = NUMBER_OF_BINS,
    deviation: int = DEFAULT_STD,
) -> Dict[int, List[float]]:
    """Generate a TOF sensor baseline given multiple histogram readings.

    Baseline must be robust against variation the "no labware" reading of ANY
    stacker should always be below the "baseline". For each bin, we calculate
    the Mean and Standard Deviation (STD) of the samples. We then create the
    "baseline": Baseline = Mean + deviation x Standard Deviation

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
        for zone, zone_info in histograms.items():
            for bins_data in zone_info:
                bins = list(bins_data.values())[0]
                assert (
                    len(bins) == bin_count
                ), f"Invalid number of bins in zone {zone}, got {len(bins)} expected: {bin_count}."
                for bin, value in enumerate(bins):
                    aggregate[zone][bin].append(value)

        # Iterate through the per-index bin map and calculate the threshold
        # for that specific bin.
        for zone, bins_dict in aggregate.items():
            for bins in bins_dict.values():
                mean = sum(bins) / len(bins)  # type: ignore
                std = statistics.pstdev(bins)  # type: ignore
                threshold = float("%.2f" % (mean + (std * deviation)))
                baseline[zone].append(threshold)

        assert (
            len(baseline) == zone_count
        ), f"Invalid number of zones, got {len(baseline)} expected {zone_count}"
    return dict(baseline)


def process_data(data_df):

    bin_labels = ["Time", "Zone"] + [str(i) for i in range(1, 129)]

    data_df.columns = bin_labels
    # sample_df = None
    zones = {}
    return_zones = {}
    for entry in data_df.itertuples():
        zone = str(int(getattr(entry, "Zone")))
        if zone not in zones:
            zones[zone] = {}  # Initialize zone if not present

        for i in range(3, 131):
            bin_str = str(i)
            bin = "_" + bin_str
            bin_val = getattr(entry, bin)
            if bin_str not in zones[zone]:
                zones[zone][bin_str] = []  # Initialize bin if not present
            zones[zone][bin_str].append(bin_val)
            # Ensure zone is a string
    for zone in zones:
        if zone not in return_zones:
            return_zones[zone] = []
            bin_averages = []
        for bin_label in zones[zone]:
            list_vals = zones[zone][bin_label]
            if list_vals:
                mean = sum(list_vals) / len(list_vals)
                bin_averages.append(mean)
        return_zones[zone] = bin_averages
    return return_zones


def sense_labware(axis, platform, data_df):
    raw_data = process_data(data_df)
    baseline_zones = {}
    baseline_file = baseline_z

    if axis == "X-Axis":
        baseline_file = baseline_x
    try:
        with open(baseline_file, "r") as file:
            baseline_zones = json.load(file)
            file.close()
    except json.JSONDecodeError:
        print("Can't read file")
    if axis == "X-Axis":
        # Zone 6: If any bins 25 - 40 are positive, we see labware,  have the script say “labware!”
        z6_baseline = baseline_zones["6"]
        z6_raw_data = raw_data["6"]
        for bin in range(25, 41):
            delta = z6_raw_data[bin] - z6_baseline[bin]
            if delta > 0:
                return True
    elif axis == "Z-Axis":
        # Zone1: If any bin lower than 64 is positive, we see labware, have the script say “labware!”
        z1_baseline = baseline_zones["1"]
        # print(f"BASE: {z1_baseline}")
        z1_raw_data = raw_data["1"]
        # print(f"RAW: {z1_raw_data}")
        for bin in range(57, 59):
            delta = z1_raw_data[bin] - z1_baseline[bin]
            if delta > 0:
                return True
    return False


def plot_tests(hashes, labware, axis):
    df = pd.read_csv("TOF_raw_data_df.csv")
    bins = list(range(1, 129))

    ptest = "Positives"
    if labware == 1:
        ptest = "Negatives"
    if axis == "Z-Axis":
        zone = 1
        baseline = baseline_z
    elif axis == "X-Axis":
        baseline = baseline_x
        zone = 6
    fig = go.Figure()

    # Plot labware data
    for hash in hashes:
        matches = df[
            (df["Hash_id"] == hash)
            & (df["Labware Stacked"] == labware)
            & (df["Axis"] == axis)
        ]
        for i, match in enumerate(matches.itertuples()):
            # print(match)
            labware_name = getattr(match, "_6")
            labware_num = getattr(match, "_8")
            test = getattr(match, "Test")
            # print(f'NAME: {labware_name}')
            values = pd.DataFrame(json.loads(getattr(match, "Values")))
            data = process_data(values)
            try:
                zone_data = data[str(zone)]
            except:
                traceback.print_exc()
            fig.add_trace(
                go.Scatter(
                    x=bins,
                    y=zone_data,
                    mode="lines",
                    name=f"{labware_name} {labware_num} {test}",
                )
            )
    fig.update_layout(
        title=f"TOF Baseline Test: {axis} (False {ptest})",
        xaxis_title="Bins",
        yaxis_title="Photon Count",
        legend_title=f"Zone: {zone}",
        template="plotly_white",
    )

    # plot baseline
    try:
        file = open(baseline, "r")
    except:
        raise
    baseline_dict = json.load(file)
    # Create line traces for each zone
    zone_data = baseline_dict[str(zone)]
    fig.add_trace(
        go.Scatter(
            x=bins,
            y=zone_data,
            mode="lines",
            name=f"Zone {zone}",
            line=dict(dash="dash"),
        )
    )
    # Customize layout
    fig.show()


def test_baseline(baseline, df_path):
    df = pd.read_csv(df_path)
    print(df.shape)
    if baseline == "x":
        axis = "X-Axis"
    elif baseline == "z":
        axis = "Z-Axis"

    no_lab_failed_count = 0
    lab_failed_count = 0
    # For no labware
    print("Testing No Labware")
    filtered_rows_no_lab = df[(df["Labware Stacked"] == 0) & (df["Axis"] == axis)]
    # if baseline == 'z':
    #     filtered_rows_no_lab = df[(df['Labware Stacked'] == 0) & (df['Axis'] == axis) & (df['Test'] == 'Gripper')]
    no_lab_expected = False
    hashes_no_lab = []
    for sample in filtered_rows_no_lab.itertuples():
        hash = getattr(sample, "Hash_id")
        stacker = getattr(sample, "_2")
        serial = getattr(sample, "Serial")
        labware = getattr(sample, "_6")
        values = getattr(sample, "Values")
        values_json = json.loads(values)
        values_df = pd.DataFrame(values_json)
        result = sense_labware(axis, values_df)
        print(f"RESULT: {result}, EXPECTED: {no_lab_expected}")
        if result != no_lab_expected:
            print(hash, stacker, serial, labware)
            no_lab_failed_count += 1
            hashes_no_lab.append(hash)
    plot_tests(hashes_no_lab, 0, axis)
    # For labware
    print("Testing For Labware")
    filtered_rows_lab = df[(df["Labware Stacked"] == 1) & (df["Axis"] == axis)]
    # if baseline == 'z':
    #     filtered_rows_lab = df[(df['Labware Stacked'] == 1) & (df['Axis'] == axis) & (df['Test'] == 'Gripper')]
    lab_expected = True
    hashes_lab = []
    for sample in filtered_rows_lab.itertuples():
        hash = getattr(sample, "Hash_id")
        stacker = getattr(sample, "_2")
        serial = getattr(sample, "Serial")
        labware = getattr(sample, "_6")
        values = getattr(sample, "Values")
        values_json = json.loads(values)
        values_df = pd.DataFrame(values_json)
        result = sense_labware(axis, values_df)
        print(f"OUT: {stacker}, {labware}, {result}")
        if result != lab_expected:
            print(hash, stacker, serial, labware)
            lab_failed_count += 1
            hashes_lab.append(hash)
    plot_tests(hashes_lab, 1, axis)


def parse_common_args(args: argparse.Namespace) -> Dict[str, Any]:
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
    }


def is_valid_row(axis, platform, zone, config):
    for a in ["x", "z"]:
        if axis.lower() == a:
            platform_list = config[f"platform_list_{a}"]
            zone_list = config[f"zone_list_{a}"]
            return (not platform_list or platform in platform_list) and (
                not zone_list or zone in zone_list
            )
    return True


def read_filtered_data(filepath: str, config: dict, return_dict_format=False):
    if not os.path.exists(filepath):
        sys.exit(f"ERROR: Invalid dataframe file provided - {filepath}")

    samples = 0
    bin_count = len(config["bins_list"])
    measurements = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for df in pd.read_csv(filepath, chunksize=CHUNK_SIZE):
        df = df[df["Axis"].isin(config["axis_list"])]
        if config["stacker_list"]:
            df = df[df["Stacker_SN"].isin(config["stacker_list"])]
        if config["labware_list"]:
            df = df[df["Labware_Name"].isin(config["labware_list"])]

        start_index = df.columns.get_loc("Time") + 1
        for row in df.itertuples(index=False, name="data"):
            axis = row.Axis
            zone = row.Zone
            platform = row.Platform_Position
            stacker = row.Stacker_SN

            if not is_valid_row(axis, platform, zone, config):
                continue

            axis_upper = axis.upper()
            bins = list(row[start_index : start_index + bin_count])
            measurements[axis_upper][platform][zone].append({stacker: bins})

            samples += 1
            if samples > config["max_samples"]:
                return measurements, samples

    return measurements, samples


def plot_baseline(args: argparse.Namespace) -> None:
    """Plots the baseline and dataframe."""

    def get_visibility_mask(visibility_dict, key, total):
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
            version = baseline_data.pop("version", config["baseline_version"])

            for axis, data in baseline_data.items():
                if axis.lower() not in config["axis_list"]:
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
                        for zone, entries in (
                            measurements.get(axis, {}).get(platform, {}).items()
                        ):
                            if not is_valid_row(axis, platform, zone, config):
                                continue
                            for entry in entries:
                                for stacker, bin in entry.items():
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
                                    "visible": get_visibility_mask(
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
                                    "visible": get_visibility_mask(
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
                    title=f"TOF Sensor Baseline: {config['labware_list']} {axis}",
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


def generate_baseline(args: argparse.Namespace) -> None:
    """Generates a new baseline given the dataframe."""
    config = parse_common_args(args)
    histograms, samples = read_filtered_data(args.dataframe, config)

    deviations = config["std"]
    if len(deviations) > 4:
        sys.exit(f"ERROR: --std cannot be greater than 4, provided {deviations}.")

    zone_count_x = len(config["zone_list_x"])
    zone_count_z = len(config["zone_list_z"])
    bin_count = len(config["bins_list"])

    print(
        f"\nGenerating baseline: LW={config['labware_list']}, STD={deviations},"
        f" PlatX={config['platform_list_x']}, PlatZ={config['platform_list_z']},"
        f" ZonesX={config['zone_list_x']}, ZonesZ={config['zone_list_z']}, Bins={config['bins_list']}\n"
    )

    baselines = defaultdict(dict)
    for axis, platform_data in histograms.items():
        zone_count = zone_count_x if axis == "X" else zone_count_z
        for platform, zone_data in platform_data.items():
            deviation = get_deviation(deviations, axis, platform)
            baseline = create_baseline(zone_data, zone_count, bin_count, deviation)
            baselines[axis][platform] = baseline

    if not baselines:
        sys.exit("ERROR: No baseline data was generated.")

    output_file = config["output_file"]
    baseline_version = config["baseline_version"]

    if output_file:
        if not os.path.exists(output_file):
            print(f"Creating {output_file}")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump({}, f)

        print(f"Saving baseline data to - {output_file}.\n")
        with open(output_file, "r+") as file:
            definition = json.load(file)
            unique_module_data = definition.get("uniqueModuleData", {})
            tof_sensor_baseline = unique_module_data.get("TOFSensorBaseline", {})

            if tof_sensor_baseline.get("version") is None:
                x_baseline = tof_sensor_baseline.get("X", "{}")
                z_baseline = tof_sensor_baseline.get("Z", "{}")
                tof_sensor_baseline = {
                    "version": 1,
                    "X": {"extend": x_baseline, "retract": x_baseline},
                    "Z": {"extend": z_baseline, "retract": z_baseline},
                }

            baseline_version = baseline_version or tof_sensor_baseline["version"]

            for axis, data in baselines.items():
                for platform, baseline in data.items():
                    tof_sensor_baseline[axis][platform] = str(baseline)

            definition["uniqueModuleData"] = {"TOFSensorBaseline": tof_sensor_baseline}

            file.seek(0)
            json.dump(definition, file, indent=2)
            file.truncate()

    print(
        f"\n--------------- GENERATED BASELINE V{baseline_version} FROM {samples} Samples ---------------\n"
    )
    print(
        "NOTE: If this is a definition JSON file, format it by running `make format-js` from top-level.\n"
    )

    for axis, data in baselines.items():
        for platform, baseline in data.items():
            deviation = get_deviation(deviations, axis, platform)
            print(f"Baseline {axis} {platform} std={deviation}:\n")
            print(baseline, "\n")


def validate_something(args: argparse.Namespace) -> None:
    """Validates the baseline and dataframe and determines if the labware is detected."""
    dataframe_path: str = args.dataframe
    baseline_path: str = args.baseline
    axis: str = args.axis
    labware_list: Optional[List[str]] = []
    if axis == "x":
        axis = "X-Axis"
    elif axis == "z":
        axis = "Z-Axis"

    if not os.path.exists(args.dataframe):
        sys.exit(f"ERROR: Invalid dataframe file provided - {args.dataframe}")

    axis_list = args.axis
    stacker_list = args.stackers or []
    labware_list = args.labwares or []
    baseline_version = args.baseline_version
    platform_list_x = args.platform_x
    platform_list_z = args.platform_z
    zone_list_x = args.zones_x or list(range(0, NUMBER_OF_ZONES))
    zone_list_z = args.zones_z or list(range(0, NUMBER_OF_ZONES))
    bins_list = args.bins or list(range(0, NUMBER_OF_BINS))
    max_samples = args.max_samples or DEFAULT_MAX_SAMPLES
    deviations = args.std or [DEFAULT_STD] * 4
    zone_count_x = len(zone_list_x)
    zone_count_z = len(zone_list_z)
    bin_count = len(bins_list)

    # Gather data
    samples = 0
    measurements = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    chunks = pd.read_csv(args.dataframe, chunksize=CHUNK_SIZE)
    for df in chunks:

        # Filter out data
        if axis_list:
            df = df[df["Axis"].isin(axis_list)]
        if stacker_list:
            df = df[df["Stacker_SN"].isin(stacker_list)]
        if labware_list:
            df = df[df["Labware_Name"].isin(labware_list)]
        for row in df.itertuples(index=False, name="data"):
            axis = row.Axis
            zone = row.Zone
            platform = row.Platform_Position
            stacker = row.Stacker_SN
            labware = row.Labware_Name

            ## Filter out specific rows
            if axis == "x":
                if platform_list_x and platform not in platform_list_x:
                    continue
                if zone_list_x and zone not in zone_list_x:
                    continue
            if axis == "z":
                if platform_list_z and platform not in platform_list_z:
                    continue
                if zone_list_z and zone not in zone_list_z:
                    continue

            # Get the bins
            axis = axis.upper()
            start_index = df.columns.get_loc("Time") + 1
            bins = list(row[start_index : start_index + bin_count])
            measurements[axis][platform][zone].append({stacker: bins})

            values_df = pd.DataFrame(bins)
            result = sense_labware(axis, platform, values_df)
            print(
                f"Labware: {labware}\n\nStacker\n\n{stacker}{axis}{platform}\n\nRESULT: {result}\n\n"
            )
            samples += 1

        if samples > max_samples:
            break

    df = pd.read_csv(dataframe_path, header=None)
    for i, entry in enumerate(df.itertuples()):
        if i == 0:
            continue
        stacker = getattr(entry, "_2")
        serial = getattr(entry, "_4")
        labware = getattr(entry, "_6")
        labware_stacked = getattr(entry, "_9")
        values = getattr(entry, "_10")
        values_json = json.loads(values)
        values_df = pd.DataFrame(values_json)
        result = sense_labware(axis, values_df)
        print(
            f"Labware: {labware}\n\nStacked: {labware_stacked}\n\nStacker\n\n{stacker}\n\nSerial: {serial}\n\nRESULT: {result}\n\n"
        )


def main(args: argparse.Namespace):
    match args.action:
        case "plot":
            plot_baseline(args)
        case "generate":
            generate_baseline(args)
        case "validate":
            validate_something(args)
        case _:
            sys.exit(f"ERROR: Invalid action {args.action}")


#    elif options[selection_int] == 'Validation Checks':
#        baseline_checks = [
#            'z',
#            'x',
#        ]
#
#        for i, check in enumerate(baseline_checks):
#            print(f'{i}) Validate Baseline {check}')
#        check_choice = int(input("Make a selection: "))
#
#        try:
#            test_baseline(baseline_checks[check_choice], 'TOF_raw_data_df.csv')
#        except:
#            pass
#


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
        help="The output file of the generated baseline, prints to stdout if ommited.",
    )
    parser.add_argument(
        "-a",
        "--axis",
        help="The axis to generate baseline for (x, z), generates both if empty.",
        default=["x", "z"],
        type=str,
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
        help="Standard devition to use when creating a baseline."
        "This can be up to 4 values whose index correspond to each axis-platform combo."
        "X-Extend, X-Retract, Z-Extend, Z-Retract.",
        type=int,
        default=[DEFAULT_STD] * 4,
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

    args = parser.parse_args()
    main(args)
