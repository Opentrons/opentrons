"""This script lets you analyze, plot, and generate baselines for TOF sensors.

Usage:

    python3 tof_tools.py <action> [options]

"""

import argparse
from collections import defaultdict
from enum import Enum
import json
import sys
from typing import Dict, List, Optional
import pandas as pd
import statistics
import os
import traceback
import plotly.graph_objects as go


global baseline_x, baseline_y
baseline_x = "baseline_x.json"
baseline_z = "baseline_z.json"
baseline_labware = "baseline_lab_{axis}.json"
baseline_stacker = "baseline_stack_{axis}.json"
baseline_sensor = "baseline_sensor_{axis}.json"

global options
option = ["Make Baseline", "Validate Labware", "Validation Checks", "Plot"]

CHUNK_SIZE = 100
NUMBER_OF_ZONES = 10
NUMBER_OF_BINS = 128

DEFAULT_STD = 6
DEFAULT_MAX_SAMPLES = 1000

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


def plot_baseline(plot_choice):
    if plot_choice.lower() == "baseline":
        baselines = [baseline_x, baseline_z]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for baseline in baselines:
            try:
                file = open(baseline, "r")
            except:
                raise
            baseline_dict = json.load(file)
            # Create line traces for each zone
            fig = go.Figure()
            for zone in baseline_dict:
                zone_data = baseline_dict[zone]
                fig.add_trace(
                    go.Scatter(x=bins, y=zone_data, mode="lines", name=f"Zone {zone}")
                )

            # Customize layout
            fig.update_layout(
                title=f"TOF Sensor Baseline: {baseline}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title="Zones",
                template="plotly_white",
            )
            fig.show()
    elif plot_choice.lower() == "labware data":
        file_csv = input("Path to labware csv: ")
        axis = input("Which axis? z or x?: ")
        try:
            file_df = pd.read_csv(file_csv)
        except:
            print("Cannot read file")

        if axis == "z":
            baseline_file = baseline_z
            zone = "1"
        elif axis == "x":
            baseline_file = baseline_x
            zone = "6"
        try:
            bfile = open(baseline_file)
        except:
            print("Could not find baseline")
        baseline_dict = json.load(bfile)
        bfile.close()
        lab_data = process_data(file_df)

        bins = [x for x in range(1, 129)]
        fig = go.Figure()
        zone_data = baseline_dict[zone]
        fig.add_trace(
            go.Scatter(
                x=bins,
                y=zone_data,
                mode="lines",
                name=f"Baseline {axis}",
                line=dict(dash="dash"),
            )
        )

        zone_data = lab_data[zone]
        fig.add_trace(go.Scatter(x=bins, y=zone_data, mode="lines", name=f"Labware"))

        fig.update_layout(
            title=f"Labware with Baseline",
            xaxis_title="Bins",
            yaxis_title="Photon Count",
            legend_title="Zones",
            template="plotly_white",
        )
        fig.show()

    elif plot_choice.lower() == "labware comparison":
        labwares_files = [
            baseline_labware.format(axis="x"),
            baseline_labware.format(axis="z"),
        ]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for labware_data in labwares_files:
            try:
                file = open(labware_data, "r")
            except:
                raise

            labwares_dict = json.load(file)
            if "x" in labware_data.split("_")[-1]:
                zone = "6"
            elif "z" in labware_data.split("_")[-1]:
                zone = "1"

            # Create line traces for each zone
            fig = go.Figure()

            for labware in labwares_dict:
                y_data = labwares_dict[labware][zone]
                fig.add_trace(go.Scatter(x=bins, y=y_data, mode="lines", name=labware))

            # Customize layout
            fig.update_layout(
                title=f"TOF Labware Comparison: {labware_data}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title=f"Zone: {zone}",
                template="plotly_white",
            )
            fig.show()

    elif plot_choice.lower() == "stacker comparison":
        stackers_files = [
            baseline_stacker.format(axis="x"),
            baseline_stacker.format(axis="z"),
        ]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for stacker_data in stackers_files:
            try:
                file = open(stacker_data, "r")
            except:
                raise

            stackers_dict = json.load(file)
            if "x" in stacker_data.split("_")[-1]:
                zone = "6"
            elif "z" in stacker_data.split("_")[-1]:
                zone = "1"

            # Create line traces for each zone
            fig = go.Figure()

            for stacker in stackers_dict:
                y_data = stackers_dict[stacker][zone]
                fig.add_trace(go.Scatter(x=bins, y=y_data, mode="lines", name=stacker))

            # Customize layout
            fig.update_layout(
                title=f"TOF Stacker Comparison: {stacker_data}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title=f"Zone: {zone}",
                template="plotly_white",
            )
            fig.show()

    elif plot_choice.lower() == "sensor comparison":
        sensors_files = [
            baseline_sensor.format(axis="x"),
            baseline_sensor.format(axis="z"),
        ]
        bins = list(range(1, 129))  # X-axis: Bin numbers (1 to 128)
        for sensor_data in sensors_files:
            try:
                file = open(sensor_data, "r")
            except:
                raise

            sensors_dict = json.load(file)
            if "x" in sensor_data.split("_")[-1]:
                zone = "6"
            elif "z" in sensor_data.split("_")[-1]:
                zone = "1"

            # Create line traces for each zone
            fig = go.Figure()

            for sensor in sensors_dict:
                y_data = sensors_dict[sensor][zone]
                fig.add_trace(go.Scatter(x=bins, y=y_data, mode="lines", name=sensor))

            # Customize layout
            fig.update_layout(
                title=f"TOF Sensor Comparison: {file}",
                xaxis_title="Bins",
                yaxis_title="Photon Count",
                legend_title=f"Zone: {zone}",
                template="plotly_white",
            )
            fig.show()


