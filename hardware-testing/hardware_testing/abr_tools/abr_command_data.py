"""Read ABR Logs and Extract Command Data Stats"""
from .abr_robots import ABR_IPS
from typing import Set, Dict, Any
import argparse
import os
import sys
import json
import statistics
from datetime import datetime, timedelta
from .abr_run_logs import get_run_ids_from_storage, get_unseen_run_ids
from .abr_read_logs import create_abr_data_sheet, read_abr_data_sheet, get_error_info, write_to_abr_sheet


def pipette_commands(file_results: Dict[str, str]) -> Dict[str, Any]:
    """Get pipette commands."""
    pipetteCmdList = (
        "aspirate",
        "configureNozzleLayout",
        "dispense",
        "pickUpTip",
        "dropTipInPlace",
        "blowout",
        "dropTip",
    )
    commandData = file_results.get("commands", "")
    all_pipettes = []
    for pipette in file_results.get("pipettes", {}):
        pipette_mount = pipette.get("mount", "")
        pipette_row = {
            "pipetteId":pipette.get("id", ""),
            "Serial #": file_results.get(pipette_mount, "")
        }
        all_pipettes.append(pipette_row)
    all_pipette_commands_list = []
    group_totals = {}
    for command in commandData:
            commandType = command["commandType"]
            if commandType in pipetteCmdList:
                # Time
                try:
                    create_time = datetime.strptime(
                        command.get("createdAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                    )
                    start_time = datetime.strptime(
                        command.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                    )
                    complete_time = datetime.strptime(
                        command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                    )
                    create_to_start = (start_time - create_time).total_seconds()
                    start_to_complete = (complete_time - start_time).total_seconds()
                except ValueError:
                    create_to_start = 0
                    start_to_complete = 0
                    continue
                pipette_id = command["params"].get("pipetteId", "")
                for pipette in all_pipettes:
                    if pipette["pipetteId"] == pipette_id:
                        pipette_serial = pipette["Serial #"]
                    else:
                        pipette_serial = ""
                flowRate = command["params"].get("flowRate", "")
                volume = command["params"].get("volume", "")
                group_key = (commandType, pipette_serial if pipette_serial else 'None',
                             flowRate, volume)    
                if group_key not in group_totals:
                    group_totals[group_key] = {
                        "create_to_start": create_to_start,
                        "start_to_complete": start_to_complete
                    }
                else:
                    group_totals[group_key]["create_to_start"] += create_to_start
                    group_totals[group_key]["start_to_complete"] += start_to_complete
                print(group_totals)
    return group_totals


def module_commads():
    """Get module commands."""
    module_commands = [
        "thermocycler/openLid",
        "heaterShaker/closeLabwareLatch",
        "thermocycler/closeLid",
        "heaterShaker/openLabwareLatch",
        "heaterShaker/setAndWaitForShakeSpeed",
        "heaterShaker/deactivateShaker",
        "temperatureModule/setTargetTemperature",
        "temperatureModule/waitForTemperature",
    ]


def motion_commands():
    """Get motion commands."""
    motion_commands = [
        "moveToWell",
        "moveToAddressableAreaForDropTip",
        "moveLabware",
        "home",
    ]


def setup_commands():
    """Get setup commands."""
    setup_commands = [
        "custom",
        "loadLabware",
        "loadModule",
        "loadPipette",
        "waitforResume",
    ]


def labware_offsets():
    """Get Labware offsets."""


def command_data_dictionary(runs_to_save: Set[str], storage_directory: str, i):
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
            ) = get_error_info(file_results)
            
            all_pipette_commands_list = pipette_commands(file_results)
            try:
                start_time = datetime.strptime(
                    file_results.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                adjusted_start_time = start_time - timedelta(hours=5)
                start_date = str(adjusted_start_time.date())
            except ValueError:
                continue  # Handle datetime parsing errors if necessary
            row = {
                "Robot": robot,
                "Run_ID": run_id,
                "Protocol_Name": protocol_name,
                "Software Version": software_version,
                "Date": start_date,
                "Errors": num_of_errors,
                "Error_Code": error_code,
                "Error_Type": error_type,
                "Error_Instrument": error_instrument,
                "Error_Level": error_level,
                "Left Mount": left_pipette,
                "Right Mount": right_pipette,
                "Extension": extension,
            }
            for item in all_pipette_commands_list:
                row_2 = {**row, **item}
                runs_and_robots[i] = row_2
                i = i + 1
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
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    try:
        sys.path.insert(0, storage_directory)
        import google_sheets_tool  # type: ignore[import]

        credentials_path = os.path.join(storage_directory, "abr.json")
    except ImportError:
        raise ImportError("Make sure google_sheets_tool.py is in storage directory.")
    try:
        google_sheet = google_sheets_tool.google_sheet(
            credentials_path, "ABR Command Data", tab_number=0
        )
        print("Connected to google sheet.")
    except FileNotFoundError:
        print("No google sheets credentials. Add credentials to storage notebook.")
    runs_from_storage = get_run_ids_from_storage(storage_directory)
    headers = ["Robot",
                "Run_ID",
                "Protocol_Name",
                "Software Version",
                "Date",
                "Errors",
                "Error_Code",
                "Error_Type",
                "Error_Instrument",
                "Error_Level",
                "Left Mount",
                "Right Mount",
                "Extension",
                "Command", 
                "Create to Start (sec)",
                "Start to Complete (sec)",
                "Flow Rate",
                "Volume",
                "Serial #",
                "Nozzle Layout"
    ]
    i = 0
    create_abr_data_sheet(storage_directory, "ABR-Command-Data.csv", headers)
    runs_in_sheet = read_abr_data_sheet(storage_directory, "ABR-Command-Data.csv", google_sheet)
    runs_to_save = get_unseen_run_ids(runs_from_storage, runs_in_sheet)
    runs_and_robots = command_data_dictionary(runs_to_save, storage_directory, i)
    write_to_abr_sheet(runs_and_robots, storage_directory, "ABR-Command-Data.csv", google_sheet)