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

def get_instruments_and_modules(file_results: Dict[str, str]):
    all_modules = dict()
    for module in file_results["modules"]:
        module_type = module["model"]
        try:
            module_serial = module["serialNumber"]
        except ValueError:
            module_serial = ""
        

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
        fields = ['Run_ID', 'Robot', "Protocol_Name", "Date", "Start_Time", "End_Time", "Run_Time (min)", "Errors", "Error_Code", "Error_Type", "Error_Instrument"]
        writer = csv.DictWriter(csvfile, fieldnames = fields)
        writer.writeheader()
        
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
            num_of_errors, error_type, error_code, error_instrument = get_error_info(file_results)
            try:
                start_time = datetime.strptime(file_results["startedAt"], "%Y-%m-%dT%H:%M:%S.%f%z")
                start_date = start_time.date()
                complete_time = datetime.strptime(file_results["completedAt"], "%Y-%m-%dT%H:%M:%S.%f%z")
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
                   "Date": start_date, 
                   "Start_Time": start_time,
                   "End_Time": complete_time,
                   "Run_Time (min)": run_time_min, 
                   "Errors": num_of_errors,
                   "Error_Code": error_code,
                   "Error_Type": error_type,
                   "Error_Instrument": error_instrument
                   }
            runs_and_robots[run_id] = row
            all_commands = get_command_info(file_results)
            combined_run_command = {**runs_and_robots, **all_commands}
    return runs_and_robots
            

def read_abr_data_sheet(runs_from_storage: Set[str], storage_directory: str) -> Set[str]:
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

def write_to_abr_sheet(runs_and_robots: Dict[str, str], storage_directory: str):
    sheet_location = os.path.join(storage_directory,"ABR-run-data.csv")
    with open(sheet_location, 'w', newline ='') as csvfile:
        fields = ['Run_ID', 'Robot', "Protocol_Name", "Date", "Start_Time", "End_Time", "Run_Time (min)", "Errors", "Error_Code", "Error_Type", "Error_Instrument"]
        writer = csv.DictWriter(csvfile, fieldnames = fields)
        writer.writeheader()
        for row in runs_and_robots.values():
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
    runs_from_storage = get_run_ids_from_storage(args.storage_directory[0])
    create_abr_data_sheet(args.storage_directory[0])
    runs_in_sheet = read_abr_data_sheet(runs_from_storage, args.storage_directory[0])
    runs_to_save = get_unseen_run_ids(runs_from_storage, runs_in_sheet)
    runs_and_robots = create_dicts_to_add_to_sheet(runs_to_save, args.storage_directory[0])
    write_to_abr_sheet(runs_and_robots, args.storage_directory[0])