"""Post process script csvs."""
import csv
import math
import os
import statistics
import traceback
from typing import List, Dict, Tuple, Any, Optional

from hardware_testing.data import ui

try:
    from abr_testing.automation import google_sheets_tool
except ImportError:
    ui.print_error(
        "Unable to import abr repo if this isn't a simulation push the abr_testing package"
    )
    from . import google_sheets_tool  # type: ignore[no-redef]

    pass

COL_TRIAL_CONVERSION = {
    1: "E",
    2: "H",
    3: "K",
    4: "N",
    5: "Q",
    6: "T",
    7: "W",
    8: "Z",
    9: "AC",
    10: "AF",
    11: "AI",
    12: "AL",
    13: "AO",
}


def _get_pressure_results(result_file: str) -> Tuple[float, float, float, List[float]]:
    z_velocity: float = 0.0
    p_velocity: float = 0.0
    threshold: float = 0.0
    pressures: List[float] = []
    with open(result_file, newline="") as trial_csv:
        trial_reader = csv.reader(trial_csv)
        i = 0
        for row in trial_reader:
            if i == 1:
                z_velocity = float(row[2])
                p_velocity = float(row[3])
                threshold = float(row[4])
            if i > 1:
                pressures.append(float(row[1]))
            i += 1
    return z_velocity, p_velocity, threshold, pressures


