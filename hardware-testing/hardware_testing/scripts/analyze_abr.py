from ast import Try
import sys, os, time, datetime
from datetime import datetime
from hardware_testing import data
import csv

def get_user_input(list, some_string):
    variable = input(some_string)
    while variable not in list:
        print(f"Your input was {variable}. Expected input is one of the following: {list}")
        variable = input(some_string)
    return variable

if __name__ == "__main__":
    ## Format Results Sheet 
    header = ["Date", "File Name", "Plate State", "Robot", "Mass (g)", "Sample"]
    time_now = datetime.now().date()
    ## Get data folders
    current_dir = data.get_testing_data_directory()
    file_list = os.listdir(current_dir)    
    folder_of_interest = get_user_input(file_list, f"Folder List, Expected Values: {file_list}: ")
    robot = folder_of_interest.split('-')[2]
    results_file_name = str(time_now) + "-" + str(robot) + "-Results.csv"
    dir_2 = os.path.join(current_dir, folder_of_interest)
    new_csv_file_path = os.path.join(current_dir, results_file_name)
    # Writing data to the new CSV file to store final results
    with open(new_csv_file_path, 'w', newline='') as csv_file:
        csv_writer = csv.writer(csv_file)
        # Write the header if needed
        csv_writer.writerow(header)
    file_list_2 = os.listdir(dir_2)
    for file in file_list_2:
        # TODO:  read through files pull out csvs analyze without pandas
        dir_3 = os.path.join(file, dir_2)
        raw_data = os.listdir(dir_3)
        raw_data_folder = os.path.join(dir_3, raw_data[0])
        raw_data_file_csv = os.listdir(raw_data_folder)[0]
        plate_state = raw_data_file_csv.split("_")[-1].split("-")[1].split(".")[0]
        sample = raw_data_file_csv.split("_")[-1].split("-")[0]
        raw_data_file_csv_path = os.path.join(raw_data_folder, raw_data_file_csv)
        try:
            with open(raw_data_file_csv_path, 'r') as file:
                # Read or process the file here
                print('read')
                lines = file.readlines()
                if lines:
                    # Get the last line
                    last_line = lines[-1].strip()
                    # Split the last line into columns
                    columns = last_line.split(',')
                    if len(columns) >= 2:
                        stable_value = columns[3]
                        date_of_measurement         = columns[0]
                        row_data = [date_of_measurement, raw_data_file_csv, plate_state, robot, stable_value, sample]
                pass
        except Exception as e:
            print(f"Error opening file: {e}")
        with open(new_csv_file_path, 'a', newline='') as csv_file:
            csv_writer = csv.writer(csv_file)
            # Write the header if needed
            csv_writer.writerow(row_data)