"""Read ABR Logs and Extract Command Data Stats."""
from typing import Set, Dict, Any, List, Tuple, Union
import argparse
import os
import sys
import json
from datetime import datetime, timedelta
from . import read_robot_logs


def set_up_data_sheet(
    tab_number: int, google_sheet_name: str, commandTypes: str, headers: List
) -> Tuple[object, str]:
    """Connects to google sheet and creates local csv."""
    try:
        google_sheet = google_sheets_tool.google_sheet(
            credentials_path, google_sheet_name, tab_number=tab_number
        )
        print("Connected to google sheet.")
    except FileNotFoundError:
        print("No google sheets credentials. Add credentials to storage notebook.")
    local_file_str = google_sheet_name + "-" + commandTypes
    csv_name = read_robot_logs.create_abr_data_sheet(
        storage_directory, local_file_str, headers
    )

    return google_sheet, csv_name


def command_time(command: Dict[str, str]) -> Tuple[float, float]:
    """Calculate total create and complete time per command."""
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
    return create_to_start, start_to_complete


def pipette_commands(
    file_results: Dict[str, Any]
) -> Dict[Tuple[str, str, str, str, str], Dict[str, Any]]:
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
    commandData: List[Dict[str, Any]] = file_results.get("commands", "")
    pipettes: List[Dict[str, Any]] = file_results.get("pipettes", [])
    all_pipettes = [
        {
            "pipetteId": pipette.get("id", ""),
            "Serial #": file_results.get(pipette.get("mount", ""), ""),
        }
        for pipette in pipettes
        if isinstance(pipette, dict)
    ]

    group_totals = {}
    for command in commandData:
        commandType = command["commandType"]
        if commandType in pipetteCmdList:
            create_to_start, start_to_complete = command_time(command)
            pipette_id = command["params"].get("pipetteId", "")
            pipette_serial = next(
                (
                    pipette["Serial #"]
                    for pipette in all_pipettes
                    if pipette["pipetteId"] == pipette_id
                ),
                "",
            )
            flowRate = command["params"].get("flowRate", "")
            volume = command["params"].get("volume", "")
            if "configurationParams" in command["params"]:
                nozzleLayout = command["params"]["configurationParams"].get("style", "")
            else:
                nozzleLayout = "ALL"
            group_key = (commandType, pipette_serial, flowRate, volume, nozzleLayout)
            if group_key not in group_totals:
                group_totals[group_key] = {
                    "commandType": commandType,
                    "pipetteSerial": pipette_serial,
                    "flowRate": flowRate,
                    "volume": volume,
                    "nozzleLayout": nozzleLayout,
                    "create_to_start": create_to_start,
                    "start_to_complete": start_to_complete,
                    "count": 1,
                }
            else:
                group_totals[group_key]["commandType"] = commandType
                group_totals[group_key]["pipetteSerial"] = pipette_serial
                group_totals[group_key]["flowRate"] = flowRate
                group_totals[group_key]["volume"] = volume
                group_totals[group_key]["nozzleLayout"] = nozzleLayout
                group_totals[group_key]["create_to_start"] += create_to_start
                group_totals[group_key]["start_to_complete"] += start_to_complete
                group_totals[group_key]["count"] += 1
    return group_totals


def module_commands(
    file_results: Dict[str, Any]
) -> Dict[Tuple[Any, Union[Any, str], Any, Any], Dict[str, Any]]:
    """Get module commands."""
    moduleCmdList = [
        "thermocycler/openLid",
        "heaterShaker/closeLabwareLatch",
        "thermocycler/closeLid",
        "heaterShaker/openLabwareLatch",
        "heaterShaker/setAndWaitForShakeSpeed",
        "heaterShaker/deactivateShaker",
        "temperatureModule/setTargetTemperature",
        "temperatureModule/waitForTemperature",
    ]
    commandData: List[Dict[str, Any]] = file_results.get("commands", "")
    modules: List[Dict[str, Any]] = file_results.get("modules", {})
    all_modules = [
        {"moduleId": module.get("id", ""), "Serial #": module.get("serialNumber", "")}
        for module in modules
        if isinstance(module, dict)
    ]
    group_totals = {}
    for command in commandData:
        commandType = command["commandType"]
        if commandType in moduleCmdList:
            create_to_start, start_to_complete = command_time(command)
            module_id = command["params"].get("moduleId", "")
            module_serial = next(
                (
                    module["Serial #"]
                    for module in all_modules
                    if module["moduleId"] == module_id
                ),
                "",
            )
            temp = command["params"].get("celsius", "")
            rpm = command["params"].get("rpm", "")
            group_key = (commandType, module_serial, temp, rpm)
            if group_key not in group_totals:
                group_totals[group_key] = {
                    "commandType": commandType,
                    "moduleSerial": module_serial,
                    "temp_C": temp,
                    "speed_rpm": rpm,
                    "create_to_start": create_to_start,
                    "start_to_complete": start_to_complete,
                    "count": 1,
                }
            else:
                group_totals[group_key]["commandType"] = commandType
                group_totals[group_key]["moduleSerial"] = module_serial
                group_totals[group_key]["temp_C"] = temp
                group_totals[group_key]["speed_rpm"] = rpm
                group_totals[group_key]["create_to_start"] += create_to_start
                group_totals[group_key]["start_to_complete"] += start_to_complete
                group_totals[group_key]["count"] += 1
    return group_totals