def create_baseline(
    histograms: Dict[int, List[List[int]]],
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
    baseline = defaultdict(list)
    if histograms:
        aggregate = defaultdict(lambda: defaultdict(list))  # type: ignore
        # Iterate through the histograms and create a map of zones to bin value
        # per index of each histogram.
        for zone, bin_list in histograms.items():
            for bins in bin_list:
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
        # print(f'RETURN: {return_zones}')
    return return_zones


def sense_labware(axis, data_df):
    # print(df)
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


def plot_something(dataframe_path: str, baseline_path: str) -> None:
    """Plots the dataframe, baseline, or both in the same graph."""
    print("Plot something!")


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


def generate_baseline(args: argparse.Namespace) -> None:
    """Generates a new baseline given the dataframe."""
    if not os.path.exists(args.dataframe):
        sys.exit(f"ERROR: Invalid dataframe file provided - {args.dataframe}")

    axis_list = args.axes
    stacker_list = args.stackers
    labware_list = args.labwares
    zone_list_x = args.zones_x or list(range(0, NUMBER_OF_ZONES))
    zone_list_z = args.zones_z or list(range(0, NUMBER_OF_ZONES))
    bins_list = args.bins or list(range(0, NUMBER_OF_BINS))
    max_samples = args.max_samples or DEFAULT_MAX_SAMPLES
    deviation = args.std or DEFAULT_STD
    zone_count_x = len(zone_list_x)
    zone_count_z = len(zone_list_z)
    bin_count = len(bins_list)

    print(
        f"\nGenerating baseline: LW={labware_list}, STD={deviation}, ZonesZ={zone_list_z}, ZonesX={zone_list_x}, Bins={bins_list}\n"
    )
    # Gather data
    samples = 0
    data = defaultdict(lambda: defaultdict(list))
    chunks = pd.read_csv(args.dataframe, chunksize=CHUNK_SIZE)
    for df in chunks:
        for row in df.itertuples(index=False, name="data"):
            zone = row.Zone
            labware = row.Labware_Name
            stacker = row.Stacker_SN
            axis = row.Axis

            # Filter out rows based on parameters
            if stacker_list and stacker not in stacker_list:
                continue
            if labware_list and labware not in labware_list:
                continue
            if axis_list and axis not in axis_list:
                continue
            if zone_list_x and zone not in zone_list_x:
                continue
            if zone_list_z and zone not in zone_list_z:
                continue

            # Get the bins
            start_index = df.columns.get_loc("Time") + 1
            bins = list(row[start_index : start_index + bin_count])
            data[axis][zone].append(bins)
            samples += 1

        if samples > max_samples:
            break

    baseline_x = create_baseline(dict(data["x"]), zone_count_x, bin_count, deviation)
    baseline_z = create_baseline(dict(data["z"]), zone_count_z, bin_count, deviation)
    if not baseline_x and not baseline_z:
        sys.exit(f"ERROR: Error generating baselines.")

    # print or save to json file
    output_file = args.output_file
    if output_file is not None:
        if not os.path.exists(output_file):
            print(f"Creating {output_file}")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump({}, f)

        print(f"Saving baseline data to - {output_file}.\n")
        with open(output_file, "r+") as file:
            definition = json.load(file)
            unique_module_data = definition.get("uniqueModuleData", {})
            tof_sensor_baseline = unique_module_data.get("TOFSensorBaseline", {})
            x_baseline = baseline_x or tof_sensor_baseline.get("X", "{}")
            z_baseline = baseline_z or tof_sensor_baseline.get("Z", "{}")
            definition.update(
                {
                    "uniqueModuleData": {
                        "TOFSensorBaseline": {
                            "X": str(x_baseline),
                            "Z": str(z_baseline),
                        }
                    }
                }
            )
            # Save to json file
            file.seek(0)
            json.dump(definition, file, indent=2)

    print("\n--------------- GENERATED BASELINES ---------------\n")
    print(
        "NOTE: If this is a definition JSON file, format it by running `make format-js` from top-level.\n"
    )

    if baseline_x:
        print("Baseline X:\n")
        print(baseline_x, "\n")
    if baseline_z:
        print("Baseline Z:\n")
        print(baseline_z, "\n")


def main(args: argparse.Namespace):
    match args.action:
        case "plot":
            plot_something(args)
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
#    elif options[selection_int] == 'Plot':
#        plots = [
#            'Baseline',
#            'Labware Data',
#            'Labware Comparison',
#            'Stacker Comparison',
#            'Sensor Comparison',
#        ]
#        for i, plot in enumerate(plots):
#            print(f'{i}) {plot}')
#        plot_choice = int(input("What to plot? "))
#        try:
#            plot_baseline(plots[plot_choice])
#        except:
#            print('No baseline data, run \'Make Baseline\' first')
#            traceback.print_exc()
#            sys.exit(1)


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
        help="The path to the generated baseline JSON file for plotting and validating labware.",
    )
    parser.add_argument(
        "--std",
        help="Standard devition to use when creating a baseline.",
        type=int,
        default=DEFAULT_STD,
    )
    parser.add_argument(
        "-o",
        "--output_file",
        help="The output file of the generated baseline, prints to stdout if ommited.",
    )
    parser.add_argument(
        "-a",
        "--axes",
        help="The axis to generate baseline for (x, z), generates both if empty.",
        default=["x", "z"],
        type=str,
        nargs="+",
    )
    parser.add_argument(
        "--zones_x",
        help="The list of zones to use for the X axis, uses 1-9 if ommited.",
        type=int,
        nargs="+",
    )
    parser.add_argument(
        "--zones_z",
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
        "-l",
        "--labwares",
        help="The list of labware to use, uses 'baseline' by default.",
        default=["baseline"],
        nargs="+",
    )
    parser.add_argument(
        "-s",
        "--stackers",
        help="The list of stacker serial number to process data for, ex. FSTA1020250401005.",
        nargs="+",
    )
    parser.add_argument(
        "--max_samples",
        help="The maximum number of samples (rows) to pricess from the dataframe.",
        type=int,
        default=DEFAULT_MAX_SAMPLES,
    )
    args = parser.parse_args()
    main(args)