def process_csv_directory(  # noqa: C901
    data_directory: str,
    tips: List[int],
    trials: int,
    google_sheet: Optional[Any],
    google_drive: Optional[Any],
    sheet_name: str,
    sheet_id: Optional[str],
    new_folder_name: Optional[str],
    make_graph: bool = False,
) -> None:
    """Post process script csvs."""
    csv_files: List[str] = os.listdir(data_directory)
    summary: str = [f for f in csv_files if "CSVReport" in f][0]
    final_report_file: str = f"{data_directory}/final_report.csv"
    # initialize our data structs
    primary_pressure_csvs = [f for f in csv_files if "PRIMARY" in f]
    secondary_pressure_csvs = [f for f in csv_files if "SECONDARY" in f]
    primary_pressure_results_files: Dict[int, List[str]] = {}
    secondary_pressure_results_files: Dict[int, List[str]] = {}
    pressure_results: Dict[int, Dict[int, List[Tuple[float, float]]]] = {}
    results_settings: Dict[int, Dict[int, Tuple[float, float, float]]] = {}
    tip_offsets: Dict[int, List[float]] = {}
    p_offsets: Dict[int, List[float]] = {}
    meniscus_travel: float = 0
    for tip in tips:
        primary_pressure_results_files[tip] = [
            f for f in primary_pressure_csvs if f"tip{tip}" in f
        ]
        secondary_pressure_results_files[tip] = [
            f for f in secondary_pressure_csvs if f"tip{tip}" in f
        ]
        pressure_results[tip] = {}
        results_settings[tip] = {}
        tip_offsets[tip] = []
        p_offsets[tip] = [i * 0 for i in range(trials)]
        for trial in range(trials):
            pressure_results[tip][trial] = []
            results_settings[tip][trial] = (0.0, 0.0, 0.0)
    max_results_len = 0

    # read in all of the pressure csvs into one big struct so we can process them
    for tip in tips:
        for trial in range(trials):
            z_velocity: float = 0.0
            p_velocity: float = 0.0
            threshold: float = 0.0
            primary_pressures: List[float] = []
            secondary_pressures: List[float] = []
            if trial < len(primary_pressure_results_files[tip]):
                (
                    z_velocity,
                    p_velocity,
                    threshold,
                    primary_pressures,
                ) = _get_pressure_results(
                    f"{data_directory}/{primary_pressure_results_files[tip][trial]}"
                )
            if trial < len(secondary_pressure_results_files[tip]):
                (
                    z_velocity,
                    p_velocity,
                    threshold,
                    secondary_pressures,
                ) = _get_pressure_results(
                    f"{data_directory}/{secondary_pressure_results_files[tip][trial]}"
                )
            results_settings[tip][trial] = (z_velocity, p_velocity, threshold)
            for i in range(max(len(primary_pressures), len(secondary_pressures))):
                p = primary_pressures[i] if i < len(primary_pressures) else 0.0
                s = secondary_pressures[i] if i < len(secondary_pressures) else 0.0
                pressure_results[tip][trial].append((p, s))
            max_results_len = max([len(pressure_results[tip][trial]), max_results_len])
    # start writing the final report csv
    with open(f"{data_directory}/{summary}", newline="") as summary_csv:
        summary_reader = csv.reader(summary_csv)
        with open(final_report_file, "w", newline="") as final_report:
            # copy over the results summary
            final_report_writer = csv.writer(final_report)
            s = 0
            for row in summary_reader:
                final_report_writer.writerow(row)
                s += 1
                if s == 44:
                    meniscus_travel = float(row[6])
                if s >= 45 and s < 45 + (trials * len(tips)):
                    # while processing this grab the tip offsets from the summary
                    tip_offsets[tips[int((s - 45) / trials)]].append(float(row[8]))
            # summary_reader.line_num is the last line in the summary that has text
            pressures_start_line = summary_reader.line_num + 3
            # calculate where the start and end of each block of data we want to graph
            final_report_writer.writerow(
                [
                    "50ul",
                    f"A{pressures_start_line-1}",
                    f"{COL_TRIAL_CONVERSION[trials]}{pressures_start_line + max_results_len -1}",
                    "200ul",
                    f"A{pressures_start_line+max_results_len-1}",
                    f"{COL_TRIAL_CONVERSION[trials]}{pressures_start_line +(2*max_results_len)-1}",
                    "10000ul",
                    f"A{pressures_start_line+(2*max_results_len-1)}",
                    f"{COL_TRIAL_CONVERSION[trials]}{pressures_start_line + (3*max_results_len)-1}",
                ]
            )

            # build a header row
            pressure_header_row = ["time", ""]
            for i in range(trials):
                pressure_header_row.extend(
                    [
                        f"primary pressure T{i+1}",
                        f"secondary pressure T{i+1}",
                        f"z_travel T{i+1}",
                        f"p_travel T{i+1}",
                    ]
                )
            # Add header to google sheet
            if google_sheet:
                try:
                    pressure_header_for_google_sheet = [
                        [x] for x in pressure_header_row
                    ]
                    google_sheet.batch_update_cells(
                        pressure_header_for_google_sheet, "H", 10, sheet_id
                    )
                except google_sheets_tool.google_interaction_error:
                    ui.print_error("Header did not write on google sheet.")
            # we want to line up the z height's of each trial at time==0
            # to do this we drop the results at the beginning of each of the trials
            # except for one with the longest tip (lower tip offset are longer tips)
            min_tip_offset = 0.0
            if make_graph:
                for tip in tips:
                    min_tip_offset = min(tip_offsets[tip])
                    for trial in range(trials):
                        for i in range(max_results_len):
                            if tip_offsets[tip][trial] > min_tip_offset:
                                # drop this pressure result
                                pressure_results[tip][trial].pop(0)
                                # we don't want to change the length of this array so just
                                # stretch out the last value
                                pressure_results[tip][trial].append(
                                    pressure_results[tip][trial][-1]
                                )
                                # decrement the offset while this is true
                                # so we can account for it later
                                tip_offsets[tip][trial] -= (
                                    0.001 * results_settings[tip][0][0]
                                )
                                # keep track of how this effects the plunger start position
                                p_offsets[tip][trial] = (
                                    (i + 1) * 0.001 * results_settings[tip][0][1] * -1
                                )
                            else:
                                # we've lined up this trial so move to the next
                                break
            # write the processed test data
            for tip in tips:
                time = 0.0
                final_report_writer.writerow(pressure_header_row)
                meniscus_time = (meniscus_travel + min_tip_offset) / results_settings[
                    tip
                ][0][0]
                pressure_rows = []
                for i in range(max_results_len):
                    pressure_row: List[str] = [f"{time}"]
                    if math.isclose(
                        time,
                        meniscus_time,
                        rel_tol=0.001,
                    ):
                        pressure_row.append("Meniscus")
                    else:
                        pressure_row.append("")
                    for trial in range(trials):
                        if i < len(pressure_results[tip][trial]):
                            pressure_row.append(f"{pressure_results[tip][trial][i][0]}")
                            pressure_row.append(f"{pressure_results[tip][trial][i][1]}")
                        else:
                            pressure_row.append("")
                            pressure_row.append("")
                        pressure_row.append(
                            f"{results_settings[tip][trial][0] * time - tip_offsets[tip][trial]}"
                        )
                        pressure_row.append(
                            f"{abs(results_settings[tip][trial][1]) * time + p_offsets[tip][trial]}"
                        )
                    final_report_writer.writerow(pressure_row)
                    # Add pressure to google sheet
                    pressure_rows.append(pressure_row)
                    time += 0.001

                if google_sheet:
                    transposed_pressure_rows = list(map(list, zip(*pressure_rows)))
                    try:
                        google_sheet.batch_update_cells(
                            transposed_pressure_rows, "H", 11, sheet_id
                        )
                    except google_sheets_tool.google_interaction_error:
                        ui.print_error("Did not write pressure data to google sheet.")
                if google_drive:
                    new_folder_id = google_drive.create_folder(new_folder_name)
                    google_drive.upload_file(final_report_file, new_folder_id)


