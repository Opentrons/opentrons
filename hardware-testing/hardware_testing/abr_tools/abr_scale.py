"""ABR Scale Reader."""
import os
import sys
import datetime
from hardware_testing.drivers import find_port, list_ports_and_select
from hardware_testing.drivers.radwag import RadwagScale
from typing import Any, List
import argparse
import csv
from . import read_robot_logs


def write_to_sheets(file_name_csv: str, google_sheet: Any, row_list: List) -> None:
    """Write list to google sheet and csv."""
    sheet_location = os.path.join(storage_directory, file_name_csv)
    with open(sheet_location, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(row_list)
        print(f"Written {row_list} point to {file_name_csv}")
        # Read Google Sheet
        if google_sheet.creditals.access_token_expired:
            google_sheet.gc.login()
        google_sheet.write_header(headers)
        google_sheet.update_row_index()
        google_sheet.write_to_row(row_list)
        print(f"Written {row_list} to google sheet.")


if __name__ == "__main__":
    # Adds Arguments
    parser = argparse.ArgumentParser(description="Record stable mass for labware.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for scale .csvs.",
    )
    parser.add_argument(
        "file_name",
        metavar="FILE_NAME",
        type=str,
        nargs=1,
        help="Name of google sheet and local csv to save data to.",
    )
    parser.add_argument("robot", metavar="ROBOT", type=str, nargs=1, help="Robot name.")
    parser.add_argument(
        "labware_name",
        metavar="LABWARE_NAME",
        type=str,
        nargs=1,
        help="Name of labware.",
    )
    parser.add_argument(
        "protocol_step",
        metavar="PROTOCOL_STEP",
        type=str,
        nargs=1,
        help="1 for empty plate, 2 for filled plate, 3 for end of protocol.",
    )
    args = parser.parse_args()
    robot = args.robot[0]
    labware = args.labware_name[0]
    protocol_step = args.protocol_step[0]
    storage_directory = args.storage_directory[0]
    file_name = args.file_name[0]
    file_name_csv = file_name + ".csv"
    # find port using known VID:PID, then connect
    vid, pid = RadwagScale.vid_pid()
    try:
        scale = RadwagScale.create(port=find_port(vid=vid, pid=pid))
    except RuntimeError:
        device = list_ports_and_select()
        scale = RadwagScale.create(device)
    scale.connect()
    grams = 0.0
    is_stable = False
    # Set up csv sheet
    headers = ["Robot", "Date", "Timestamp", "Labware", "Mass (g)", "Measurement Step"]
    all_data_csv = read_robot_logs.create_abr_data_sheet(
        storage_directory, file_name, headers
    )
    # Set up google sheet
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
            credentials_path, file_name, tab_number=0
        )
        print("Connected to google sheet.")
    except FileNotFoundError:
        print("No google sheets credentials. Add credentials to storage notebook.")
    # Scale Loop
    break_all = False
    while is_stable is False:
        grams, is_stable = scale.read_mass()
        print(f"Scale reading: grams={grams}, is_stable={is_stable}")
        time_now = datetime.datetime.now()
        date = str(time_now.date())
        row = [robot, date, str(time_now), labware, grams, protocol_step]
        row_list = list(row)
        while is_stable is True:
            print("is stable")
            write_to_sheets(file_name_csv, google_sheet, row_list)
            is_stable = False
            y_or_no = input("Do you want to weigh another sample? (Y/N): ")
            if y_or_no == "Y":
                # Uses same storage directory and file.
                robot = input("Robot: ")
                labware = input("Labware: ")
                protocol_step = input("Measurement Step (1,2,3): ")
            elif y_or_no == "N":
                break_all = True
        if break_all:
            break
