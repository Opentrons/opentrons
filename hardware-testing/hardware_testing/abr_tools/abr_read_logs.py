"""Read ABR run logs and save data to ABR testing csv and google sheet."""
from typing import Set, Dict, Any
import argparse
import os
import json
import sys
from datetime import datetime, timedelta
from . import read_robot_logs


def get_modules(file_results: Dict[str, str]) -> Dict[str, Any]:
    """Get module IPs and models from run log."""
    modList = (
        "heaterShakerModuleV1",
        "temperatureModuleV2",
        "magneticBlockV1",
        "thermocyclerModuleV2",
    )
    all_modules = {key: "" for key in modList}
    for module in file_results.get("modules", []):
        if isinstance(module, dict) and module.get("model") in modList:
            try:
                all_modules[module["model"]] = module["serialNumber"]
            except KeyError:
                all_modules[module["model"]] = "EMPTYSN"

    return all_modules


def create_data_dictionary(
    runs_to_save: Set[str], storage_directory: str
) -> Dict[Any, Dict[str, Any]]:
    """Pull data from run files and format into a dictionary."""
    runs_and_robots = {}
    for filename in os.listdir(storage_directory):
        file_path = os.path.join(storage_directory, filename)
        if file_path.endswith(".json"):
            with open(file_path) as file:
                file_results = json.load(file)
        else:
            continue
        run_id = file_results.get("run_id")
        if run_id in runs_to_save:
            robot = file_results.get("robot_name")
            protocol_name = file_results["protocol"]["metadata"].get("protocolName", "")
            software_version = file_results.get("API_Version", "")
            left_pipette = file_results.get("left", "")
            right_pipette = file_results.get("right", "")
            extension = file_results.get("extension", "")
            (
                num_of_errors,
                error_type,
                error_code,
                error_instrument,
                error_level,
            ) = read_robot_logs.get_error_info(file_results)
            all_modules = get_modules(file_results)

            start_time_str, complete_time_str, start_date, run_time_min = (
                "",
                "",
                "",
                0.0,
            )
            try:
                start_time = datetime.strptime(
                    file_results.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                adjusted_start_time = start_time - timedelta(hours=5)
                start_date = str(adjusted_start_time.date())
                start_time_str = str(adjusted_start_time).split("+")[0]
                complete_time = datetime.strptime(
                    file_results.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                adjusted_complete_time = complete_time - timedelta(hours=5)
                complete_time_str = str(adjusted_complete_time).split("+")[0]
                run_time = complete_time - start_time
                run_time_min = run_time.total_seconds() / 60
            except ValueError:
                pass  # Handle datetime parsing errors if necessary

            if run_time_min > 0:
                row = {
                    "Robot": robot,
                    "Run_ID": run_id,
                    "Protocol_Name": protocol_name,
                    "Software Version": software_version,
                    "Date": start_date,
                    "Start_Time": start_time_str,
                    "End_Time": complete_time_str,
                    "Run_Time (min)": run_time_min,
                    "Errors": num_of_errors,
                    "Error_Code": error_code,
                    "Error_Type": error_type,
                    "Error_Instrument": error_instrument,
                    "Error_Level": error_level,
                    "Left Mount": left_pipette,
                    "Right Mount": right_pipette,
                    "Extension": extension,
                }
                row_2 = {**row, **all_modules}
                runs_and_robots[run_id] = row_2
            else:
                os.remove(file_path)
                print(f"Run ID: {run_id} has a run time of 0 minutes. Run removed.")
    return runs_and_robots


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "file_name",
        metavar="FILE_NAME",
        type=str,
        nargs=1,
        help="Name of google sheet and local csv to save data to.",
    )
    parser.add_argument(
        "google_sheet_tab_number",
        metavar="GOOGLE_SHEET_TAB_NUMBER",
        type=int,
        nargs=1,
        help="Google sheet tab number.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    file_name = args.file_name[0]
    tab_number = args.google_sheet_tab_number[0]
    try:
        sys.path.insert(0, storage_directory)
        import google_sheets_tool  # type: ignore[import]

        credentials_path = os.path.join(storage_directory, "credentials.json")
    except ImportError:
        raise ImportError(
            "Check for google_sheets_tool.py and credentials.json in storage directory."
        )
    try:
        google_sheet = google_sheets_tool.google_sheet(
            credentials_path, file_name, tab_number=tab_number
        )
        print("Connected to google sheet.")
    except FileNotFoundError:
        print("No google sheets credentials. Add credentials to storage notebook.")
    headers = [
        "Robot",
        "Run_ID",
        "Protocol_Name",
        "Software Version",
        "Date",
        "Start_Time",
        "End_Time",
        "Run_Time (min)",
        "Errors",
        "Error_Code",
        "Error_Type",
        "Error_Instrument",
        "Error_Level",
        "Left Mount",
        "Right Mount",
        "Extension",
        "heaterShakerModuleV1",
        "temperatureModuleV2",
        "magneticBlockV1",
        "thermocyclerModuleV2",
    ]
    runs_from_storage = read_robot_logs.get_run_ids_from_storage(storage_directory)
    file_name_csv = read_robot_logs.create_abr_data_sheet(
        storage_directory, file_name, headers
    )
    runs_in_sheet = read_robot_logs.read_abr_data_sheet(
        storage_directory, file_name_csv, google_sheet
    )
    runs_to_save = read_robot_logs.get_unseen_run_ids(runs_from_storage, runs_in_sheet)
    runs_and_robots = create_data_dictionary(runs_to_save, storage_directory)
    read_robot_logs.write_to_abr_sheet(
        runs_and_robots, storage_directory, file_name_csv, google_sheet
    )