def motion_commands(
    file_results: Dict[str, Any]
) -> Dict[Tuple[Any, Union[Any, str]], Dict[str, Any]]:
    """Get motion commands."""
    motionCmdList = [
        "moveToWell",
        "moveToAddressableAreaForDropTip",
        "moveLabware",
    ]
    commandData: List[Dict[str, Any]] = file_results.get("commands", "")
    labwares: List[Dict[str, Any]] = file_results.get("labware", "")
    all_labware = [
        {
            "id": labware.get("id", ""),
            "loadName": labware.get("loadName", ""),
            "displayName": labware.get("displayName", None),
        }
        for labware in labwares
        if isinstance(labware, dict)
    ]
    group_totals = {}
    for command in commandData:
        commandType = command["commandType"]
        if commandType in motionCmdList:
            create_to_start, start_to_complete = command_time(command)
            labware_id = command["params"].get("labwareId", "")
            labware_name = next(
                (
                    labware.get("displayName", labware.get("loadName", ""))
                    if labware["id"] == labware_id
                    and labware.get("displayName") is not None
                    else labware_id
                    for labware in all_labware
                ),
                "",
            )
            group_key = (commandType, labware_name)
            if group_key not in group_totals:
                group_totals[group_key] = {
                    "commandType": commandType,
                    "Labware": labware_name,
                    "create_to_start": create_to_start,
                    "start_to_complete": start_to_complete,
                    "count": 1,
                }
            else:
                group_totals[group_key]["commandType"] = commandType
                group_totals[group_key]["Labware"] = labware_name
                group_totals[group_key]["create_to_start"] += create_to_start
                group_totals[group_key]["start_to_complete"] += start_to_complete
                group_totals[group_key]["count"] += 1
    return group_totals


def setup_commands(
    file_results: Dict[str, Any]
) -> Dict[Tuple[Any, Any, Any], Dict[str, Any]]:
    """Get setup commands."""
    setupCmdList = [
        "custom",
        "loadLabware",
        "loadModule",
        "loadPipette",
        "waitforResume",
        "home",
    ]
    commandData: List[Dict[str, Any]] = file_results.get("commands", "")
    group_totals = {}
    for command in commandData:
        commandType = command["commandType"]
        if commandType in setupCmdList:
            create_to_start, start_to_complete = command_time(command)
            load_name = command["params"].get(
                "loadName",
                command["params"].get(
                    "model", command["params"].get("pipetteName", "")
                ),
            )
            try:
                load_location = command["params"]["location"]["slotName"]
            except KeyError:
                load_location = command["params"].get("mount", "")
            group_key = (commandType, load_name, load_location)
            if group_key not in group_totals:
                group_totals[group_key] = {
                    "commandType": commandType,
                    "Name": load_name,
                    "Location": load_location,
                    "create_to_start": create_to_start,
                    "start_to_complete": start_to_complete,
                    "count": 1,
                }
            else:
                group_totals[group_key]["commandType"] = commandType
                group_totals[group_key]["Name"] = load_name
                group_totals[group_key]["Location"] = load_location
                group_totals[group_key]["create_to_start"] += create_to_start
                group_totals[group_key]["start_to_complete"] += start_to_complete
                group_totals[group_key]["count"] += 1
    return group_totals


