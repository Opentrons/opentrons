"""Updates ABR-run-data sheet with temp, rh, and lifetime."""

from abr_testing.automation import google_sheets_tool
from abr_testing.automation import google_drive_tool
import argparse
import pandas as pd
import csv
import sys
import os
from typing import Dict, Tuple, Any, List
from statistics import mean, StatisticsError
from datetime import datetime


def determine_lifetime(abr_google_sheet: Any) -> None:
    """Record lifetime % of robot, pipettes, and gripper per run."""
    # Get all data
    headers = abr_google_sheet.get_row(1)
    all_google_data = abr_google_sheet.get_all_data(expected_headers=headers)
    # Convert dictionary to pandas dataframe
    df_sheet_data = pd.DataFrame.from_dict(all_google_data)
    df_sheet_data["Start_Time"] = pd.to_datetime(
        df_sheet_data["Start_Time"], format="mixed"
    )
    df_sheet_data["End_Time"] = pd.to_datetime(
        df_sheet_data["End_Time"], format="mixed"
    )
    # Goes through dataframe per robot
    for index, run in df_sheet_data.iterrows():
        end_time = run["End_Time"]
        robot = run["Robot"]
        robot_lifetime = (
            float(run["Robot Lifetime (%)"]) if run["Robot Lifetime (%)"] != "" else 0
        )
        if robot_lifetime < 1 and len(run["Run_ID"]) > 1:
            # Get Robot % Lifetime
            robot_runs_before = df_sheet_data[
                (df_sheet_data["End_Time"] <= end_time)
                & (df_sheet_data["Robot"] == robot)
            ]
            robot_percent_lifetime = (
                (robot_runs_before["Run_Time (min)"].sum() / 60) / 3750 * 100
            )
            # Get Left Pipette % Lifetime
            left_pipette = run["Left Mount"]
            if len(left_pipette) > 1:
                left_pipette_runs_before = df_sheet_data[
                    (df_sheet_data["End_Time"] <= end_time)
                    & (
                        (df_sheet_data["Left Mount"] == left_pipette)
                        | (df_sheet_data["Right Mount"] == left_pipette)
                    )
                ]
                left_pipette_percent_lifetime = (
                    (left_pipette_runs_before["Run_Time (min)"].sum() / 60) / 1248 * 100
                )
            else:
                left_pipette_percent_lifetime = ""
            # Get Right Pipette % Lifetime
            right_pipette = run["Right Mount"]
            if len(right_pipette) > 1:
                right_pipette_runs_before = df_sheet_data[
                    (df_sheet_data["End_Time"] <= end_time)
                    & (
                        (df_sheet_data["Left Mount"] == right_pipette)
                        | (df_sheet_data["Right Mount"] == right_pipette)
                    )
                ]
                right_pipette_percent_lifetime = (
                    (right_pipette_runs_before["Run_Time (min)"].sum() / 60)
                    / 1248
                    * 100
                )
            else:
                right_pipette_percent_lifetime = ""
            # Get Gripper % Lifetime
            gripper = run["Extension"]
            if len(gripper) > 1:
                gripper_runs_before = df_sheet_data[
                    (df_sheet_data["End_Time"] <= end_time)
                    & (df_sheet_data["Extension"] == gripper)
                ]
                gripper_percent_lifetime = (
                    (gripper_runs_before["Run_Time (min)"].sum() / 60) / 3750 * 100
                )
            else:
                gripper_percent_lifetime = ""
            run_id = run["Run_ID"]
            row_num = abr_google_sheet.get_row_index_with_value(run_id, 2)
            update_list = [
                [robot_percent_lifetime],
                [left_pipette_percent_lifetime],
                [right_pipette_percent_lifetime],
                [gripper_percent_lifetime],
            ]
            abr_google_sheet.batch_update_cells(update_list, "AV", row_num, "0")
            print(f"Updated row {row_num} for run: {run_id}")


