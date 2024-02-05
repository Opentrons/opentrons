"""ABR Scale Measurement Analyzer."""
import os
from datetime import datetime
from hardware_testing import data
import csv
from typing import List


def _get_user_input(list: List, some_string: str) -> str:
    variable = input(some_string)
    while variable not in list:
        print(
            f"Your input was {variable}. Expected input is one of the following: {list}"
        )
        variable = input(some_string)
    return variable


if __name__ == "__main__":
    # Format Results Sheet
    header = ["Date", "File Name", "Plate State", "Robot", "Mass (g)", "Sample"]
    time_now = datetime.now().date()
    # Get data folders
    current_dir = data.get_testing_data_directory()
    file_list = os.listdir(current_dir)
    folder_of_interest = _get_user_input(
        file_list, f"Folder List, Expected Values: {file_list}: "
    )
    robot = folder_of_interest.split("-")[2]
    results_file_name = str(time_now) + "-" + str(robot) + "-Results.csv"
    dir_2 = os.path.join(current_dir, folder_of_interest)
    new_csv_file_path = os.path.join(current_dir, results_file_name)
    file_list_2 = os.listdir(dir_2)  # LIST OF individual run folders
    for file2 in file_list_2:
        raw_data_folder = os.path.join(dir_2, file2)
        raw_data_file_csv = os.listdir(raw_data_folder)[0]
        plate_state = raw_data_file_csv.split("_")[-1].split("-")[1].split(".")[0]
        sample = raw_data_file_csv.split("_")[-1].split("-")[0]
        raw_data_file_csv_path = os.path.join(raw_data_folder, raw_data_file_csv)
        try:
            with open(raw_data_file_csv_path, "r") as f:
                for line in f:
                    # Process the file here
                    columns = line.split(",")
                    if len(columns) >= 2:
                        stable_value = columns[4]
                        date_of_measurement = columns[0]
                        date = str(date_of_measurement).split(" ")[0]
                        row_data = (
                            date,
                            raw_data_file_csv,
                            plate_state,
                            robot,
                            stable_value,
                            sample,
                        )
                pass
        except Exception as e:
            print(f"Error opening file: {e}")
        # WRITE HEADER
        with open(new_csv_file_path, "w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)
            csv_writer.writerow(header)
        with open(new_csv_file_path, "a", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)
            # Write data
            csv_writer.writerows([row_data])
