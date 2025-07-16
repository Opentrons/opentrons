"""Record HEPA UV Testing."""
import datetime
import argparse
from typing import List, Any
from abr_testing.automation import google_sheets_tool
import os
import sys
import json


def get_hepa_serials(storage_directory: str) -> List[List[Any]]:
    """Get HEPA / UV Serial Number."""
    try:
        ips_path = os.path.join(storage_directory, "IPs.json")
        ip_file = json.load(open(ips_path))
        robot_dict = ip_file.get("ip_address_list")
    except FileNotFoundError:
        print(f"Add IPs.json file to: {storage_directory}.")
        sys.exit()
    robot_name_and_hepa_serial = list(map(list, (zip(*robot_dict.values()))))
    return robot_name_and_hepa_serial


def turning_uv_and_hepa_on(
    google_sheet: google_sheets_tool.google_sheet, all_robots: List[List[Any]]
) -> None:
    """Create set of lines to add to google sheet."""
    today = datetime.date.today()
    formatted_date = today.strftime("%-m/%-d/%Y")
    timestamp = datetime.datetime.now()
    formatted_timestamp = timestamp.strftime("%-m/%-d/%Y %H:%M:%S")
    num_robots = len(all_robots[0])
    blank_column = [""] * num_robots
    date_column = [formatted_date] * num_robots
    fan_start_column = [formatted_timestamp] * num_robots
    uv_cycles_column = [1] * num_robots
    uv_duration_column = [15] * num_robots

    all_columns = [
        date_column,
        all_robots[0],
        all_robots[1],
        fan_start_column,
        blank_column,
        blank_column,
        blank_column,
        uv_cycles_column,
        uv_duration_column,
    ]

    start_row = google_sheet.get_index_row() + 1
    google_sheet.batch_update_cells(all_columns, "A", start_row, "1790601450")


def turning_hepa_off_and_uv_on(
    google_sheet: google_sheets_tool.google_sheet, all_robots: List[List[str]]
) -> None:
    """Records when Hepa is Turned Off and UV on."""
    # List of Expected Headers
    expected_headers = {
        "Date",
        "Robot",
        "Hepa Filter Serial",
        "Fan Start Time",
        "Fan Stop Time",
        "Fan On Duration (timestamp)",
        "Fan On Duration (min)",
        "UV # of Cycles",
        "UV Duration (min)",
        "Errors",
        "Level",
        "Description",
    }
    all_data = google_sheet.get_all_data(expected_headers)
    todays_rows = []

    # Initialize column-wise lists
    dates, robots, hepa_serials = [], [], []
    fan_start_times, fan_stop_times, durations, durations_min = [], [], [], []
    uv_cycles, uv_durations, errors, levels, descriptions = [], [], [], [], []

    # Timestamp formatting
    today = datetime.date.today()
    formatted_date = today.strftime("%-m/%-d/%Y")
    timestamp = datetime.datetime.now()
    formatted_timestamp = timestamp.strftime("%-m/%-d/%Y %H:%M:%S")

    # Process matching rows
    for row in all_data:
        if (row["Date"] == formatted_date) and (row["Robot"] in all_robots[0]):
            start_time_str = row["Fan Start Time"]
            start_time = datetime.datetime.strptime(start_time_str, "%m/%d/%Y %H:%M:%S")

            duration = timestamp - start_time
            duration_str = str(duration)
            duration_min = duration.total_seconds() / 60

            # Update row with new info
            row["Fan Stop Time"] = formatted_timestamp
            row["Fan On Duration (timestamp)"] = duration_str
            row["Fan On Duration (min)"] = duration_min
            row["UV # of Cycles"] = 2
            row["UV Duration (min)"] = 30

            todays_rows.append(row)

            # Populate columns
            dates.append(row["Date"])
            robots.append(row["Robot"])
            hepa_serials.append(row["Hepa Filter Serial"])
            fan_start_times.append(row["Fan Start Time"])
            fan_stop_times.append(row["Fan Stop Time"])
            durations.append(duration_str)
            durations_min.append(duration_min)
            uv_cycles.append(2)
            uv_durations.append(30)
            errors.append(row.get("Errors", ""))
            levels.append(row.get("Level", ""))
            descriptions.append(row.get("Description", ""))

    # Combine all columns into a nested list
    nested_list = [
        dates,
        robots,
        hepa_serials,
        fan_start_times,
        fan_stop_times,
        durations,
        durations_min,
        uv_cycles,
        uv_durations,
        errors,
        levels,
        descriptions,
    ]
    last_row_index = google_sheet.get_index_row() + 1
    starting_row_index = last_row_index - len(all_robots[0])
    row_nums = list(range(starting_row_index, last_row_index))
    row_indices = [i - 1 for i in row_nums]  # API needs 0-based
    google_sheet.batch_delete_rows(row_indices, "1790601450")
    google_sheet.update_row_index()
    google_sheet.batch_update_cells(nested_list, "A", starting_row_index, "1790601450")


def run(
    turning_hepa_fan: str,
    google_sheet_name: str,
    storage_directory: str,
) -> None:
    """Main control function."""
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    hepa_uv_sheet = google_sheets_tool.google_sheet(credentials_path, "ABR-run-data", 5)
    robot_names_and_hepa_serials = get_hepa_serials(storage_directory)
    answer = input("Do you want to exclude any robots?")
    if answer.lower == "y":
        robots_to_exclude = input(
            "Enter robots you want to exclude in a comma separated list: "
        )
        exclude_list = [r.strip() for r in robots_to_exclude.split(",")]
        robots = robot_names_and_hepa_serials[0]
        serials = robot_names_and_hepa_serials[1]
        # Zip robots and serials into pairs, filter, then unzip back
        filtered_pairs = [
            (r, s) for r, s in zip(robots, serials) if r not in exclude_list
        ]
        # Unzip into separate lists again
        filtered_robots, filtered_serials = (
            zip(*filtered_pairs) if filtered_pairs else ([], [])
        )
        robot_names_and_hepa_serials = [list(filtered_robots), list(filtered_serials)]

    if turning_hepa_fan == "on":
        turning_uv_and_hepa_on(hepa_uv_sheet, robot_names_and_hepa_serials)
    else:
        turning_hepa_off_and_uv_on(hepa_uv_sheet, robot_names_and_hepa_serials)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Record HEPA/UV Actions")
    parser.add_argument(
        "turning_hepa_fan",
        metavar="-hepa",
        type=str,
        nargs=1,
        help="'on' or 'off'",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="-google_sheet",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    parser.add_argument(
        "storage_directory",
        metavar="-storage_directory",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    args = parser.parse_args()
    turning_hepa_fan = args.turning_hepa_fan[0]
    google_sheet_name = args.google_sheet_name[0]
    storage_directory = args.storage_directory[0]
    run(turning_hepa_fan, google_sheet_name, storage_directory)