def command_data_dictionary(
    runs_to_save: Set[str], storage_directory: str, i: int, n: int, m: int, p: int
) -> Tuple[Dict, Dict, Dict, Dict]:
    """Pull data from run files and format into a dictionary."""
    runs_and_instrument_commands = {}
    runs_and_module_commands = {}
    runs_and_setup_commands = {}
    runs_and_move_commands = {}
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

            all_pipette_commands_list = pipette_commands(file_results)
            all_module_commands_list = module_commands(file_results)
            all_setup_commands_list = setup_commands(file_results)
            all_motion_commands_list = motion_commands(file_results)
            try:
                start_time = datetime.strptime(
                    file_results.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                adjusted_start_time = start_time - timedelta(hours=5)
                start_date = str(adjusted_start_time.date())
            except ValueError:
                continue  # Handle datetime parsing errors if necessary
            instrument_row = {
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
            module_row = {
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
            }
            for pip_command in all_pipette_commands_list.values():
                row_2p = {**instrument_row, **pip_command}
                runs_and_instrument_commands[i] = row_2p
                i = i + 1
            for mod_command in all_module_commands_list.values():
                row_2m = {**module_row, **mod_command}
                runs_and_module_commands[n] = row_2m
                n = n + 1
            for setup_command in all_setup_commands_list.values():
                row_2s = {**module_row, **setup_command}
                runs_and_setup_commands[m] = row_2s
                m = m + 1
            for motion_command in all_motion_commands_list.values():
                row_2 = {**module_row, **motion_command}
                runs_and_move_commands[p] = row_2
                p = p + 1
    return (
        runs_and_instrument_commands,
        runs_and_module_commands,
        runs_and_setup_commands,
        runs_and_move_commands,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Name of google sheet",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    google_sheet_name = args.google_sheet_name[0]
    try:
        sys.path.insert(0, storage_directory)
        import google_sheets_tool  # type: ignore[import]

        credentials_path = os.path.join(storage_directory, "credentials.json")
    except ImportError:
        raise ImportError("Make sure google_sheets_tool.py is in storage directory.")

    instrument_headers = [
        "Robot",
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
        "Pipette Serial",
        "Flow Rate",
        "Volume",
        "nozzleLayout",
        "Create to Start (sec)",
        "Start to Complete (sec)",
        "Count",
    ]
    module_headers = [
        "Robot",
        "Run_ID",
        "Protocol_Name",
        "Software Version",
        "Date",
        "Errors",
        "Error_Code",
        "Error_Type",
        "Error_Instrument",
        "Error_Level",
        "Command",
        "Module Serial",
        "temp_C",
        "speed_rpm",
        "Create to Start (sec)",
        "Start to Complete (sec)",
        "Count",
    ]
    setup_headers = [
        "Robot",
        "Run_ID",
        "Protocol_Name",
        "Software Version",
        "Date",
        "Errors",
        "Error_Code",
        "Error_Type",
        "Error_Instrument",
        "Error_Level",
        "Command",
        "Name",
        "Location",
        "Create to Start (sec)",
        "Start to Complete (sec)",
        "Count",
    ]
    movement_headers = [
        "Robot",
        "Run_ID",
        "Protocol_Name",
        "Software Version",
        "Date",
        "Errors",
        "Error_Code",
        "Error_Type",
        "Error_Instrument",
        "Error_Level",
        "Command",
        "Labware",
        "Create to Start (sec)",
        "Start to Complete (sec)",
        "Count",
    ]

    google_sheet_instruments, csv_instruments = set_up_data_sheet(
        0, google_sheet_name, "Instruments", instrument_headers
    )
    google_sheet_modules, csv_modules = set_up_data_sheet(
        1, google_sheet_name, "Modules", module_headers
    )
    google_sheet_setup, csv_setup = set_up_data_sheet(
        2, google_sheet_name, "Setup", setup_headers
    )
    google_sheet_movement, csv_movement = set_up_data_sheet(
        3, google_sheet_name, "Movement", movement_headers
    )
    runs_from_storage = read_robot_logs.get_run_ids_from_storage(storage_directory)
    i = 0
    n = 0
    m = 0
    p = 0
    runs_in_sheet = read_robot_logs.read_abr_data_sheet(
        storage_directory, csv_instruments, google_sheet_instruments
    )
    runs_to_save = read_robot_logs.get_unseen_run_ids(runs_from_storage, runs_in_sheet)
    (
        runs_and_instrument_commands,
        runs_and_module_commands,
        runs_and_setup_commands,
        runs_and_move_commands,
    ) = command_data_dictionary(runs_to_save, storage_directory, i, m, n, p)
    read_robot_logs.write_to_abr_sheet(
        runs_and_instrument_commands,
        storage_directory,
        csv_instruments,
        google_sheet_instruments,
    )
    read_robot_logs.write_to_abr_sheet(
        runs_and_module_commands, storage_directory, csv_modules, google_sheet_modules
    )
    read_robot_logs.write_to_abr_sheet(
        runs_and_setup_commands, storage_directory, csv_setup, google_sheet_setup
    )
    read_robot_logs.write_to_abr_sheet(
        runs_and_move_commands, storage_directory, csv_movement, google_sheet_movement
    )
