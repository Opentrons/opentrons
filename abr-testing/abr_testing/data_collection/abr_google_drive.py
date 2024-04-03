"""Read ABR run logs from google drive."""
import argparse
import os
import sys
import json
import gspread  # type: ignore[import]
from datetime import datetime, timedelta
from abr_testing.data_collection import read_robot_logs
from typing import Set, Dict, Any, Tuple, List
from abr_testing.automation import google_drive_tool, google_sheets_tool


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
) -> Tuple[Dict[Any, Dict[str, Any]], List]:
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
                tc_dict = read_robot_logs.thermocycler_commands(file_results)
                hs_dict = read_robot_logs.hs_commands(file_results)
                tm_dict = read_robot_logs.temperature_module_commands(file_results)
                notes = {"Note1": "", "Note2": ""}
                row_2 = {**row, **all_modules, **notes, **hs_dict, **tm_dict, **tc_dict}
                headers = list(row_2.keys())
                runs_and_robots[run_id] = row_2
            else:
                os.remove(file_path)
                print(f"Run ID: {run_id} has a run time of 0 minutes. Run removed.")
    return runs_and_robots, headers


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read run logs on google drive.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "folder_name",
        metavar="FOLDER_NAME",
        type=str,
        nargs=1,
        help="Google Drive folder name. Open desired folder and copy string after drive/folders/.",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    parser.add_argument(
        "email", metavar="EMAIL", type=str, nargs=1, help="opentrons gmail."
    )
    args = parser.parse_args()
    folder_name = args.folder_name[0]
    storage_directory = args.storage_directory[0]
    google_sheet_name = args.google_sheet_name[0]
    email = args.email[0]
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    try:
        google_drive = google_drive_tool.google_drive(
            credentials_path, folder_name, email
        )
        print("Connected to google drive.")
    except json.decoder.JSONDecodeError:
        print(
            "Credential file is damaged. Get from https://console.cloud.google.com/apis/credentials"
        )
        sys.exit()
    # Get run ids on google sheet
    try:
        google_sheet = google_sheets_tool.google_sheet(
            credentials_path, google_sheet_name, 0
        )
        print(f"Connected to google sheet: {google_sheet_name}")
    except gspread.exceptions.APIError:
        print("ERROR: Check google sheet name. Check credentials file.")
        sys.exit()
    run_ids_on_gs = google_sheet.get_column(2)
    run_ids_on_gs = set(run_ids_on_gs)

    # Uploads files that are not in google drive directory
    google_drive.upload_missing_files(storage_directory)

    # Run ids in google_drive_folder
    run_ids_on_gd = read_robot_logs.get_run_ids_from_google_drive(google_drive)
    missing_runs_from_gs = read_robot_logs.get_unseen_run_ids(
        run_ids_on_gd, run_ids_on_gs
    )
    # Add missing runs to google sheet
    runs_and_robots, headers = create_data_dictionary(
        missing_runs_from_gs, storage_directory
    )
    read_robot_logs.write_to_local_and_google_sheet(
        runs_and_robots, storage_directory, google_sheet_name, google_sheet, headers
    )
