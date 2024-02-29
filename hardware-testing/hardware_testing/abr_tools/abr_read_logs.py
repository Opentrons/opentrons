from .abr_robots import ABR_IPS
from .abr_run_logs import get_run_ids_from_storage, get_unseen_run_ids
from typing import Set, Dict, Tuple
import argparse
import os
import csv
import json
from datetime import datetime

def get_command_info(file_results: Dict[str, str]) -> Dict[str,int]:
    """Summarize actions that occurred in run log."""
    all_commands = dict()
    for command in file_results["commands"]:
        try:
            pipette = command["params"]["pipetteId"]
        except (KeyError, TypeError):
            pipette = command["params"].get("model", command["params"].get("moduleId", ""))
        command_and_tool = command["commandType"] + "_" + pipette
        if command_and_tool in all_commands:
            all_commands[command_and_tool] += 1
        else:
            all_commands[command_and_tool] = 1
    return all_commands

def get_modules(file_results: Dict[str, str]) -> Dict[str, str]:
    all_modules = dict()
    for module in file_results["modules"]:
        try:
            all_modules[module["model"]] = module["serialNumber"]
        except KeyError:
            all_modules[module["model"]] = ""
            
    return all_modules
        

def get_error_info(file_results: Dict[str, str])-> Tuple[int, str, str, str]:
    """Determines if errors exist in run log and documents them."""
    # Determine what level error
    error_codes = set()
    # with open('/hardware_testing/abr_tools/ErrorLevels.csv') as csv_start:
    #     data = csv.DictReader(csv_start)
    #     headers = data.fieldnames
    #     error_codes["Error_Code"] = data["Error Code"]
    #     error_codes["Level_of_Failure"] = data["Level of Failure"]
    num_of_errors = len(file_results["errors"])
    if num_of_errors > 0:
        commands = file_results["commands"]
        for n in commands:
            try:
                error = len(n["error"])
                if error > 1:
                    error_type = n["error"]["errorType"]
                    error_code = n["error"]["errorCode"]
                    try:
                        # Instrument Error
                        error_instrument = n["error"]["errorInfo"]["node"]
                    except:
                        # Module Error
                        error_instrument = n["error"]["errorInfo"]["port"]
            except:
                error_type = ""
                error_code = ""
                error_instrument = ""
    else:
        error_type = ""
        error_code = ""
        error_instrument = ""
    return num_of_errors, error_type, error_code, error_instrument
    

def create_abr_data_sheet(storage_directory) -> None:
    """Creates csv file to log ABR data"""
    sheet_location = os.path.join(storage_directory,"ABR-run-data.csv")
    with open(sheet_location, 'w') as csvfile:
        writer = csv.writer(csvfile)
        
def create_dicts_to_add_to_sheet(runs_to_save: Set[str], storage_directory: str):
    list_of_files = os.listdir(storage_directory)
    runs_and_robots = dict()
    for this_file in list_of_files:
        read_file = os.path.join(storage_directory, this_file)
        try: 
            file_results = json.load(open(read_file))
        except json.JSONDecodeError:
            print(f"Ignoring unparsable file {read_file}.")
            continue
        run_id = file_results["run_id"]
        if run_id in runs_to_save:
            robot = file_results["robot_name"]
            run_id = file_results["run_id"]
            protocolName = file_results["protocol"]["metadata"]["protocolName"]
            try:
                softwareV = file_results["API_Version"]
                left_pipette = file_results["left"]
                right_pipette = file_results["right"]
                extension = file_results["extension"]
            except KeyError:
                softwareV = None
                left_pipette = None
                right_pipette = None
                extension = None
            num_of_errors, error_type, error_code, error_instrument = get_error_info(file_results)
            all_modules = get_modules(file_results)
            try:
                start_time = datetime.strptime(file_results["startedAt"], "%Y-%m-%dT%H:%M:%S.%f%z")
                start_date = start_time.date()
                start_time_str = str(start_time).split("+")[0]
                complete_time = datetime.strptime(file_results["completedAt"], "%Y-%m-%dT%H:%M:%S.%f%z")
                complete_time_str = str(complete_time).split("+")[0]
                run_time = complete_time - start_time
                run_time_min = run_time.total_seconds() / 60
            except KeyError:
                complete_time = ""
                start_time = ""
                start_date = ""
                run_time_min = 0
            row = {
                    "Robot": robot, 
                   "Run_ID": run_id, 
                   "Protocol_Name": protocolName, 
                    "Software Version": softwareV,
                   "Date": start_date, 
                   "Start_Time": start_time_str,
                   "End_Time": complete_time_str,
                   "Run_Time (min)": run_time_min, 
                   "Errors": num_of_errors,
                   "Error_Code": error_code,
                   "Error_Type": error_type,
                   "Error_Instrument": error_instrument,
                   "Left Mount": left_pipette,
                   "Right_Mount" : right_pipette, 
                   "Extension": extension,
                   }
            row_2 = {**row, **all_modules}
            runs_and_robots[run_id] = row_2
    return runs_and_robots
            

def read_abr_data_sheet(runs_from_storage, storage_directory: str) -> Set[str]:
    """Reads current run sheet to determine what new run data should be added."""
    sheet_location = os.path.join(storage_directory,"ABR-run-data.csv")
    print(sheet_location)
    runs_in_sheet = set()
    # Read the CSV file
    with open(sheet_location, 'r') as csv_start:
        data = csv.DictReader(csv_start)
        headers = data.fieldnames
        print(headers)
        for row in data:
            run_id = row[headers[0]]
            runs_in_sheet.add(run_id)
    return runs_in_sheet

def write_to_abr_sheet(runs_and_robots: Dict[str, str], storage_directory: str, runs_to_save):
    sheet_location = os.path.join(storage_directory,"ABR-run-data.csv")
    #print(list(runs_and_robots.keys()))
    list_of_runs = list(runs_and_robots.keys())
    with open(sheet_location, "w", newline="") as f:
        writer = csv.writer(f)
        for run in range(len(list_of_runs)):
            row = runs_and_robots[list_of_runs[run]].values()
            writer.writerow(row)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    runs_from_storage = get_run_ids_from_storage(storage_directory)
    create_abr_data_sheet(storage_directory)
    runs_in_sheet = read_abr_data_sheet(runs_from_storage, storage_directory)
    runs_to_save = get_unseen_run_ids(runs_from_storage, runs_in_sheet)
    runs_and_robots = create_dicts_to_add_to_sheet(runs_to_save, storage_directory)
    write_to_abr_sheet(runs_and_robots, storage_directory, runs_to_save)