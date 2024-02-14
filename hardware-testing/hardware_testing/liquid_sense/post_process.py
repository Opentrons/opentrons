"""Post process script csvs."""
import csv
import os
from typing import List, Dict, Tuple
from math import isclose

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


def process_csv_directory(  # noqa: C901
    data_directory: str, tips: List[int], trials: int
) -> None:
    """Post process script csvs."""
    csv_files: List[str] = os.listdir(data_directory)
    summary: str = [f for f in csv_files if "CSVReport" in f][0]
    final_report_file: str = f"{data_directory}/final_report.csv"
    # initalize our data structs
    pressure_csvs = [f for f in csv_files if "pressure_sensor_data" in f]
    pressure_results_files: Dict[int, List[str]] = {}
    pressure_results: Dict[int, Dict[int, List[float]]] = {}
    results_settings: Dict[int, Dict[int, Tuple[float, float, float]]] = {}
    tip_offsets: Dict[int, List[float]] = {}
    p_offsets: Dict[int, List[float]] = {}
    meniscus_travel: float = 0
    for tip in tips:
        pressure_results_files[tip] = [f for f in pressure_csvs if f"tip{tip}" in f]
        pressure_results[tip] = {}
        results_settings[tip] = {}
        tip_offsets[tip] = []
        p_offsets[tip] = [i*0 for i in range(trials)]
        for trial in range(trials):
            pressure_results[tip][trial] = []
            results_settings[tip][trial] = (0.0, 0.0, 0.0)
    max_results_len = 0

    # read in all of the pressure csvs into one big struct so we can process them
    for tip in tips:
        for trial in range(trials):
            with open(
                f"{data_directory}/{pressure_results_files[tip][trial]}", newline=""
            ) as trial_csv:
                trial_reader = csv.reader(trial_csv)
                i = 0
                for row in trial_reader:
                    if i == 1:
                        results_settings[tip][trial] = (
                            float(row[2]),
                            float(row[3]),
                            float(row[4]),
                        )
                    if i > 1:
                        pressure_results[tip][trial].append(float(row[1]))
                    i += 1
                max_results_len = max([i - 2, max_results_len])
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
                if s == 45:
                    meniscus_travel = float(row[6])
                if s >= 46 and s < 46 + (trials * len(tips)):
                    # while processing this grab the tip offsets from the summary
                    tip_offsets[tips[int((s - 46) / trials)]].append(float(row[8]))
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
                    [f"pressure T{i+1}", f"z_travel T{i+1}", f"p_travel T{i+1}"]
                )

            # we want to line up the z height's of each trial at time==0
            # to do this we drop the results at the beginning of each of the trials
            # except for one with the longest tip (lower tip offset are longer tips)
            min_tip_offset = min(tip_offsets[tip])
            for tip in tips:
                for trial in range(trials):
                    for i in range(max_results_len):
                        if tip_offsets[tip][trial] > min_tip_offset:
                            print(f"tip {tip} trial {trial} tip_offsets {tip_offsets[tip][trial]} min_tip_offset {min_tip_offset}")
                            # drop this pressure result
                            pressure_results[tip][trial].pop(0)
                            # we don't want to change the length of this array so just stretch out
                            # the last value
                            pressure_results[tip][trial].append(
                                pressure_results[tip][trial][-1]
                            )
                            # decrement the offset while this is true so we can account for it later
                            tip_offsets[tip][trial] -=  0.001 * results_settings[tip][0][0]
                            # keep track of how this effects the plunger start position
                            p_offsets[tip][trial] = (i+1) * 0.001 * results_settings[tip][0][1] * -1
                            print(f"pressure_results {pressure_results[tip][trial][0]} tip_offsets {tip_offsets[tip][trial]} p_offsets {p_offsets[tip][trial]}")
                        else:
                            # we've lined up this trial so move to the next
                            break
            # write the processed test data
            for tip in tips:
                time = 0.0
                final_report_writer.writerow(pressure_header_row)
                menisucs_time = (meniscus_travel + min_tip_offset)/ results_settings[tip][0][0]
                for i in range(max_results_len):
                    pressure_row: List[str] = [f"{time}"]
                    if isclose(
                        time, menisucs_time,
                        rel_tol=0.001,
                    ):
                        pressure_row.append("Meniscus")
                    else:
                        pressure_row.append("")
                    for trial in range(trials):
                        if i < len(pressure_results[tip][trial]):
                            pressure_row.append(f"{pressure_results[tip][trial][i]}")
                        else:
                            pressure_row.append("")
                        pressure_row.append(
                            f"{results_settings[tip][trial][0] * time - tip_offsets[tip][trial]}"
                        )
                        pressure_row.append(
                            f"{abs(results_settings[tip][trial][1]) * time + p_offsets[tip][trial]}"
                        )
                    final_report_writer.writerow(pressure_row)
                    time += 0.001


if __name__ == "__main__":
    process_csv_directory("/home/ryan/testdata", [50], 10)