def compare_run_to_temp_data(
    abr_data: List[Dict[str, Any]], temp_data: List[Dict[str, Any]], google_sheet: Any
) -> None:
    """Read ABR Data and compare robot and timestamp columns to temp data."""
    row_update = 0
    for run in abr_data:
        run_id = run["Run_ID"]
        try:
            average_temp = float(run["Average Temp (oC)"])
        except ValueError:
            average_temp = 0
        if len(run_id) < 1 or average_temp > 0:
            continue
        else:
            # Determine which runs do not have average temp/rh data
            temps = []
            rel_hums = []
            for recording in temp_data:
                temp_robot = recording["Robot"]
                if len(recording["Timestamp"]) > 1:
                    try:
                        timestamp_str = recording["Timestamp"].split(".")[0]
                    except ValueError:
                        timestamp_str = recording["Timestamp"]
                    try:
                        timestamp = datetime.strptime(timestamp_str, "%m/%d/%Y %H:%M:%S")
                    except ValueError:
                        timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                    if (
                        temp_robot == run["Robot"]
                        and timestamp >= datetime.strptime(run["Start_Time"], "%m/%d/%Y %H:%M:%S") 
                        and timestamp <= datetime.strptime(run["End_Time"], "%m/%d/%Y %H:%M:%S")
                    ):
                        temps.append(float(recording["Temp (oC)"]))
                        rel_hums.append(float(recording["Relative Humidity (%)"]))
            try:
                avg_temps = mean(temps)
                avg_humidity = mean(rel_hums)
                row_num = google_sheet.get_row_index_with_value(run_id, 2)
                # Write average temperature
                google_sheet.update_cell("Sheet1", row_num, 46, avg_temps)
                # Write average humidity
                google_sheet.update_cell("Sheet1", row_num, 47, avg_humidity)
                row_update += 1
                # TODO: Write averages to google sheet
                print(f"Updated row {row_num}.")
            except StatisticsError:
                avg_temps = None
                avg_humidity = None
    print(f"Updated {row_update} rows with temp and RH data.")


def read_csv_as_dict(file_path: str) -> List[Dict[str, Any]]:
    """Read a CSV file and return its content as a list of dictionaries."""
    with open(file_path, mode="r", newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        data = [row for row in reader]
    return data


def connect_and_download(
    sheets: Dict[str, str], storage_directory: str
) -> Tuple[List[str], str]:
    """Connect to google sheet and download."""
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
        google_drive = google_drive_tool.google_drive(
            credentials_path,
            "1W8S3EV3cIfC-ZoRF3km0ad5XqyVkO3Tu",
            "rhyann.clarke@opentrons.com",
        )
        print("connected to gd")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    file_paths = []
    for sheet in sheets.items():
        file_name, file_id = sheet[0], sheet[1]
        print(file_name)
        file_path = google_drive.download_single_file(
            storage_directory, file_id, file_name, "text/csv"
        )
        file_paths.append(file_path)
    return file_paths, credentials_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Adds average robot ambient conditions to run sheet."
    )
    parser.add_argument(
        "--abr-data-sheet",
        type=str,
        default="1M6LSLNwvWuHQOwIwUpblF_Eyx4W5y5gXgdU3rjU2XFk",
        help="end of url of main data sheet.",
    )
    parser.add_argument(
        "--room-conditions-sheet",
        type=str,
        default="1cIjSvK_mPCq4IFqUPB7SgdDuuMKve5kJh0xyH4znAd0",
        help="end fo url of ambient conditions data sheet",
    )
    parser.add_argument(
        "--storage-directory",
        type=str,
        default="C:/Users/Rhyann Clarke/test_folder",
        help="Path to long term storage directory for run logs.",
    )
    args = parser.parse_args()
    google_sheets_to_download = {
        "ABR-run-data": args.abr_data_sheet,
        "ABR Ambient Conditions": args.room_conditions_sheet,
    }
    storage_directory = args.storage_directory
    # Download google sheets.
    file_paths, credentials_path = connect_and_download(
        google_sheets_to_download, storage_directory
    )
    # TODO: read csvs.
    abr_data = read_csv_as_dict(file_paths[0])
    temp_data = read_csv_as_dict(file_paths[1])
    # TODO: compare robot and timestamps.
    abr_google_sheet = google_sheets_tool.google_sheet(
        credentials_path, "ABR-run-data", 0
    )
    determine_lifetime(abr_google_sheet)
    compare_run_to_temp_data(abr_data, temp_data, abr_google_sheet)
