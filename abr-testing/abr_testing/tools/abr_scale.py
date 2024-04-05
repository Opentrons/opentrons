"""ABR Scale Reader."""
import os
import datetime
from hardware_testing.drivers import find_port, list_ports_and_select  # type: ignore[import]
from hardware_testing.drivers.radwag import RadwagScale  # type: ignore[import]
import argparse
from abr_testing.data_collection import read_robot_logs
from abr_testing.automation import google_sheets_tool


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
    sheet_location = read_robot_logs.create_abr_data_sheet(
        storage_directory, file_name, headers
    )
    # Set up google sheet
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
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
            read_robot_logs.write_to_sheets(
                sheet_location, google_sheet, row_list, headers
            )
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
