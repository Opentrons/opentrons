"""Post process script csvs."""
import csv
import os
from typing import List, Dict, Tuple

COL_TRIAL_CONVERSION = {
    1: "D",
    2: "G",
    3: "J",
    4: "M",
    5: "P",
    7: "S",
    6: "V",
    7: "Y",
    8: "AB",
    9: "AE",
    10: "AH",
    11: "AK",
    12: "AN"}
def process_csv_directory(data_directory: str, tips: List[int], trials: int) -> None:
    """Post process script csvs."""
    csv_files: List[str] = os.listdir(data_directory)
    summary: str = [f for f in csv_files if "CSVReport" in f][0]
    final_report_file: str = f"{data_directory}/final_report.csv"

    pressure_csvs = [f for f in csv_files if "pressure_sensor_data" in f]
    pressure_results_files: Dict[int, List[str]] = {}
    pressure_results: Dict[int, Dict[int, List[float]]] = {}
    results_settings: Dict[int, Dict[int, Tuple[float, float, float]]] = {}
    tip_offsets: Dict[int, List[float]] = {}
    for tip in tips:
        pressure_results_files[tip] = [f for f in pressure_csvs if f"tip{tip}" in f]
        pressure_results[tip] = {}
        results_settings[tip] = {}
        tip_offsets[tip] = []
        for trial in range(trials):
            pressure_results[tip][trial] = []
            results_settings[tip][trial] = (0.0, 0.0, 0.0)
    max_results_len = 0
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

    with open(f"{data_directory}/{summary}", newline="") as summary_csv:
        summary_reader = csv.reader(summary_csv)
        with open(final_report_file, "w", newline="") as final_report:
            # copy over the results summary
            final_report_writer = csv.writer(final_report)
            s = 0
            for row in summary_reader:
                final_report_writer.writerow(row)
                s+=1
                if (s >= 46 and s < 46+(trials*len(tips))):
                    tip_offsets[tips[int((s-46)/trials)]].append(float(row[8]))
            pressures_start_line = summary_reader.line_num + 3
            final_report_writer.writerow(
                [
                    "50ul",
                    f"A{pressures_start_line}",
                    f"{COL_TRIAL_CONVERSION[trials]}{pressures_start_line + max_results_len -1}",
                    "200ul",
                    f"A{pressures_start_line+max_results_len}",
                    f"{COL_TRIAL_CONVERSION[trials]}{pressures_start_line +(2*max_results_len)-1}",
                    "10000ul",
                    f"A{pressures_start_line+(2*max_results_len)}",
                    f"{COL_TRIAL_CONVERSION[trials]}{pressures_start_line + (3*max_results_len)-1}",
                ]
            )
            pressure_header_row = ["time"]
            for i in range(trials):
                pressure_header_row.extend(["pressure", "z_travel", "p_travel"])
            for tip in tips:
                time = 0.0
                final_report_writer.writerow(pressure_header_row)
                for i in range(max_results_len):
                    pressure_row: List[str] = [f"{time}"]
                    for trial in range(trials):
                        if i < len(pressure_results[tip][trial]):
                            pressure_row.append(f"{pressure_results[tip][trial][i]}")
                        else:
                            pressure_row.append("")
                        pressure_row.append(f"{results_settings[tip][trial][0] * time - tip_offsets[tip][trial]}")
                        pressure_row.append(f"{abs(results_settings[tip][trial][1]) * time}")
                    final_report_writer.writerow(pressure_row)
                    time += 0.001