def process_google_sheet(
    google_sheet: Optional[Any],
    run_args: Any,
    test_info: List,
    sheet_id: Optional[str],
) -> None:
    """Write results and graphs to google sheet."""
    if not google_sheet:
        return
    sheet_name = run_args.run_id  # type: ignore[attr-defined]
    test_parameters = [
        [
            "Run ID",
            "Serial Number",
            "Pipette Type",
            "Tip Size",
            "Z Speed (mm/s)",
            "Plunger Speed (mm/s)",
            "Threshold (pascal)",
            "Direction",
            "Target Height (mm)",
        ],
        test_info,
    ]
    num_of_trials = run_args.trials  # type: ignore[attr-defined]
    google_sheet.batch_update_cells(test_parameters, "A", 1, sheet_id)
    target_height = google_sheet.get_cell(sheet_name, "B9")
    ui.print_info(target_height)
    last_trial_row = 10 + num_of_trials
    adjusted_height_range = "E11:E" + str(last_trial_row)
    adjusted_height = google_sheet.get_single_col_range(
        sheet_name, adjusted_height_range
    )
    normalized_height = [
        float(height) - float(target_height) for height in adjusted_height
    ]
    google_sheet.batch_update_cells([normalized_height], "F", 11, sheet_id)
    # Find accuracy, precision, repeatability
    try:
        accuracy = statistics.mean(normalized_height)
        precision = (max(normalized_height) - min(normalized_height)) / 2
        repeatability_error = statistics.stdev(normalized_height) / math.sqrt(
            len(normalized_height)
        )
        summary = [
            ["Accuracy (mm)", "Precision (+/- mm)", "Repeatability (%)"],
            [accuracy, precision, 100.0 - 100.0 * repeatability_error],
        ]
        google_sheet.batch_update_cells(summary, "D", 2, sheet_id)
    except google_sheets_tool.google_interaction_error:
        ui.print_error("stats didn't work.")

    # Create Graphs
    # 1. Create pressure vs time graph zoomed out
    titles = ["Pressure vs Time", "Time (s)", "Pressure (P)", ""]
    axis_pressure_vs_time = [
        {"position": "BOTTOM_AXIS", "title": titles[1]},
        {"position": "LEFT_AXIS", "title": titles[2]},
        {"position": "RIGHT_AXIS", "title": titles[3]},
    ]
    # TODO: Create less hard coded zoom in
    ui.print_info("starting to make graphs")
    domains_pressure = [
        {
            "domain": {
                "sourceRange": {
                    "sources": [
                        {
                            "sheetId": sheet_id,
                            "startRowIndex": 9,
                            "endRowIndex": 1494,
                            "startColumnIndex": 7,
                            "endColumnIndex": 8,
                        }
                    ]
                }
            }
        }
    ]
    series_pressure = []
    for i in range(num_of_trials):
        series_dict = {
            "series": {
                "sourceRange": {
                    "sources": [
                        {
                            "sheetId": sheet_id,
                            "startRowIndex": 9,
                            "endRowIndex": 1494,
                            "startColumnIndex": 9 + 4 * i,
                            "endColumnIndex": 10 + 4 * i,
                        }
                    ]
                }
            },
            "targetAxis": "LEFT_AXIS",
        }
        series_pressure.append(series_dict)
    try:
        google_sheet.create_line_chart(
            titles,
            series_pressure,
            domains_pressure,
            axis_pressure_vs_time,
            0,
            sheet_id,
        )
    except Exception as e:
        ui.print_error("did not make pressure vs time graph.")
        ui.print_error(f"got error {e}")
        ui.print_error(traceback.format_exc())

    # 2. Height vs Offset Comparison
    heights_range = "B11:B" + str(last_trial_row)
    heights = google_sheet.get_single_col_range(sheet_name, heights_range)
    axis = [
        {"position": "BOTTOM_AXIS", "title": titles[1]},
        {
            "position": "LEFT_AXIS",
            "title": titles[2],
            "viewWindowOptions": {
                "viewWindowMin": float(min(heights)) - 1,
                "viewWindowMax": float(max(heights)) + 1,
            },
        },
        {"position": "RIGHT_AXIS", "title": titles[3]},
    ]
    domain_trials = [
        {
            "domain": {
                "sourceRange": {
                    "sources": [
                        {
                            "sheetId": sheet_id,
                            "startRowIndex": 9,
                            "endRowIndex": last_trial_row,
                            "startColumnIndex": 0,
                            "endColumnIndex": 1,
                        }
                    ]
                }
            }
        }
    ]
    series_offsets = [
        {
            "series": {
                "sourceRange": {
                    "sources": [
                        {
                            "sheetId": sheet_id,
                            "startRowIndex": 9,
                            "endRowIndex": last_trial_row,
                            "startColumnIndex": 1,
                            "endColumnIndex": 2,
                        }
                    ]
                }
            },
            "targetAxis": "LEFT_AXIS",
            "lineStyle": {"type": "MEDIUM_DASHED"},
            "pointStyle": {"size": 5},
        },
        {
            "series": {
                "sourceRange": {
                    "sources": [
                        {
                            "sheetId": sheet_id,
                            "startRowIndex": 9,
                            "endRowIndex": last_trial_row,
                            "startColumnIndex": 3,
                            "endColumnIndex": 4,
                        }
                    ]
                }
            },
            "targetAxis": "RIGHT_AXIS",
            "lineStyle": {"type": "MEDIUM_DASHED"},
            "pointStyle": {"size": 5},
        },
    ]
    titles = [
        "Height & Offset Comparison",
        "Trials",
        "Measured Height (mm)",
        "Tip Length Offset (mm)",
    ]
    try:
        google_sheet.create_line_chart(
            titles, series_offsets, domain_trials, axis, 14, sheet_id
        )
    except Exception as e:
        ui.print_error("did not make height vs offset graph.")
        ui.print_error(f"got error {e}")
        ui.print_error(traceback.format_exc())

    # 3. Liquid Level Detection
    lld_titles = ["Liquid Level Detection", "Trials", "Normalized Height", ""]
    series_normalized_height = [
        {
            "series": {
                "sourceRange": {
                    "sources": [
                        {
                            "sheetId": sheet_id,
                            "startRowIndex": 9,
                            "endRowIndex": last_trial_row,
                            "startColumnIndex": 5,
                            "endColumnIndex": 6,
                        }
                    ]
                }
            },
            "targetAxis": "LEFT_AXIS",
            "lineStyle": {"type": "MEDIUM_DASHED"},
            "pointStyle": {"size": 5},
        }
    ]
    normalized_axis = [
        {"position": "BOTTOM_AXIS", "title": titles[1]},
        {
            "position": "LEFT_AXIS",
            "title": titles[2],
            "viewWindowOptions": {
                "viewWindowMin": float(min(normalized_height)) - 0.5,
                "viewWindowMax": float(max(normalized_height)) + 0.5,
            },
        },
        {"position": "RIGHT_AXIS", "title": titles[3]},
    ]
    try:
        google_sheet.create_line_chart(
            lld_titles,
            series_normalized_height,
            domain_trials,
            normalized_axis,
            21,
            sheet_id,
        )
    except Exception as e:
        ui.print_error("did not make lld graph.")
        ui.print_error(f"got error {e}")
        ui.print_error(traceback.format_exc())

    # TODO: create a better way to zoom into graph based on slope change
    axis_zoomed = [
        {
            "position": "BOTTOM_AXIS",
            "title": titles[1],
            "viewWindowOptions": {"viewWindowMin": 0.75, "viewWindowMax": 1.5},
        },
        {"position": "LEFT_AXIS", "title": titles[2]},
        {"position": "RIGHT_AXIS", "title": titles[3]},
    ]
    titles_zoomed = ["Pressure vs Time Zoomed", "Time (s)", "Pressure (P)", ""]
    try:
        google_sheet.create_line_chart(
            titles_zoomed, series_pressure, domains_pressure, axis_zoomed, 7, sheet_id
        )
    except Exception as e:
        ui.print_error("did not make zoomed in pressure chart.")
        ui.print_error(f"got error {e}")
        ui.print_error(traceback.format_exc())


#
# if __name__ == "__main__":
#    process_csv_directory("/home/ryan/testdata", [50], 10)
