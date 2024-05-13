"""Reads single run log retrieved by get_run_logs.py and saves to local csv."""
import argparse
import sys
import os
import csv
from abr_testing.data_collection import read_robot_logs
from abr_testing.data_collection import abr_google_drive

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read single run log locally saved.")
    parser.add_argument(
        "run_log_file_path",
        metavar="RUN_LOG_FILE_PATH",
        type=str,
        nargs=1,
        help="Folder path that holds individual run logs of interest.",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    args = parser.parse_args()
    run_log_file_path = args.run_log_file_path[0]
    google_sheet_name = args.google_sheet_name[0]

    try:
        credentials_path = os.path.join(run_log_file_path, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {run_log_file_path}.")
        sys.exit()
    # Get Runs from Storage and Read Logs
    run_ids_in_storage = read_robot_logs.get_run_ids_from_storage(run_log_file_path)
    runs_and_robots, header = abr_google_drive.create_data_dictionary(
        run_ids_in_storage, run_log_file_path, ""
    )
    list_of_runs = list(runs_and_robots.keys())
    # Adds Run to local csv
    sheet_location = os.path.join(run_log_file_path, "saved_data.csv")
    file_exists = os.path.exists(sheet_location) and os.path.getsize(sheet_location) > 0
    with open(sheet_location, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(header)
        for run in list_of_runs:
            # Add new row
            row = runs_and_robots[run].values()
            row_list = list(row)
            writer.writerow(row_list)